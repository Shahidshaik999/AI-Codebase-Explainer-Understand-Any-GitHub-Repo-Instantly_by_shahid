from typing import List, Dict, Any
from app.utils.config import CHUNK_SIZE_LINES


def chunk_file(file: Dict[str, Any], chunk_size: int = CHUNK_SIZE_LINES) -> List[Dict[str, Any]]:
    """
    Split a file's content into chunks of `chunk_size` lines.
    Returns list of chunk dicts with metadata.
    """
    lines = file["content"].splitlines()
    chunks = []
    for i in range(0, len(lines), chunk_size):
        chunk_lines = lines[i: i + chunk_size]
        chunks.append({
            "file_path": file["relative_path"],
            "language": file["language"],
            "chunk_index": len(chunks),
            "start_line": i + 1,
            "end_line": i + len(chunk_lines),
            "content": "\n".join(chunk_lines),
        })
    return chunks


def chunk_files(files: List[Dict[str, Any]], chunk_size: int = CHUNK_SIZE_LINES) -> List[Dict[str, Any]]:
    """Chunk all files and return a flat list of chunks."""
    all_chunks = []
    for file in files:
        all_chunks.extend(chunk_file(file, chunk_size))
    return all_chunks


def select_representative_chunks(
    chunks: List[Dict[str, Any]],
    max_chunks: int = 30,
) -> List[Dict[str, Any]]:
    """
    Select a representative subset of chunks for LLM analysis.
    Prioritizes first chunks of each file (entry points / imports are usually at top).
    """
    # Group by file, take first chunk of each file first
    seen_files: Dict[str, List] = {}
    for chunk in chunks:
        seen_files.setdefault(chunk["file_path"], []).append(chunk)

    selected = []
    # First pass: first chunk of every file
    for file_chunks in seen_files.values():
        selected.append(file_chunks[0])

    # Second pass: fill remaining slots with subsequent chunks
    for file_chunks in seen_files.values():
        for chunk in file_chunks[1:]:
            if len(selected) >= max_chunks:
                break
            selected.append(chunk)
        if len(selected) >= max_chunks:
            break

    return selected[:max_chunks]
