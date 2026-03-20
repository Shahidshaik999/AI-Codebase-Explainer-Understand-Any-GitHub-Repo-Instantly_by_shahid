import os
import logging
from typing import List, Dict, Any
from app.utils.config import (
    SUPPORTED_EXTENSIONS, IGNORED_DIRS,
    MAX_FILE_SIZE_KB, MAX_FILES_PER_REPO
)

logger = logging.getLogger(__name__)


def _is_ignored(path: str) -> bool:
    """Check if any path component is in the ignored dirs set."""
    parts = path.replace("\\", "/").split("/")
    return any(part in IGNORED_DIRS for part in parts)


def _get_language(ext: str) -> str:
    lang_map = {
        ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
        ".jsx": "React/JSX", ".tsx": "React/TSX", ".java": "Java",
        ".go": "Go", ".rs": "Rust", ".cpp": "C++", ".c": "C",
        ".cs": "C#", ".rb": "Ruby", ".php": "PHP", ".swift": "Swift",
        ".kt": "Kotlin", ".scala": "Scala", ".r": "R",
        ".sh": "Shell", ".yaml": "YAML", ".yml": "YAML",
        ".json": "JSON", ".toml": "TOML", ".md": "Markdown",
    }
    return lang_map.get(ext, "Unknown")


def read_repo_files(repo_path: str) -> List[Dict[str, Any]]:
    """
    Walk the repo directory and return a list of file metadata + content dicts.
    Each dict: { path, relative_path, language, size_kb, content, lines }
    """
    files = []
    max_size_bytes = MAX_FILE_SIZE_KB * 1024

    for root, dirs, filenames in os.walk(repo_path):
        # Prune ignored directories in-place so os.walk skips them
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

        rel_root = os.path.relpath(root, repo_path)
        if _is_ignored(rel_root):
            continue

        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower()
            if ext not in SUPPORTED_EXTENSIONS:
                continue

            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, repo_path).replace("\\", "/")

            if _is_ignored(rel_path):
                continue

            try:
                size_bytes = os.path.getsize(full_path)
                if size_bytes > max_size_bytes:
                    logger.debug(f"Skipping large file: {rel_path} ({size_bytes/1024:.1f}KB)")
                    continue

                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                files.append({
                    "path": full_path,
                    "relative_path": rel_path,
                    "language": _get_language(ext),
                    "extension": ext,
                    "size_kb": round(size_bytes / 1024, 2),
                    "content": content,
                    "lines": content.count("\n") + 1,
                })

            except (OSError, IOError) as e:
                logger.warning(f"Could not read {rel_path}: {e}")

            if len(files) >= MAX_FILES_PER_REPO:
                logger.info(f"Reached MAX_FILES_PER_REPO={MAX_FILES_PER_REPO}, stopping.")
                return files

    # Sort: larger/more-central files first (by size desc)
    files.sort(key=lambda f: f["size_kb"], reverse=True)
    return files


def get_folder_structure(repo_path: str) -> str:
    """Return a compact tree string of the repo structure (depth ≤ 3)."""
    lines = []
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        depth = root.replace(repo_path, "").count(os.sep)
        if depth > 3:
            dirs.clear()
            continue
        indent = "  " * depth
        folder_name = os.path.basename(root) or "."
        lines.append(f"{indent}{folder_name}/")
        sub_indent = "  " * (depth + 1)
        for f in filenames[:20]:  # cap per folder
            lines.append(f"{sub_indent}{f}")
    return "\n".join(lines)
