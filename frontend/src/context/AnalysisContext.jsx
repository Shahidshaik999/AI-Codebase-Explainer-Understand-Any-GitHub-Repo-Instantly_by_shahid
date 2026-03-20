/**
 * AnalysisContext — global session state for AI Codebase Explainer.
 *
 * One "session" = one repo URL.
 * Switching tabs never resets data.
 * Analyzing a NEW repo clears everything.
 * State is persisted to localStorage so a page refresh restores the session.
 */
import { createContext, useContext, useReducer, useEffect } from "react";

// ── Initial shape ─────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  repoUrl:       "",
  explainMode:   "senior",
  analysisData:  null,   // AnalysisResult from /api/analyze
  chatHistory:   [],     // [{ role, content, sources? }]
  systemDesign:  null,   // SystemDesignResult from /api/system-design
  whatIfResults: {},     // keyed by query string → WhatIfResult
  flowGraph:     null,   // FlowResult from /api/flow
  historyData:   null,   // HistoryResult from /api/history
  projectStructure: null, // Tree from /api/repo-structure
  selectedFile:     null, // { file_path, content, summary, language, line_count, truncated }
  fileCache:        {},   // keyed by file_path → file content result
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    // Called when user clicks Analyze — clears everything for the new repo
    case "START_ANALYSIS":
      return {
        ...INITIAL_STATE,
        repoUrl:     action.repoUrl,
        explainMode: action.explainMode,
      };

    case "SET_ANALYSIS_DATA":
      return { ...state, analysisData: action.data };

    case "APPEND_CHAT":
      return { ...state, chatHistory: [...state.chatHistory, action.message] };

    case "SET_CHAT_HISTORY":
      return { ...state, chatHistory: action.history };

    case "SET_SYSTEM_DESIGN":
      return { ...state, systemDesign: action.data };

    case "SET_WHAT_IF":
      return {
        ...state,
        whatIfResults: { ...state.whatIfResults, [action.query]: action.data },
      };

    case "SET_FLOW_GRAPH":
      return { ...state, flowGraph: action.data };

    case "SET_HISTORY":
      return { ...state, historyData: action.data };

    case "SET_PROJECT_STRUCTURE":
      return { ...state, projectStructure: action.data };

    case "SET_SELECTED_FILE":
      return { ...state, selectedFile: action.data };

    case "CACHE_FILE":
      return { ...state, fileCache: { ...state.fileCache, [action.path]: action.data } };

    case "HYDRATE":
      return { ...INITIAL_STATE, ...action.state };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AnalysisContext = createContext(null);

const LS_KEY = "ace_session_v1";

export function AnalysisProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, () => {
    // Rehydrate from localStorage on first load
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) return { ...INITIAL_STATE, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return INITIAL_STATE;
  });

  // Persist to localStorage on every state change
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
    catch { /* quota exceeded — ignore */ }
  }, [state]);

  return (
    <AnalysisContext.Provider value={{ state, dispatch }}>
      {children}
    </AnalysisContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used inside <AnalysisProvider>");
  return ctx;
}
