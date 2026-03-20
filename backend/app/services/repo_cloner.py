import os
import shutil
import hashlib
import logging
from urllib.parse import urlparse
import git
from app.utils.config import CLONE_BASE_DIR

logger = logging.getLogger(__name__)


def _repo_dir(repo_url: str) -> str:
    """Deterministic local path for a given repo URL."""
    url_hash = hashlib.md5(repo_url.encode()).hexdigest()[:10]
    parsed = urlparse(repo_url)
    repo_name = parsed.path.strip("/").replace("/", "_")
    return os.path.join(CLONE_BASE_DIR, f"{repo_name}_{url_hash}")


def clone_repo(repo_url: str, force_reclone: bool = False) -> str:
    """
    Clone a GitHub repository to a local directory.
    Returns the local path to the cloned repo.
    Skips cloning if already present (unless force_reclone=True).
    """
    os.makedirs(CLONE_BASE_DIR, exist_ok=True)
    local_path = _repo_dir(repo_url)

    if os.path.exists(local_path):
        if force_reclone:
            logger.info(f"Force re-cloning: removing {local_path}")
            shutil.rmtree(local_path)
        else:
            logger.info(f"Repo already cloned at {local_path}, reusing.")
            return local_path

    logger.info(f"Cloning {repo_url} → {local_path}")
    try:
        git.Repo.clone_from(
            repo_url,
            local_path,
            depth=1,           # shallow clone for speed
            single_branch=True,
        )
    except git.exc.GitCommandError as e:
        raise ValueError(f"Failed to clone repository: {e}") from e

    return local_path


def cleanup_repo(repo_url: str) -> None:
    """Remove a cloned repository from disk."""
    local_path = _repo_dir(repo_url)
    if os.path.exists(local_path):
        shutil.rmtree(local_path)
        logger.info(f"Cleaned up {local_path}")


def get_repo_name(repo_url: str) -> str:
    """Extract owner/repo from a GitHub URL."""
    parsed = urlparse(repo_url)
    parts = parsed.path.strip("/").split("/")
    if len(parts) >= 2:
        return f"{parts[0]}/{parts[1]}"
    return parsed.path.strip("/")
