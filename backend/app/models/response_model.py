from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# ── Existing models ──────────────────────────────────────────────────────────

class ImportantFile(BaseModel):
    path: str
    reason: str
    language: Optional[str] = None
    size_kb: Optional[float] = None


class FolderSummary(BaseModel):
    path: str
    summary: str
    file_count: int


class DependencyEdge(BaseModel):
    source: str
    target: str
    type: str = "import"  # import | call


class DependencyGraph(BaseModel):
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[DependencyEdge] = Field(default_factory=list)


class AnalysisResult(BaseModel):
    repo_url: str
    summary: str
    tech_stack: List[str]
    entry_points: List[str]
    important_files: List[ImportantFile]
    execution_flow: Optional[str] = None
    folder_summaries: Optional[List[FolderSummary]] = None
    where_to_start: Optional[str] = None
    dependency_graph: Optional[DependencyGraph] = None
    explain_mode: str = "senior"
    total_files_analyzed: int = 0
    repo_name: str = ""


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    repo_url: str
    message: str
    history: List[ChatMessage] = Field(default_factory=list)
    explain_mode: str = "senior"


class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = Field(default_factory=list)


class AnalyzeRequest(BaseModel):
    repo_url: str
    explain_mode: str = "senior"
    phase: int = 1


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


# ── Feature 1: What-If Impact Analyzer ──────────────────────────────────────

class WhatIfRequest(BaseModel):
    repo_url: str
    query: str                        # e.g. "What if I remove authentication?"
    explain_mode: str = "senior"


class WhatIfResult(BaseModel):
    query: str
    affected_files: List[str] = Field(default_factory=list)
    breaking_features: List[str] = Field(default_factory=list)
    risk_level: str = "medium"        # low | medium | high | critical
    explanation: str = ""
    recommendations: List[str] = Field(default_factory=list)
    confidence: str = "medium"        # low | medium | high


# ── Feature 2: Codebase Time Machine ────────────────────────────────────────

class CommitInfo(BaseModel):
    sha: str
    short_sha: str
    message: str
    author: str
    date: str
    files_changed: List[str] = Field(default_factory=list)
    insertions: int = 0
    deletions: int = 0
    ai_insight: Optional[str] = None  # LLM-generated explanation


class HistoryResult(BaseModel):
    repo_url: str
    repo_name: str
    total_commits_fetched: int
    commits: List[CommitInfo]
    overall_evolution: Optional[str] = None  # LLM summary of repo evolution


class HistoryRequest(BaseModel):
    repo_url: str
    limit: int = 20
    explain_mode: str = "senior"


# ── Feature 3: Execution Flow Simulator ─────────────────────────────────────

class FlowNode(BaseModel):
    id: str
    label: str
    type: str = "file"               # file | function | class
    file_path: str = ""
    language: str = ""


class FlowEdge(BaseModel):
    source: str
    target: str
    type: str = "call"               # call | import | inherit


class ExecutionFlowGraph(BaseModel):
    nodes: List[FlowNode] = Field(default_factory=list)
    edges: List[FlowEdge] = Field(default_factory=list)
    entry_point: Optional[str] = None


class FlowRequest(BaseModel):
    repo_url: str
    entry_file: Optional[str] = None  # optional override


class FlowResult(BaseModel):
    repo_url: str
    graph: ExecutionFlowGraph
    summary: str = ""


# ── Feature: Auto System Design Generator ───────────────────────────────────

class SystemComponent(BaseModel):
    name: str
    type: str = "backend"          # frontend | backend | database | cache | queue | external | devops
    description: str = ""
    technology: str = ""


class SystemDesignRequest(BaseModel):
    repo_url: str
    explain_mode: str = "senior"
    # Optional — pass these from a prior Phase-1 result to skip re-analysis
    summary: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    execution_flow: Optional[str] = None


class SystemDesignResult(BaseModel):
    repo_url: str
    repo_name: str
    architecture_overview: str = ""
    components: List[SystemComponent] = Field(default_factory=list)
    data_flow: List[str] = Field(default_factory=list)
    scaling_suggestions: List[str] = Field(default_factory=list)
    bottlenecks: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    architecture_pattern: str = "monolith"
    explain_mode: str = "senior"
