"""
Feature: Auto System Design Generator
──────────────────────────────────────
Given a repo's summary, tech stack, and execution flow (already produced by
Phase 1 analysis), ask the LLM to produce a structured system design document
covering architecture, components, data flow, scaling, bottlenecks, and
improvement suggestions.
"""
import logging
from typing import List, Optional

from app.models.response_model import SystemDesignRequest, SystemDesignResult, SystemComponent
from app.services.llm_service import _call_llm, _extract_json, SYSTEM_ANALYST, _explain_mode_instruction
from app.services.repo_cloner import clone_repo, get_repo_name
from app.services.file_reader import read_repo_files, get_folder_structure
from app.services.chunker import chunk_files, select_representative_chunks
from app.services.llm_service import analyze_chunks

logger = logging.getLogger(__name__)


def generate_system_design(request: SystemDesignRequest) -> SystemDesignResult:
    """
    Main entry point.
    If the caller already has summary/tech_stack/execution_flow from a prior
    Phase-1 analysis, those are used directly.  Otherwise we run a lightweight
    Phase-1 pass to obtain them.
    """
    repo_url = request.repo_url
    repo_name = get_repo_name(repo_url)

    summary = (request.summary or "").strip()
    tech_stack: List[str] = request.tech_stack or []
    execution_flow = (request.execution_flow or "").strip()

    # ── Auto-fetch if caller didn't supply context ────────────────────────
    if not summary:
        logger.info("[SystemDesign] No summary provided — running quick Phase-1 analysis")
        repo_path = clone_repo(repo_url)
        files = read_repo_files(repo_path)
        folder_structure = get_folder_structure(repo_path)
        chunks = chunk_files(files)
        representative = select_representative_chunks(chunks, max_chunks=10)
        raw = analyze_chunks(representative, folder_structure, repo_name, request.explain_mode)
        summary = raw.get("summary", "")
        tech_stack = raw.get("tech_stack", [])
        execution_flow = raw.get("execution_flow", "")

    tech_stack_str = ", ".join(tech_stack) if tech_stack else "unknown"

    # ── LLM prompt ────────────────────────────────────────────────────────
    prompt = f"""
You are a senior system design engineer and software architect.

Analyze the following project and produce a comprehensive system design.

Project: {repo_name}
Summary: {summary}
Tech Stack: {tech_stack_str}
Execution Flow: {execution_flow}

{_explain_mode_instruction(request.explain_mode)}

Return ONLY a single valid JSON object — no markdown, no prose outside the JSON:
{{
  "architecture_overview": "<2-4 sentence description of the overall architecture pattern (monolith, microservices, serverless, MVC, etc.) and how the system is structured>",
  "components": [
    {{
      "name": "<component name>",
      "type": "<frontend | backend | database | cache | queue | external | devops>",
      "description": "<what this component does and its role in the system>",
      "technology": "<specific technology used, e.g. React, FastAPI, PostgreSQL>"
    }}
  ],
  "data_flow": [
    "Step 1: <describe first step in the request/data lifecycle>",
    "Step 2: <next step>",
    "..."
  ],
  "scaling_suggestions": [
    "<concrete scaling strategy 1>",
    "<concrete scaling strategy 2>"
  ],
  "bottlenecks": [
    "<identified bottleneck or single point of failure 1>",
    "<bottleneck 2>"
  ],
  "improvements": [
    "<actionable improvement suggestion 1>",
    "<improvement 2>"
  ],
  "architecture_pattern": "<monolith | microservices | serverless | event-driven | layered | other>"
}}

Rules:
- components: include ALL major system parts visible from the tech stack and code
- data_flow: minimum 4 steps, trace a typical user request end-to-end
- scaling_suggestions: be specific (e.g. "Add Redis caching for LLM responses", not just "use caching")
- bottlenecks: identify real risks (e.g. single DB, synchronous LLM calls, no queue)
- improvements: actionable, prioritised by impact
"""

    raw = _call_llm(prompt, SYSTEM_ANALYST)
    data = _extract_json(raw)

    def _to_str_list(items) -> List[str]:
        """
        Normalise a list that may contain plain strings OR dicts
        (e.g. {"description": "...", "priority": "high"}) into plain strings.
        The LLM occasionally returns structured objects instead of strings.
        """
        result = []
        for item in items or []:
            if isinstance(item, str):
                result.append(item)
            elif isinstance(item, dict):
                # Prefer "description", fall back to first string value
                text = item.get("description") or item.get("text") or item.get("suggestion") or ""
                if not text:
                    text = next((v for v in item.values() if isinstance(v, str)), str(item))
                result.append(text)
            else:
                result.append(str(item))
        return result

    components = [
        SystemComponent(
            name=c.get("name", ""),
            type=c.get("type", "backend"),
            description=c.get("description", ""),
            technology=c.get("technology", ""),
        )
        for c in data.get("components", [])
        if isinstance(c, dict)
    ]

    return SystemDesignResult(
        repo_url=repo_url,
        repo_name=repo_name,
        architecture_overview=data.get("architecture_overview", ""),
        components=components,
        data_flow=_to_str_list(data.get("data_flow", [])),
        scaling_suggestions=_to_str_list(data.get("scaling_suggestions", [])),
        bottlenecks=_to_str_list(data.get("bottlenecks", [])),
        improvements=_to_str_list(data.get("improvements", [])),
        architecture_pattern=data.get("architecture_pattern", "monolith"),
        explain_mode=request.explain_mode,
    )
