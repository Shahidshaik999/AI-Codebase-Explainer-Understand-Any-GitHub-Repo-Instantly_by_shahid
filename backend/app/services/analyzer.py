"""
Main orchestration service — ties together cloning, reading, chunking,
LLM analysis, embeddings, and dependency parsing.
"""
import ast
import logging
import os
import re
from collections import defaultdict
from typing import Any, Dict, List, Optional

from app.models.response_model import (
    AnalysisResult, DependencyEdge, DependencyGraph,
    FolderSummary, ImportantFile,
)
from app.services import embeddings as emb_service
from app.services.chunker import chunk_files, select_representative_chunks
from app.services.file_reader import get_folder_structure, read_repo_files
from app.services.llm_service import analyze_chunks, analyze_folder, answer_question
from app.services.repo_cloner import clone_repo, get_repo_name

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Phase 1 — MVP analysis
# ---------------------------------------------------------------------------

def run_phase1(
    repo_url: str,
    explain_mode: str = "senior",
) -> AnalysisResult:
    repo_path = clone_repo(repo_url)
    repo_name = get_repo_name(repo_url)
    files = read_repo_files(repo_path)

    if not files:
        raise ValueError("No supported source files found in this repository.")

    folder_structure = get_folder_structure(repo_path)
    chunks = chunk_files(files)
    representative = select_representative_chunks(chunks, max_chunks=15)

    raw = analyze_chunks(representative, folder_structure, repo_name, explain_mode)

    important_files = []
    for f in raw.get("important_files", []):
        # Guard: LLM sometimes returns non-dict items
        if not isinstance(f, dict):
            continue
        path = f.get("path") or f.get("file") or f.get("name") or ""
        reason = f.get("reason") or f.get("description") or f.get("role") or ""
        if not path:
            continue
        important_files.append(ImportantFile(
            path=str(path),
            reason=str(reason),
            language=f.get("language"),
            size_kb=next(
                (fi["size_kb"] for fi in files if fi["relative_path"] == path),
                None,
            ),
        ))

    # Ensure string fields are actually strings (LLM can return objects)
    def _str(val):
        if val is None:
            return None
        if isinstance(val, str):
            return val
        if isinstance(val, dict):
            return val.get("description") or val.get("summary") or val.get("text") or str(val)
        return str(val)

    return AnalysisResult(
        repo_url=repo_url,
        repo_name=repo_name,
        summary=_str(raw.get("summary", "")),
        tech_stack=[str(t) for t in raw.get("tech_stack", []) if isinstance(t, str)],
        entry_points=[str(e) for e in raw.get("entry_points", []) if isinstance(e, str)],
        important_files=important_files,
        execution_flow=_str(raw.get("execution_flow")),
        where_to_start=_str(raw.get("where_to_start")),
        explain_mode=explain_mode,
        total_files_analyzed=len(files),
    )


# ---------------------------------------------------------------------------
# Phase 2 — Smart explainer (embeddings + folder summaries)
# ---------------------------------------------------------------------------

def run_phase2(
    repo_url: str,
    explain_mode: str = "senior",
) -> AnalysisResult:
    # Start with Phase 1 result
    result = run_phase1(repo_url, explain_mode)

    repo_path = clone_repo(repo_url)
    files = read_repo_files(repo_path)
    chunks = chunk_files(files)

    # Build FAISS index
    if not emb_service.index_exists(repo_url):
        emb_service.build_index(repo_url, chunks)

    # Folder-level summaries
    folder_files: Dict[str, List[str]] = defaultdict(list)
    for f in files:
        folder = os.path.dirname(f["relative_path"]) or "."
        folder_files[folder].append(os.path.basename(f["relative_path"]))

    folder_summaries = []
    for folder, fnames in list(folder_files.items())[:15]:  # cap at 15 folders
        summary_text = analyze_folder(folder, fnames, explain_mode)
        folder_summaries.append(
            FolderSummary(path=folder, summary=summary_text, file_count=len(fnames))
        )

    result.folder_summaries = folder_summaries
    return result


# ---------------------------------------------------------------------------
# Phase 3 — Dependency graph via AST
# ---------------------------------------------------------------------------

def _parse_python_imports(content: str, file_path: str) -> List[str]:
    """Extract imported module names from Python source."""
    imports = []
    try:
        tree = ast.parse(content)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module.split(".")[0])
    except SyntaxError:
        pass
    return imports


def _parse_js_imports(content: str) -> List[str]:
    """Extract imported paths from JS/TS source using regex."""
    pattern = r"""(?:import|require)\s*(?:\(?\s*['"]([^'"]+)['"]\s*\)?|.*?from\s+['"]([^'"]+)['"])"""
    matches = re.findall(pattern, content)
    return [m[0] or m[1] for m in matches if (m[0] or m[1])]


def build_dependency_graph(repo_url: str) -> DependencyGraph:
    repo_path = clone_repo(repo_url)
    files = read_repo_files(repo_path)

    nodes = [
        {"id": f["relative_path"], "label": os.path.basename(f["relative_path"]),
         "language": f["language"], "size_kb": f["size_kb"]}
        for f in files
    ]
    file_paths = {f["relative_path"] for f in files}
    edges: List[DependencyEdge] = []

    for f in files:
        if f["extension"] == ".py":
            imports = _parse_python_imports(f["content"], f["relative_path"])
        elif f["extension"] in {".js", ".ts", ".jsx", ".tsx"}:
            imports = _parse_js_imports(f["content"])
        else:
            continue

        for imp in imports:
            # Try to resolve relative imports to actual files in the repo
            for candidate in file_paths:
                candidate_base = os.path.splitext(os.path.basename(candidate))[0]
                if imp == candidate_base or imp.endswith(f"/{candidate_base}"):
                    if candidate != f["relative_path"]:
                        edges.append(
                            DependencyEdge(
                                source=f["relative_path"],
                                target=candidate,
                                type="import",
                            )
                        )
                        break

    return DependencyGraph(nodes=nodes, edges=edges)


def run_phase3(
    repo_url: str,
    explain_mode: str = "senior",
) -> AnalysisResult:
    result = run_phase2(repo_url, explain_mode)
    result.dependency_graph = build_dependency_graph(repo_url)
    return result


# ---------------------------------------------------------------------------
# Phase 4 — Chat / RAG
# ---------------------------------------------------------------------------

def chat_with_repo(
    repo_url: str,
    question: str,
    history: List[Dict[str, str]],
    explain_mode: str = "senior",
) -> Dict[str, Any]:
    if not emb_service.index_exists(repo_url):
        # Build index on demand
        repo_path = clone_repo(repo_url)
        files = read_repo_files(repo_path)
        chunks = chunk_files(files)
        emb_service.build_index(repo_url, chunks)

    results = emb_service.search_index(repo_url, question, top_k=8)
    context_chunks = [
        f"File: {chunk['file_path']}\n{chunk['content']}"
        for chunk, _ in results
    ]
    sources = list({chunk["file_path"] for chunk, _ in results})

    repo_name = get_repo_name(repo_url)
    answer, llm_sources = answer_question(
        question, context_chunks, history, repo_name, explain_mode
    )
    return {"answer": answer, "sources": list(set(sources + llm_sources))}
