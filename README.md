# Codebase AI

> **Understand any codebase. Instantly.**
>
> AI-powered code intelligence for developers.

<div align="center">

### 🚀 [**Live Demo → codebase-ai.vercel.app**](https://ai-codebase-explainer-understand-an-inky.vercel.app/)

Paste any public GitHub URL. Get AI-powered architecture, file intelligence, RAG chat, and more in under 90 seconds.

![Codebase AI](https://img.shields.io/badge/Codebase_AI-Live-5B4BFF?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=for-the-badge)

</div>

---

## What it does

Most developers spend days onboarding to a new codebase. Codebase AI cuts that to minutes.

Paste a public GitHub repository URL → get a complete AI-powered breakdown:

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
| Backend | FastAPI (Python) |
| LLM | Groq API (llama-3.1-8b-instant) |
| Embeddings | FAISS vector search |
| Git | GitPython |
| AST | Python `ast` module |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## 🌐 Live URLs

| Service | URL |
|---|---|
| **Frontend** | https://ai-codebase-explainer-understand-an-inky.vercel.app/ |
| **Backend API** | https://ai-codebase-explainer-understand-any-v9wa.onrender.com |
| **API Docs** | https://ai-codebase-explainer-understand-any-v9wa.onrender.com/docs |

---

## Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Groq API key](https://console.groq.com) (free tier)
- Git

### 1. Clone
```bash
git clone https://github.com/Shahidshaik999/AI-Codebase-Explainer-Understand-Any-GitHub-Repo-Instantly_by_shahid.git
cd AI-Codebase-Explainer-Understand-Any-GitHub-Repo-Instantly_by_shahid
```

### 2. Backend
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Add your GROK_API_KEY to .env
```

### 3. Start backend
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:8000
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
CLONE_BASE_DIR=/tmp/repos
FAISS_INDEX_DIR=/tmp/faiss
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

Full interactive docs: https://ai-codebase-explainer-understand-any-v9wa.onrender.com/docs

---

## License

MIT — free to use, modify, and distribute.

---

Built with FastAPI · React · Groq · FAISS · React Flow · Lucide · Deployed on Vercel + Render
