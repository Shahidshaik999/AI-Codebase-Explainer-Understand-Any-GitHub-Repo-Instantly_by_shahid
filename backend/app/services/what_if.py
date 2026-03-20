"""
Feature 1: What-If Impact Analyzer
────────────────────────────────────
Given a hypothetical change query (e.g. "What if I remove the auth module?"),
retrieve semantically relevant code chunks via FAISS and ask the LLM to reason
about cascading impact, risk level, and recommendations.
"""
import logging
from typing import Any, Dict, List

from app.models.response_model import WhatIfRequest, WhatIfResult
from app.services import embeddings as emb_service
from app.services.chunker import chunk_files
from app.services.file_reader import read_repo_files
from app.services.llm_service import _call_llm, _extract_json, SYSTEM_ANALYST, _explain_mode_instruction
from app.services.repo_cloner import clone_repo, get_repo_name

logger = logging.getLogger(__name__)

# How many chunks to retrieve for context
TOP_K = 10


def analyze_what_if(request: WhatIfRequest) -> WhatIfResult:
    """
    Main entry point for the What-If analyzer.
    1. Ensure FAISS index exists (build if needed)
    2. Retrieve top-k relevant chunks for the query
    3. Send structured prompt to LLM
    4. Parse and return structured impact result
    """
    repo_url = request.repo_url
    query = request.query.strip()

    # ── Step 1: Ensure index ──────────────────────────────────────────────
    if not emb_service.index_exists(repo_url):
        logger.info(f"[WhatIf] Building FAISS index for {repo_url}")
        repo_path = clone_repo(repo_url)
        files = read_repo_files(repo_path)
        chunks = chunk_files(files)
        emb_service.build_index(repo_url, chunks)

    # ── Step 2: Retrieve relevant chunks ─────────────────────────────────
    results = emb_service.search_index(repo_url, query, top_k=TOP_K)
    context_chunks = []
    for chunk, score in results:
        context_chunks.append(
            f"### {chunk['file_path']} (lines {chunk['start_line']}-{chunk['end_line']})\n"
            f"{chunk['content']}"
        )
    context_text = "\n\n---\n\n".join(context_chunks)

    repo_name = get_repo_name(repo_url)

    # ── Step 3: LLM prompt ───────────────────────────────────────────────
    prompt = f"""
Repository: {repo_name}

Hypothetical Change: {query}

Relevant Code Context:
{context_text}

{_explain_mode_instruction(request.explain_mode)}

Analyze the impact of this hypothetical change and respond with ONLY a JSON object:
{{
  "affected_files": ["<file1>", "<file2>", ...],
  "breaking_features": ["<feature or functionality that would break>", ...],
  "risk_level": "<low | medium | high | critical>",
  "explanation": "<detailed explanation of cascading effects, 3-5 sentences>",
  "recommendations": ["<actionable recommendation 1>", "<recommendation 2>", ...],
  "confidence": "<low | medium | high>"
}}

Rules:
- affected_files: list only files that would be directly or indirectly impacted
- breaking_features: concrete user-facing features or API endpoints that would break
- risk_level: critical if core functionality breaks, high if major features affected, medium if partial, low if isolated
- recommendations: concrete steps to safely make this change
- confidence: how confident you are given the available context
"""

    raw = _call_llm(prompt, SYSTEM_ANALYST)
    data = _extract_json(raw)

    return WhatIfResult(
        query=query,
        affected_files=data.get("affected_files", []),
        breaking_features=data.get("breaking_features", []),
        risk_level=data.get("risk_level", "medium"),
        explanation=data.get("explanation", ""),
        recommendations=data.get("recommendations", []),
        confidence=data.get("confidence", "medium"),
    )
