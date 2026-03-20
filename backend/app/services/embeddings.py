"""
Embedding service using FAISS for vector storage and retrieval.
Supports OpenAI embeddings (text-embedding-3-small) or a local fallback.
"""
import os
import json
import logging
import hashlib
import pickle
from typing import List, Dict, Any, Tuple, Optional

import numpy as np

from app.utils.config import (
    OPENAI_API_KEY, EMBEDDING_MODEL, FAISS_INDEX_DIR, LLM_PROVIDER
)

logger = logging.getLogger(__name__)

# Lazy imports — only loaded when embeddings are actually used
_faiss = None
_openai_client = None


def _get_faiss():
    global _faiss
    if _faiss is None:
        import faiss as faiss_lib
        _faiss = faiss_lib
    return _faiss


def _embed_openai(texts: List[str]) -> List[List[float]]:
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    response = _openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


def _embed_gemini(texts: List[str]) -> List[List[float]]:
    import google.generativeai as genai
    from app.utils.config import GEMINI_API_KEY
    genai.configure(api_key=GEMINI_API_KEY)
    embeddings = []
    for text in texts:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
        )
        embeddings.append(result["embedding"])
    return embeddings


def embed_texts(texts: List[str]) -> np.ndarray:
    """Embed a list of texts and return as numpy array."""
    if LLM_PROVIDER == "gemini":
        vecs = _embed_gemini(texts)
    elif LLM_PROVIDER == "grok":
        # xAI doesn't have an embeddings endpoint yet — use a lightweight local model
        vecs = _embed_local(texts)
    else:
        vecs = _embed_openai(texts)
    return np.array(vecs, dtype="float32")


def _embed_local(texts: List[str]) -> List[List[float]]:
    """
    Fallback local embeddings using sentence-transformers.
    Install with: pip install sentence-transformers
    """
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        return model.encode(texts, show_progress_bar=False).tolist()
    except ImportError:
        # If sentence-transformers not installed, use a simple TF-IDF-style hash embedding
        logger.warning("sentence-transformers not installed; using hash-based fallback embeddings.")
        return _embed_hash(texts)


def _embed_hash(texts: List[str]) -> List[List[float]]:
    """Deterministic 128-dim hash embedding — not semantic, but functional for basic search."""
    import hashlib
    dim = 128
    result = []
    for text in texts:
        vec = []
        for i in range(dim):
            h = hashlib.md5(f"{i}:{text[:500]}".encode()).hexdigest()
            vec.append(int(h[:8], 16) / 0xFFFFFFFF - 0.5)
        result.append(vec)
    return result


# ---------------------------------------------------------------------------
# FAISS index management
# ---------------------------------------------------------------------------

def _index_path(repo_url: str) -> str:
    url_hash = hashlib.md5(repo_url.encode()).hexdigest()[:10]
    os.makedirs(FAISS_INDEX_DIR, exist_ok=True)
    return os.path.join(FAISS_INDEX_DIR, f"index_{url_hash}")


def build_index(repo_url: str, chunks: List[Dict[str, Any]]) -> None:
    """
    Build a FAISS index from code chunks and persist to disk.
    Each chunk is embedded; metadata is stored alongside.
    """
    faiss = _get_faiss()
    texts = [
        f"File: {c['file_path']}\n{c['content']}" for c in chunks
    ]
    logger.info(f"Embedding {len(texts)} chunks for {repo_url}...")
    vectors = embed_texts(texts)

    dim = vectors.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(vectors)

    base = _index_path(repo_url)
    faiss.write_index(index, base + ".faiss")
    with open(base + ".meta.pkl", "wb") as f:
        pickle.dump(chunks, f)

    logger.info(f"FAISS index saved to {base}.faiss ({len(chunks)} vectors, dim={dim})")


def search_index(
    repo_url: str,
    query: str,
    top_k: int = 8,
) -> List[Tuple[Dict[str, Any], float]]:
    """
    Search the FAISS index for chunks most relevant to `query`.
    Returns list of (chunk_dict, distance) tuples.
    """
    faiss = _get_faiss()
    base = _index_path(repo_url)
    index_file = base + ".faiss"
    meta_file = base + ".meta.pkl"

    if not os.path.exists(index_file):
        raise FileNotFoundError(f"No FAISS index found for {repo_url}. Run Phase 2 first.")

    index = faiss.read_index(index_file)
    with open(meta_file, "rb") as f:
        chunks = pickle.load(f)

    query_vec = embed_texts([query])
    distances, indices = index.search(query_vec, top_k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < len(chunks):
            results.append((chunks[idx], float(dist)))
    return results


def index_exists(repo_url: str) -> bool:
    base = _index_path(repo_url)
    return os.path.exists(base + ".faiss")
