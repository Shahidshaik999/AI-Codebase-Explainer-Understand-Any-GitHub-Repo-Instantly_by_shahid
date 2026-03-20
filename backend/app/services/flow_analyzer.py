"""
Feature 3: Execution Flow Simulator
──────────────────────────────────────
Uses Python AST + regex to extract function definitions, class definitions,
and call relationships, then builds a React Flow-compatible graph.
"""
import ast
import logging
import os
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from app.models.response_model import (
    ExecutionFlowGraph, FlowEdge, FlowNode, FlowRequest, FlowResult,
)
from app.services.file_reader import read_repo_files
from app.services.repo_cloner import clone_repo, get_repo_name

logger = logging.getLogger(__name__)

# Max nodes to keep the graph readable
MAX_NODES = 80
MAX_EDGES = 150


# ── Python AST extraction ────────────────────────────────────────────────────

class _PythonVisitor(ast.NodeVisitor):
    """Extract functions, classes, and call relationships from Python AST."""

    def __init__(self, file_path: str):
        self.file_path = file_path
        self.nodes: List[FlowNode] = []
        self.edges: List[FlowEdge] = []
        self._scope_stack: List[str] = []  # track current class/function scope

    def _node_id(self, name: str) -> str:
        return f"{self.file_path}::{name}"

    def _current_scope(self) -> Optional[str]:
        return self._scope_stack[-1] if self._scope_stack else None

    def visit_ClassDef(self, node: ast.ClassDef):
        nid = self._node_id(node.name)
        self.nodes.append(FlowNode(
            id=nid, label=node.name, type="class",
            file_path=self.file_path, language="Python",
        ))
        # Inheritance edges
        for base in node.bases:
            if isinstance(base, ast.Name):
                self.edges.append(FlowEdge(
                    source=nid,
                    target=self._node_id(base.id),
                    type="inherit",
                ))
        self._scope_stack.append(nid)
        self.generic_visit(node)
        self._scope_stack.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef):
        nid = self._node_id(node.name)
        self.nodes.append(FlowNode(
            id=nid, label=node.name, type="function",
            file_path=self.file_path, language="Python",
        ))
        # Edge from enclosing scope → this function
        scope = self._current_scope()
        if scope:
            self.edges.append(FlowEdge(source=scope, target=nid, type="call"))

        self._scope_stack.append(nid)
        self.generic_visit(node)
        self._scope_stack.pop()

    visit_AsyncFunctionDef = visit_FunctionDef  # treat async same as sync

    def visit_Call(self, node: ast.Call):
        """Record function calls within the current scope."""
        scope = self._current_scope()
        if not scope:
            self.generic_visit(node)
            return

        callee = None
        if isinstance(node.func, ast.Name):
            callee = self._node_id(node.func.id)
        elif isinstance(node.func, ast.Attribute):
            callee = self._node_id(node.func.attr)

        if callee and callee != scope:
            self.edges.append(FlowEdge(source=scope, target=callee, type="call"))

        self.generic_visit(node)


def _extract_python_flow(content: str, file_path: str) -> Tuple[List[FlowNode], List[FlowEdge]]:
    """Parse Python file and return (nodes, edges)."""
    try:
        tree = ast.parse(content)
        visitor = _PythonVisitor(file_path)
        visitor.visit(tree)
        return visitor.nodes, visitor.edges
    except SyntaxError:
        return [], []


# ── JS/TS extraction via regex ───────────────────────────────────────────────

_JS_FUNC_RE = re.compile(
    r"""(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(|"""
    r"""(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(.*?\)\s*=>|"""
    r"""(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function""",
    re.MULTILINE,
)
_JS_CLASS_RE = re.compile(r"class\s+(\w+)(?:\s+extends\s+(\w+))?", re.MULTILINE)
_JS_CALL_RE = re.compile(r"(\w+)\s*\(", re.MULTILINE)


def _extract_js_flow(content: str, file_path: str, language: str) -> Tuple[List[FlowNode], List[FlowEdge]]:
    nodes: List[FlowNode] = []
    edges: List[FlowEdge] = []

    def nid(name: str) -> str:
        return f"{file_path}::{name}"

    # Classes
    for m in _JS_CLASS_RE.finditer(content):
        cls_name = m.group(1)
        nodes.append(FlowNode(id=nid(cls_name), label=cls_name, type="class",
                               file_path=file_path, language=language))
        if m.group(2):  # extends
            edges.append(FlowEdge(source=nid(cls_name), target=nid(m.group(2)), type="inherit"))

    # Functions
    for m in _JS_FUNC_RE.finditer(content):
        fn_name = m.group(1) or m.group(2) or m.group(3)
        if fn_name:
            nodes.append(FlowNode(id=nid(fn_name), label=fn_name, type="function",
                                   file_path=file_path, language=language))

    return nodes, edges


# ── File-level import edges ──────────────────────────────────────────────────

def _file_import_edges(files: List[Dict[str, Any]]) -> List[FlowEdge]:
    """Build file→file import edges (reuse logic from analyzer.py pattern)."""
    edges: List[FlowEdge] = []
    file_paths = {f["relative_path"] for f in files}

    for f in files:
        ext = f["extension"]
        if ext == ".py":
            try:
                tree = ast.parse(f["content"])
                for node in ast.walk(tree):
                    if isinstance(node, ast.ImportFrom) and node.module:
                        mod = node.module.split(".")[0]
                        for candidate in file_paths:
                            if os.path.splitext(os.path.basename(candidate))[0] == mod:
                                if candidate != f["relative_path"]:
                                    edges.append(FlowEdge(
                                        source=f["relative_path"],
                                        target=candidate,
                                        type="import",
                                    ))
                                    break
            except SyntaxError:
                pass
        elif ext in {".js", ".ts", ".jsx", ".tsx"}:
            pattern = r"""(?:import|require)\s*(?:\(?\s*['"]([^'"]+)['"]\s*\)?|.*?from\s+['"]([^'"]+)['"])"""
            for m in re.finditer(pattern, f["content"]):
                imp = m.group(1) or m.group(2)
                if imp:
                    base = os.path.splitext(os.path.basename(imp))[0]
                    for candidate in file_paths:
                        if os.path.splitext(os.path.basename(candidate))[0] == base:
                            if candidate != f["relative_path"]:
                                edges.append(FlowEdge(
                                    source=f["relative_path"],
                                    target=candidate,
                                    type="import",
                                ))
                                break
    return edges


# ── Main orchestrator ────────────────────────────────────────────────────────

def build_execution_flow(request: FlowRequest) -> FlowResult:
    """
    Build a detailed execution flow graph for the repository.
    Combines file-level nodes, function/class nodes, and call/import edges.
    """
    repo_path = clone_repo(request.repo_url)
    repo_name = get_repo_name(request.repo_url)
    files = read_repo_files(repo_path)

    all_nodes: List[FlowNode] = []
    all_edges: List[FlowEdge] = []

    # ── File-level nodes ──────────────────────────────────────────────────
    for f in files:
        all_nodes.append(FlowNode(
            id=f["relative_path"],
            label=os.path.basename(f["relative_path"]),
            type="file",
            file_path=f["relative_path"],
            language=f["language"],
        ))

    # ── Function/class nodes + intra-file edges ───────────────────────────
    for f in files[:30]:  # cap to avoid huge graphs
        ext = f["extension"]
        if ext == ".py":
            nodes, edges = _extract_python_flow(f["content"], f["relative_path"])
        elif ext in {".js", ".ts", ".jsx", ".tsx"}:
            nodes, edges = _extract_js_flow(f["content"], f["relative_path"], f["language"])
        else:
            continue
        all_nodes.extend(nodes)
        all_edges.extend(edges)

    # ── File-level import edges ───────────────────────────────────────────
    all_edges.extend(_file_import_edges(files))

    # ── Deduplicate nodes and edges ───────────────────────────────────────
    seen_node_ids: Set[str] = set()
    unique_nodes: List[FlowNode] = []
    for n in all_nodes:
        if n.id not in seen_node_ids:
            seen_node_ids.add(n.id)
            unique_nodes.append(n)

    seen_edge_keys: Set[str] = set()
    unique_edges: List[FlowEdge] = []
    for e in all_edges:
        key = f"{e.source}→{e.target}:{e.type}"
        # Only keep edges where both endpoints exist
        if key not in seen_edge_keys and e.source in seen_node_ids and e.target in seen_node_ids:
            seen_edge_keys.add(key)
            unique_edges.append(e)

    # ── Cap size ──────────────────────────────────────────────────────────
    unique_nodes = unique_nodes[:MAX_NODES]
    unique_edges = unique_edges[:MAX_EDGES]

    # ── Determine entry point ─────────────────────────────────────────────
    entry_point = request.entry_file
    if not entry_point:
        # Heuristic: prefer main.py, index.js, app.py, etc.
        ENTRY_CANDIDATES = ["main.py", "app.py", "index.js", "index.ts", "server.py", "run.py"]
        for candidate in ENTRY_CANDIDATES:
            for n in unique_nodes:
                if n.type == "file" and os.path.basename(n.file_path) == candidate:
                    entry_point = n.id
                    break
            if entry_point:
                break

    graph = ExecutionFlowGraph(
        nodes=unique_nodes,
        edges=unique_edges,
        entry_point=entry_point,
    )

    return FlowResult(
        repo_url=request.repo_url,
        graph=graph,
        summary=f"Extracted {len(unique_nodes)} nodes and {len(unique_edges)} edges from {len(files)} files.",
    )
