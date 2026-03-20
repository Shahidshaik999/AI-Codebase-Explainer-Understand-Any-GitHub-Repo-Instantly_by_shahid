import json
import logging
import re
from typing import Any, Dict, List, Optional
from app.utils.config import (
    LLM_PROVIDER, LLM_MODEL,
    OPENAI_API_KEY, GEMINI_API_KEY, GROK_API_KEY
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Provider abstraction
# ---------------------------------------------------------------------------

def _call_openai(prompt: str, system: str, model: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content


def _call_grok(prompt: str, system: str, model: str) -> str:
    """
    Groq API — OpenAI-compatible, extremely fast inference.
    Base URL: https://api.groq.com/openai/v1
    """
    from openai import OpenAI
    client = OpenAI(
        api_key=GROK_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )
    json_prompt = prompt + "\n\nIMPORTANT: Your entire response must be a single valid JSON object. No markdown, no explanation, no code fences — raw JSON only."
    response = client.chat.completions.create(
        model=model or "llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": json_prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content


def _call_gemini(prompt: str, system: str, model: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel(
        model_name=model or "gemini-1.5-flash",
        system_instruction=system,
    )
    response = gemini_model.generate_content(
        prompt,
        generation_config={"temperature": 0.2},
    )
    return response.text


def _call_llm(prompt: str, system: str) -> str:
    """Route to the configured LLM provider."""
    if LLM_PROVIDER == "gemini":
        return _call_gemini(prompt, system, LLM_MODEL or "gemini-1.5-flash")
    if LLM_PROVIDER == "grok":
        return _call_grok(prompt, system, LLM_MODEL or "grok-3-mini")
    return _call_openai(prompt, system, LLM_MODEL or "gpt-4o-mini")


def _extract_json(raw: str) -> Dict[str, Any]:
    """Extract JSON from LLM response, handling markdown fences and thinking tags."""
    # Strip <think>...</think> blocks (Grok reasoning models)
    cleaned = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?\s*", "", cleaned).strip().rstrip("`").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find the first JSON object in the string
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        raise ValueError(f"Could not parse JSON from LLM response: {raw[:400]}")


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------

SYSTEM_ANALYST = (
    "You are an expert software architect and code analyst. "
    "You ALWAYS respond with valid JSON only — no prose, no markdown fences. "
    "Your JSON must be parseable by Python's json.loads()."
)


def _explain_mode_instruction(mode: str) -> str:
    if mode == "beginner":
        return (
            "Explain concepts as if the reader is a junior developer with 0-1 years experience. "
            "Use simple language, avoid jargon, and add analogies where helpful."
        )
    return (
        "Explain concepts for a senior engineer. Be precise, technical, and concise. "
        "Mention design patterns, architectural decisions, and trade-offs."
    )


def analyze_chunks(
    chunks: List[Dict[str, Any]],
    folder_structure: str,
    repo_name: str,
    explain_mode: str = "senior",
) -> Dict[str, Any]:
    """
    Send representative code chunks to the LLM and get a structured analysis.
    """
    code_sections = []
    for chunk in chunks:
        # Trim each chunk to 40 lines max in the prompt to stay within TPM limits
        lines = chunk["content"].splitlines()[:40]
        trimmed = "\n".join(lines)
        code_sections.append(
            f"### File: {chunk['file_path']} (lines {chunk['start_line']}-{chunk['end_line']})\n"
            f"```{chunk['language'].lower()}\n{trimmed}\n```"
        )
    code_block = "\n\n".join(code_sections)

    prompt = f"""
Repository: {repo_name}

Folder structure:
{folder_structure}

Code samples:
{code_block}

{_explain_mode_instruction(explain_mode)}

Analyze this codebase and respond with ONLY a JSON object matching this exact schema:
{{
  "summary": "<2-4 sentence overview of what this project does>",
  "tech_stack": ["<technology1>", "<technology2>", ...],
  "entry_points": ["<file_path>", ...],
  "important_files": [
    {{"path": "<file_path>", "reason": "<why it matters>", "language": "<lang>"}},
    ...
  ],
  "execution_flow": "<step-by-step description of how the app runs>",
  "where_to_start": "<which file a new developer should read first and why>"
}}
"""
    raw = _call_llm(prompt, SYSTEM_ANALYST)
    return _extract_json(raw)


def analyze_folder(
    folder_path: str,
    files_summary: List[str],
    explain_mode: str = "senior",
) -> str:
    """Generate a one-sentence summary for a folder."""
    prompt = f"""
Folder: {folder_path}
Files: {', '.join(files_summary)}

{_explain_mode_instruction(explain_mode)}

Respond with ONLY a JSON object:
{{"summary": "<one sentence describing what this folder contains and its role>"}}
"""
    raw = _call_llm(prompt, SYSTEM_ANALYST)
    data = _extract_json(raw)
    return data.get("summary", "")


def answer_question(
    question: str,
    context_chunks: List[str],
    history: List[Dict[str, str]],
    repo_name: str,
    explain_mode: str = "senior",
) -> str:
    """Answer a user question about the repo using retrieved context chunks."""
    context = "\n\n---\n\n".join(context_chunks[:8])
    history_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in history[-6:]
    )

    prompt = f"""
Repository: {repo_name}

Relevant code context:
{context}

Conversation history:
{history_text}

{_explain_mode_instruction(explain_mode)}

User question: {question}

Respond with ONLY a JSON object:
{{"answer": "<your detailed answer>", "sources": ["<file_path1>", ...]}}
"""
    raw = _call_llm(prompt, SYSTEM_ANALYST)
    data = _extract_json(raw)
    return data.get("answer", ""), data.get("sources", [])
