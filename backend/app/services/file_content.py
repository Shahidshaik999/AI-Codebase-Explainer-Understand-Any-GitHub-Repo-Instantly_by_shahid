import os
import logging
from app.services.repo_cloner import clone_repo
from app.services.llm_service import _call_llm, _extract_json, SYSTEM_ANALYST

logger = logging.getLogger(__name__)

MAX_LINES = 600
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
    ".pdf", ".zip", ".tar", ".gz", ".whl", ".exe", ".dll",
    ".so", ".class", ".pyc", ".pyo", ".bin", ".lock",
}

EXT_LANG = {
    ".py": "python", ".js": "javascript", ".jsx": "jsx",
    ".ts": "typescript", ".tsx": "tsx", ".go": "go",
    ".rs": "rust", ".java": "java", ".css": "css",
    ".scss": "scss", ".html": "html", ".json": "json",
    ".md": "markdown", ".yml": "yaml", ".yaml": "yaml",
    ".sh": "bash", ".toml": "toml", ".txt": "text",
    ".env": "bash", ".gitignore": "text",
}


def _is_binary(path: str) -> bool:
    _, ext = os.path.splitext(path)
    return ext.lower() in BINARY_EXTENSIONS


def _mode_hint(explain_mode: str) -> str:
    if explain_mode == "beginner":
        return "Use simple language for a junior developer."
    return "Be concise and technical for a senior engineer."


def get_file_content(repo_url: str, file_path: str, explain_mode: str = "senior") -> dict:
    """Read a file from the cloned repo and generate an AI summary."""
    local_root = clone_repo(repo_url)

    safe_path = os.path.normpath(file_path).lstrip("/\\")
    abs_path = os.path.join(local_root, safe_path)

    if not abs_path.startswith(local_root):
        raise ValueError("Invalid file path.")
    if not os.path.isfile(abs_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    if _is_binary(abs_path):
        return {
            "file_path": file_path,
            "content": None,
            "summary": "Binary file — preview not available.",
            "language": "binary",
            "line_count": 0,
            "size_kb": round(os.path.getsize(abs_path) / 1024, 1),
            "truncated": False,
        }

    try:
        with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
    except Exception as e:
        raise ValueError(f"Could not read file: {e}")

    truncated = len(lines) > MAX_LINES
    content = "".join(lines[:MAX_LINES])
    line_count = len(lines)
    size_kb = round(os.path.getsize(abs_path) / 1024, 1)

    _, ext = os.path.splitext(abs_path)
    language = EXT_LANG.get(ext.lower(), "text")
    summary = _summarize_file(file_path, content, language, explain_mode)

    return {
        "file_path": file_path,
        "content": content,
        "summary": summary,
        "language": language,
        "line_count": line_count,
        "size_kb": size_kb,
        "truncated": truncated,
    }


def _summarize_file(file_path: str, content: str, language: str, explain_mode: str) -> str:
    preview = "\n".join(content.splitlines()[:80])
    prompt = f"""
File: {file_path}
Language: {language}

```{language}
{preview}
```

{_mode_hint(explain_mode)}

Respond with ONLY a JSON object:
{{"summary": "<2-3 sentences: what this file does, its purpose, and its role in the system>"}}
"""
    try:
        raw = _call_llm(prompt, SYSTEM_ANALYST)
        data = _extract_json(raw)
        return data.get("summary", "")
    except Exception as e:
        logger.warning(f"File summary failed for {file_path}: {e}")
        return "Could not generate summary."


def explain_code_snippet(code: str, file_path: str, explain_mode: str = "senior") -> dict:
    """Explain a selected code snippet with complexity rating."""
    prompt = f"""
File: {file_path}

Selected code:
```
{code[:3000]}
```

{_mode_hint(explain_mode)}

Respond with ONLY a JSON object:
{{
  "explanation": "<what this code does, its inputs/outputs, and its role in the system>",
  "complexity": "low | medium | high"
}}
"""
    try:
        raw = _call_llm(prompt, SYSTEM_ANALYST)
        data = _extract_json(raw)
        return {
            "explanation": data.get("explanation", ""),
            "complexity": data.get("complexity", "medium"),
        }
    except Exception as e:
        logger.warning(f"Code explain failed: {e}")
        return {"explanation": "Could not generate explanation.", "complexity": "medium"}


def search_files(repo_url: str, query: str) -> list:
    """Return file paths whose name or path contains the query string (case-insensitive)."""
    local_root = clone_repo(repo_url)
    q = query.lower().strip()
    results = []
    IGNORE = {"node_modules", ".git", "dist", "build", "__pycache__", ".venv", "venv"}

    for dirpath, dirnames, filenames in os.walk(local_root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE]
        for fname in filenames:
            rel = os.path.relpath(os.path.join(dirpath, fname), local_root)
            rel = rel.replace("\\", "/")
            if q in rel.lower():
                results.append(rel)
        if len(results) >= 50:
            break

    return sorted(results)
