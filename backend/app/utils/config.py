import os
from dotenv import load_dotenv

load_dotenv()

# LLM Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROK_API_KEY = os.getenv("GROK_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "grok")  # "openai", "gemini", or "grok"
LLM_MODEL = os.getenv("LLM_MODEL", "grok-3-mini")

# Repo cloning
CLONE_BASE_DIR = os.getenv("CLONE_BASE_DIR", "/tmp/ai_explainer_repos")

# File processing
MAX_FILE_SIZE_KB = int(os.getenv("MAX_FILE_SIZE_KB", "100"))  # 100KB per file
CHUNK_SIZE_LINES = int(os.getenv("CHUNK_SIZE_LINES", "80"))   # lines per chunk
MAX_FILES_PER_REPO = int(os.getenv("MAX_FILES_PER_REPO", "50"))

# Embeddings
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
FAISS_INDEX_DIR = os.getenv("FAISS_INDEX_DIR", "/tmp/ai_explainer_faiss")

# Redis (optional caching)
REDIS_URL = os.getenv("REDIS_URL", "")

# Supported file extensions
SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go",
    ".rs", ".cpp", ".c", ".cs", ".rb", ".php", ".swift",
    ".kt", ".scala", ".r", ".sh", ".yaml", ".yml", ".json",
    ".toml", ".md"
}

# Folders to ignore
IGNORED_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv",
    "env", "dist", "build", ".next", ".nuxt", "coverage",
    ".pytest_cache", ".mypy_cache", "target", "vendor",
    ".idea", ".vscode", "out", "bin", "obj"
}
