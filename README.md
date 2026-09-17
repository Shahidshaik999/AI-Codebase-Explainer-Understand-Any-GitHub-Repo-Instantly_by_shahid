# Codebase AI

> **Understand any codebase. Instantly.**
>
> AI-powered code intelligence for developers.

Paste a public GitHub URL. Get a complete AI-powered breakdown — architecture, file intelligence, RAG chat, impact analysis, git history, execution flow and system design — in under 90 seconds.

---

## What it does

Most developers spend days onboarding to a new codebase. Codebase AI cuts that to minutes.

It clones any public GitHub repository, analyzes the code with an LLM, and gives you:

| Feature | Description |
|---|---|
| **AI Summary** | Plain-English project overview with tech stack detection |
| **Key Files** | AI-ranked important files with explanations |
| **Code Explorer** | IDE-style file explorer with syntax highlighting |
| **AI Code Explain** | Select any code block → AI explanation with complexity rating |
| **RAG Chat** | Ask anything about the repo — answers grounded in source code |
| **Impact Lab** | "What if I remove X?" — AI impact analysis |
| **Git History** | Commit timeline with AI insight per commit |
| **Execution Flow** | AST-extracted call graph with React Flow visualization |
| **Architecture** | Auto-generated system design document |

---

## Demo

https://github.com/user-attachments/assets/3e5b669b-9a6c-466b-a63c-7d67635fbb78

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS + Lucide React |
| Visualization | React Flow |
| State | React Context + useReducer + localStorage |
| Backend | FastAPI (Python 3.11+) |
| LLM | Groq API (llama-3.1-8b-instant) |
| Embeddings | FAISS + sentence-transformers |
| Git | GitPython |
| AST | Python `ast` module |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Groq API key](https://console.groq.com) (free tier)
- Git

### 1. Clone

```bash
git clone https://github.com/your-username/codebase-ai.git
cd codebase-ai
```

### 2. Backend

```bash
cd backend

# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Add your GROK_API_KEY to .env
```

### 3. Start backend

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open: http://localhost:5173

---

## Environment Variables

### Backend — `backend/.env`

```env
LLM_PROVIDER=grok
LLM_MODEL=llama-3.1-8b-instant

GROK_API_KEY=gsk_your_key_here
OPENAI_API_KEY=
GEMINI_API_KEY=

CLONE_BASE_DIR=C:/tmp/repos
MAX_FILE_SIZE_KB=100
MAX_FILES_PER_REPO=50
MAX_CHUNKS=15
CHUNK_SIZE_LINES=80
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze` | Analyze a repository |
| POST | `/api/chat` | RAG chat |
| POST | `/api/what-if` | Impact analysis |
| POST | `/api/history` | Git commit history |
| POST | `/api/flow` | Execution flow graph |
| POST | `/api/system-design` | System design |
| POST | `/api/repo-structure` | Directory tree |
| POST | `/api/file-content` | File content + AI summary |
| POST | `/api/explain-code` | Explain selected code |
| POST | `/api/search-files` | Search files |

Full interactive docs: http://localhost:8000/docs

---

## Supported LLM Providers

| Provider | Config value | Notes |
|---|---|---|
| Groq | `grok` | Fastest, free tier |
| OpenAI | `openai` | GPT-4o-mini recommended |
| Google Gemini | `gemini` | gemini-1.5-flash recommended |

Change `LLM_PROVIDER` in `backend/.env` to switch.

---

## License

MIT — free to use, modify, and distribute.

---

Built with FastAPI · React · Groq · FAISS · React Flow · Lucide
