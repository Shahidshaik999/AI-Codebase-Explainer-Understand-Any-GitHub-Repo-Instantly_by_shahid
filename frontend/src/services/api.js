import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300_000,
});

/** Analyze a GitHub repository (phases 1-3). */
export async function analyzeRepo(repoUrl, explainMode = "senior", phase = 1) {
  const { data } = await api.post("/api/analyze", {
    repo_url: repoUrl,
    explain_mode: explainMode,
    phase,
  });
  return data;
}

/** RAG chat with a repository. */
export async function chatWithRepo(repoUrl, message, history = [], explainMode = "senior") {
  const { data } = await api.post("/api/chat", {
    repo_url: repoUrl,
    message,
    history,
    explain_mode: explainMode,
  });
  return data;
}

/** Feature 1: What-If Impact Analyzer. */
export async function whatIfAnalysis(repoUrl, query, explainMode = "senior") {
  const { data } = await api.post("/api/what-if", {
    repo_url: repoUrl,
    query,
    explain_mode: explainMode,
  });
  return data;
}

/** Feature 2: Codebase Time Machine. */
export async function getRepoHistory(repoUrl, limit = 15, explainMode = "senior") {
  const { data } = await api.post("/api/history", {
    repo_url: repoUrl,
    limit,
    explain_mode: explainMode,
  });
  return data;
}

/** Feature 3: Execution Flow Simulator. */
export async function getExecutionFlow(repoUrl, entryFile = null) {
  const { data } = await api.post("/api/flow", {
    repo_url: repoUrl,
    entry_file: entryFile,
  });
  return data;
}

/** Feature: Auto System Design Generator. */
export async function generateSystemDesign(repoUrl, explainMode = "senior", summary = null, techStack = null, executionFlow = null) {
  const { data } = await api.post("/api/system-design", {
    repo_url: repoUrl,
    explain_mode: explainMode,
    summary,
    tech_stack: techStack,
    execution_flow: executionFlow,
  });
  return data;
}

/** Feature: Project Structure Tree. */
export async function getRepoStructure(repoUrl) {
  const { data } = await api.post("/api/repo-structure", { repo_url: repoUrl });
  return data;
}

/** Feature: File Content + AI Summary. */
export async function getFileContent(repoUrl, filePath, explainMode = "senior") {
  const { data } = await api.post("/api/file-content", {
    repo_url: repoUrl,
    file_path: filePath,
    explain_mode: explainMode,
  });
  return data;
}

/** Feature: Search files by name/path. */
export async function searchFiles(repoUrl, query) {
  const { data } = await api.post("/api/search-files", { repo_url: repoUrl, query });
  return data.results;
}

/** Feature: Explain selected code snippet. */
export async function explainCode(code, filePath, explainMode = "senior") {
  const { data } = await api.post("/api/explain-code", {
    code,
    file_path: filePath,
    explain_mode: explainMode,
  });
  return data;
}

export default api;
