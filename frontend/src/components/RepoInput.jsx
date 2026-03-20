import { useState } from "react";
import { useAnalysis } from "../context/AnalysisContext";

const PHASE_OPTIONS = [
  { value: 1, label: "Phase 1 — MVP" },
  { value: 2, label: "Phase 2 — Smart (embeddings)" },
  { value: 3, label: "Phase 3 — Visualization" },
];

export default function RepoInput({ onAnalyze, loading }) {
  const { state } = useAnalysis();
  const [url, setUrl] = useState(state.repoUrl || "");
  const [mode, setMode] = useState(state.explainMode || "senior");
  const [phase, setPhase] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onAnalyze(url.trim(), mode, phase);
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Analyze a GitHub Repository</h2>
        <p className="text-xs text-gray-600 mt-1">Paste any public GitHub URL to get AI-powered insights</p>
      </div>

      {/* URL input with glow wrapper */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          {/* Gradient border glow on focus */}
          <div className="absolute -inset-px rounded-xl bg-gradient-brand opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-600 text-sm">🔗</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              required
              className="input pl-10 relative"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing…
            </span>
          ) : (
            <>
              <span>✨</span> Analyze
            </>
          )}
        </button>
      </div>

      {/* Options row */}
      <div className="flex flex-wrap gap-5 items-center pt-1 border-t border-white/[0.06]">
        {/* Explain mode */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Explain as:</span>
          <div className="flex gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06]">
            {["beginner", "senior"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200
                  ${mode === m
                    ? "bg-gradient-brand text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"}`}
              >
                {m === "beginner" ? "Beginner" : "Senior Dev"}
              </button>
            ))}
          </div>
        </div>

        {/* Phase selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Phase:</span>
          <select
            value={phase}
            onChange={(e) => setPhase(Number(e.target.value))}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5
                       text-gray-300 text-xs focus:outline-none focus:border-accent-blue/50
                       transition-colors cursor-pointer"
          >
            {PHASE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-surface-card">{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}
