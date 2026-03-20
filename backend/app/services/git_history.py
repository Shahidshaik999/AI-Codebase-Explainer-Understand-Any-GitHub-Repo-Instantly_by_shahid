"""
Feature 2: Codebase Time Machine
──────────────────────────────────
Extract commit history using GitPython and generate AI insights
for each commit explaining what changed, why, and the impact.
"""
import logging
from datetime import datetime
from typing import List, Optional

import git

from app.models.response_model import CommitInfo, HistoryRequest, HistoryResult
from app.services.llm_service import _call_llm, _extract_json, SYSTEM_ANALYST, _explain_mode_instruction
from app.services.repo_cloner import clone_repo, get_repo_name

logger = logging.getLogger(__name__)


def _safe_date(commit) -> str:
    """Convert git commit date to ISO string safely."""
    try:
        return datetime.fromtimestamp(commit.committed_date).strftime("%Y-%m-%d %H:%M")
    except Exception:
        return "unknown"


def _get_commit_files(commit) -> tuple[List[str], int, int]:
    """
    Return (changed_files, insertions, deletions) for a commit.
    Diffs against the first parent; for initial commit diffs against empty tree.
    """
    try:
        if commit.parents:
            diff = commit.parents[0].diff(commit, create_patch=False)
        else:
            # Initial commit — diff against empty tree
            diff = commit.diff(git.NULL_TREE, create_patch=False)

        files = []
        insertions = 0
        deletions = 0
        for d in diff:
            path = d.b_path or d.a_path
            if path:
                files.append(path)
            try:
                stats = commit.stats.files.get(path, {})
                insertions += stats.get("insertions", 0)
                deletions += stats.get("deletions", 0)
            except Exception:
                pass
        return files[:20], insertions, deletions  # cap file list
    except Exception as e:
        logger.warning(f"Could not get diff for commit {commit.hexsha[:7]}: {e}")
        return [], 0, 0


def _generate_commit_insight(
    commit_message: str,
    files_changed: List[str],
    insertions: int,
    deletions: int,
    explain_mode: str,
) -> str:
    """Ask LLM to explain a single commit in plain language."""
    files_str = ", ".join(files_changed[:10]) if files_changed else "unknown"
    prompt = f"""
Commit message: {commit_message}
Files changed: {files_str}
Lines added: {insertions}, Lines removed: {deletions}

{_explain_mode_instruction(explain_mode)}

Respond with ONLY a JSON object:
{{
  "insight": "<1-2 sentence explanation of what this commit did, why it was made, and its impact>"
}}
"""
    try:
        raw = _call_llm(prompt, SYSTEM_ANALYST)
        data = _extract_json(raw)
        return data.get("insight", commit_message)
    except Exception as e:
        logger.warning(f"LLM insight failed for commit: {e}")
        return commit_message


def _generate_evolution_summary(
    commits: List[CommitInfo],
    repo_name: str,
    explain_mode: str,
) -> str:
    """Generate an overall evolution narrative from all commits."""
    commit_summaries = "\n".join(
        f"- [{c.date}] {c.message[:80]} ({len(c.files_changed)} files)"
        for c in commits[:20]
    )
    prompt = f"""
Repository: {repo_name}

Recent commit history:
{commit_summaries}

{_explain_mode_instruction(explain_mode)}

Respond with ONLY a JSON object:
{{
  "evolution": "<3-5 sentence narrative describing how this codebase has evolved, major milestones, and development patterns>"
}}
"""
    try:
        raw = _call_llm(prompt, SYSTEM_ANALYST)
        data = _extract_json(raw)
        return data.get("evolution", "")
    except Exception as e:
        logger.warning(f"Evolution summary failed: {e}")
        return ""


def get_git_history(request: HistoryRequest) -> HistoryResult:
    """
    Main entry point for the Time Machine feature.
    Clones repo (or reuses cache), extracts commits, generates AI insights.
    """
    repo_path = clone_repo(request.repo_url)
    repo_name = get_repo_name(request.repo_url)

    try:
        repo = git.Repo(repo_path)
    except git.InvalidGitRepositoryError:
        raise ValueError(f"Not a valid git repository: {repo_path}")

    # Fetch commits from the active branch
    try:
        commits_raw = list(repo.iter_commits(max_count=request.limit))
    except Exception as e:
        raise ValueError(f"Could not read commit history: {e}")

    commit_infos: List[CommitInfo] = []

    for commit in commits_raw:
        files_changed, insertions, deletions = _get_commit_files(commit)

        # Generate AI insight for each commit (batched to avoid rate limits)
        insight = _generate_commit_insight(
            commit_message=commit.message.strip(),
            files_changed=files_changed,
            insertions=insertions,
            deletions=deletions,
            explain_mode=request.explain_mode,
        )

        commit_infos.append(CommitInfo(
            sha=commit.hexsha,
            short_sha=commit.hexsha[:7],
            message=commit.message.strip().split("\n")[0],  # first line only
            author=str(commit.author.name),
            date=_safe_date(commit),
            files_changed=files_changed,
            insertions=insertions,
            deletions=deletions,
            ai_insight=insight,
        ))

    # Overall evolution summary
    evolution = _generate_evolution_summary(commit_infos, repo_name, request.explain_mode)

    return HistoryResult(
        repo_url=request.repo_url,
        repo_name=repo_name,
        total_commits_fetched=len(commit_infos),
        commits=commit_infos,
        overall_evolution=evolution,
    )
