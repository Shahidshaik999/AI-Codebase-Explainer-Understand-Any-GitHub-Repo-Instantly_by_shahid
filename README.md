# AI Codebase Explainer

> Understand any GitHub repository instantly — powered by LLMs, RAG, AST analysis, and interactive visualizations.

Paste a GitHub URL. Get a complete AI-powered breakdown of the codebase in under 90 seconds.

---

## What it does

Most developers spend days onboarding to a new codebase. This tool cuts that to minutes.

It clones any public GitHub repo, analyzes the code with an LLM, and gives you:

- A plain-English summary of what the project does
- Tech stack detection
- AI-ranked important files with reasons
- A full interactive file explorer with syntax highlighting
- Select any code block → get an AI explanation with complexity rating
- RAG-powered chat — ask anything about the repo
- Git commit history with AI explanations per commit
- AST-extracted execution flow graph (React Flow)
- Auto-generated system design document
- What-If impact analyzer — "what breaks if I remove X?"

Everything persists across tab switches. Analyzing a new repo resets the session.

---

## Demo



https://github.com/user-attachments/assets/3e5b669b-9a6c-466b-a63c-7d67635fbb78





```
Input:  https://github.com/owner/repo
Output: Full AI analysis across 8 tabs in ~60 seconds
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| State Management | React Context + useReducer + localStorage |
| Graph Visualization | React Flow |
| Backend | FastAPI (Python 3.11+) |
| LLM Provider | Groq API (llama-3.1-8b-instant) |
| Vector Embeddings | FAISS + sentence-transformers |
| Git Operations | GitPython |
| AST Analysis | Python `ast` module |

---

## Features

### Overview Tab
- AI-generated project summary (2-4 sentences)
- Tech stack list
- Entry points and execution flow description
- "Where to start reading" recommendation for new developers

### Files Tab
- **Key Files** — AI-ranked list of the most important files with reasons
- **Folder Summaries** — per-folder AI descriptions
- **Project Tree** — full VS Code-style file explorer with expand/collapse and search
- **File Preview** — syntax-highlighted code with line numbers, language badge, file size
- **AI File Summary** — 2-3 sentence explanation of each file's purpose
- **Code Explainer** — select any code → floating button → AI explains it with complexity rating
- **Ask about this file** — one click sends the file to the Chat tab

### Chat Tab
- RAG-powered Q&A using FAISS vector search for context retrieval
- Full conversation history persists across tab switches
- Shows source files used to answer each question

### What-If Lab
- Ask impact questions: "what happens if I remove authentication?"
- LLM analyzes ripple effects across the codebase

### Time Machine Tab
- Fetches git commit history
- AI explains what changed in each commit and why
- Shows insertions/deletions, author, date per commit

### Flow Tab
- AST-extracted call graph using React Flow
- Nodes: files (blue), functions (green), classes (yellow)
- Animated edges for function calls, static edges for imports
- Filter by node type

### System Design Tab
- Auto-generated architecture overview
- Component breakdown with roles
- Data flow timeline
- Bottlenecks and scaling suggestions

---

## Project Structure

```
ai_codebase_explainer/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app + CORS
│   │   ├── routes/
│   │   │   ├── analyze.py           # POST /api/analyze, /api/chat
│   │   │   ├── what_if.py           # POST /api/what-if
│   │   │   ├── history.py           # POST /api/history
│   │   │   ├── flow.py              # POST /api/flow
│   │   │   ├── system_design.py     # POST /api/system-design
│   │   │   ├── structure.py         # POST /api/repo-structure
│   │   │   └── file_content.py      # POST /api/file-content, /api/explain-code
│   │   ├── services/
│   │   │   ├── repo_cloner.py       # Git clone + caching
│   │   │   ├── file_reader.py       # File traversal + filtering
│   │   │   ├── chunker.py           # Code chunking for LLM
│   │   │   ├── llm_service.py       # LLM provider abstraction
│   │   │   ├── embeddings.py        # FAISS vector store
│   │   │   ├── analyzer.py          # Main analysis orchestrator
│   │   │   ├── what_if.py           # Impact analysis
│   │   │   ├── git_history.py       # Commit history + AI insights
│   │   │   ├── flow_analyzer.py     # AST call graph extraction
│   │   │   ├── system_design.py     # System design generation
│   │   │   ├── repo_structure.py    # Directory tree builder
│   │   │   └── file_content.py      # File read + summary + code explain
│   │   ├── models/
│   │   │   └── response_model.py    # Pydantic response schemas
│   │   └── utils/
│   │       └── config.py            # Environment config
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   └── Home.jsx             # Main layout + tab routing
    │   ├── components/
    │   │   ├── RepoInput.jsx        # URL input + options
    │   │   ├── SummaryCard.jsx      # Overview tab
    │   │   ├── FileList.jsx         # Files tab (split pane)
    │   │   ├── ProjectTree.jsx      # File tree explorer
    │   │   ├── FilePreview.jsx      # Code viewer + AI features
    │   │   ├── GraphView.jsx        # Dependency graph
    │   │   ├── ChatBox.jsx          # RAG chat interface
    │   │   ├── WhatIfPanel.jsx      # What-If analyzer
    │   │   ├── HistoryTimeline.jsx  # Git time machine
    │   │   ├── FlowGraph.jsx        # Execution flow graph
    │   │   └── SystemDesign.jsx     # System design viewer
    │   ├── context/
    │   │   └── AnalysisContext.jsx  # Global session state
    │   └── services/
    │       └── api.js               # Axios API client
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com) (free tier works)
- Git installed on your system

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ai-codebase-explainer.git
cd ai-codebase-explainer
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Open .env and add your GROK_API_KEY
```

### 3. Start the backend

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 4. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # adjust VITE_API_URL if needed
npm run dev
```

Open: http://localhost:5173

---

## Environment Variables

### Backend — `backend/.env`

```env
# LLM Provider: "grok" | "openai" | "gemini"
LLM_PROVIDER=grok
LLM_MODEL=llama-3.1-8b-instant

# API Keys (only the one you use is required)
GROK_API_KEY=gsk_your_groq_key_here
OPENAI_API_KEY=
GEMINI_API_KEY=

# Repo cloning
CLONE_BASE_DIR=C:/tmp/repos

# Analysis limits (keep low for free tier)
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
| POST | `/api/chat` | RAG chat with a repo |
| POST | `/api/what-if` | Impact analysis query |
| POST | `/api/history` | Git commit history + AI insights |
| POST | `/api/flow` | AST execution flow graph |
| POST | `/api/system-design` | Generate system design |
| POST | `/api/repo-structure` | Full directory tree |
| POST | `/api/file-content` | File content + AI summary |
| POST | `/api/explain-code` | Explain selected code snippet |
| POST | `/api/search-files` | Search files by name/path |

Full interactive docs: http://localhost:8000/docs

---

## Rate Limits (Groq Free Tier)

The app is tuned for Groq's free tier (~12,000 TPM):

- Model: `llama-3.1-8b-instant`
- Max chunks sent to LLM: 15
- Max lines per chunk: 40
- Max file preview lines sent to LLM: 80

For larger repos or faster analysis, upgrade to a paid Groq plan or switch to OpenAI/Gemini.

---

## Supported LLM Providers

| Provider | Config value | Notes |
|---|---|---|
| Groq | `grok` | Fastest, free tier available |
| OpenAI | `openai` | GPT-4o-mini recommended |
| Google Gemini | `gemini` | gemini-1.5-flash recommended |

Switch providers by changing `LLM_PROVIDER` in `backend/.env`.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push and open a Pull Request

---

## License

MIT License — free to use, modify, and distribute.

---

Built with FastAPI, React, Groq, FAISS, and React Flow.
