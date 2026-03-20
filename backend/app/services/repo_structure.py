import os
import logging
from app.services.repo_cloner import clone_repo

logger = logging.getLogger(__name__)

IGNORE_DIRS = {
    "node_modules", ".git", "dist", "build", "__pycache__",
    ".venv", "venv", ".env", ".idea", ".vscode", "coverage",
    ".next", ".nuxt", "out", ".cache", "tmp", "temp",
}

IGNORE_EXTENSIONS = {".pyc", ".pyo", ".class", ".o", ".so", ".dll", ".exe"}


def _build_tree(path: str, max_depth: int = 8, depth: int = 0) -> dict:
    name = os.path.basename(path)
    if depth > max_depth:
        return None

    if os.path.isfile(path):
        _, ext = os.path.splitext(name)
        if ext in IGNORE_EXTENSIONS:
            return None
        return {"name": name, "type": "file"}

    if os.path.isdir(path):
        if name in IGNORE_DIRS:
            return None
        children = []
        try:
            entries = sorted(os.scandir(path), key=lambda e: (e.is_file(), e.name.lower()))
        except PermissionError:
            return None

        for entry in entries:
            child = _build_tree(entry.path, max_depth, depth + 1)
            if child is not None:
                children.append(child)

        return {"name": name, "type": "folder", "children": children}

    return None


def get_repo_structure(repo_url: str) -> dict:
    local_path = clone_repo(repo_url)
    logger.info(f"Building tree for {local_path}")
    tree = _build_tree(local_path)
    # Use repo name as root label instead of full path
    if tree:
        tree["name"] = os.path.basename(local_path.rstrip("/\\"))
    return tree or {"name": "root", "type": "folder", "children": []}
