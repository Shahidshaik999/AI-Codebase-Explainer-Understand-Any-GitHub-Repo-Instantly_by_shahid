"""
Multi-repo comparison endpoint — powered by Meta Llama 4.
Compares two GitHub repos: architecture, tech stack, code quality, strengths/weaknesses.
This is the hackathon differentiator feature.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.repo_cloner import clone_repo, get_repo_name
from app.services.file_reader import read_repo_files, get_folder_structure
from app.services.chunker import chunk_files, select_representative_chunks
from app.services.llm_service import _call_llm, _extract_json, SYSTEM_ANALYST

router = APIRouter()


class CompareRequest(BaseModel):
    repo_url_a: str
    repo_url_b: str
    explain_mode: str = "senior"


@router.post("/api/compare")
async def compare_repos(req: CompareRequest):
    try:
        # Clone both repos
        path_a = clone_repo(req.repo_url_a)
        path_b = clone_repo(req.repo_url_b)

        name_a = get_repo_name(req.repo_url_a)
        name_b = get_repo_name(req.repo_url_b)

        # Read files from both
        files_a = read_repo_files(path_a)
        files_b = read_repo_files(path_b)

        # Get folder structures
        struct_a = get_folder_structure(path_a)
        struct_b = get_folder_structure(path_b)

        # Chunk and select representative samples
        chunks_a = select_representative_chunks(chunk_files(files_a), max_chunks=8)
        chunks_b = select_representative_chunks(chunk_files(files_b), max_chunks=8)

        def fmt_chunks(chunks):
            sections = []
            for c in chunks:
                lines = c["content"].splitlines()[:30]
                sections.append(
                    f"### {c['file_path']}\n```{c['language'].lower()}\n"
                    + "\n".join(lines) + "\n```"
                )
            return "\n\n".join(sections)

        prompt = f"""
You are comparing two GitHub repositories side by side.

=== REPO A: {name_a} ===
Folder structure:
{struct_a}

Code samples:
{fmt_chunks(chunks_a)}

=== REPO B: {name_b} ===
Folder structure:
{struct_b}

Code samples:
{fmt_chunks(chunks_b)}

Compare these two repositories and respond with ONLY a JSON object:
{{
  "repo_a": {{
    "name": "{name_a}",
    "summary": "<2-3 sentence summary>",
    "tech_stack": ["<tech1>", ...],
    "architecture_pattern": "<e.g. MVC, microservices, monolith>",
    "strengths": ["<strength1>", "<strength2>", "<strength3>"],
    "weaknesses": ["<weakness1>", "<weakness2>"],
    "code_quality_score": <1-10>,
    "complexity": "<low|medium|high>"
  }},
  "repo_b": {{
    "name": "{name_b}",
    "summary": "<2-3 sentence summary>",
    "tech_stack": ["<tech1>", ...],
    "architecture_pattern": "<e.g. MVC, microservices, monolith>",
    "strengths": ["<strength1>", "<strength2>", "<strength3>"],
    "weaknesses": ["<weakness1>", "<weakness2>"],
    "code_quality_score": <1-10>,
    "complexity": "<low|medium|high>"
  }},
  "comparison": {{
    "similarities": ["<similarity1>", "<similarity2>"],
    "key_differences": ["<difference1>", "<difference2>", "<difference3>"],
    "better_for_learning": "<repo_a or repo_b>",
    "better_for_production": "<repo_a or repo_b>",
    "recommendation": "<which to choose and why, 2-3 sentences>"
  }}
}}
"""
        raw = _call_llm(prompt, SYSTEM_ANALYST)
        result = _extract_json(raw)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
