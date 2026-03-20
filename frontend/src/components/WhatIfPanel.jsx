import { useState } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import { whatIfAnalysis } from "../services/api";

const RISK_CONFIG = {
  low:      { color: "text-accent-green",  bg: "border-accent-green/20 bg-accent-green/5",   bar: "from-accent-green to-emerald-400",  icon: "🟢", width: "25%"  },
  medium:   { color: "text-accent-yellow", bg: "border-accent-yellow/20 bg-accent-yellow/5", bar: "from-accent-yellow to-orange-400",  icon: "🟡", width: "50%"  },
  high:     { color: "text-orange-400",    bg: "border-orange-400/20 bg-orange-400/5",        bar: "from-orange-400 to-red-400",        icon: "🟠", width: "75%"  },
  critical: { color: "text-accent-red",    bg: "border-accent-red/20 bg-accent-red/5",        bar: "from-accent-red to-rose-400",       icon: "🔴", width: "100%" },
};

const EXAMPLES = [
  "What if I remove the authentication module?",
  "What if I replace the database with a different ORM?",
  "What if I delete the API rate limiting logic?",
  "What if I remove all error handling?",
];

export default function WhatIfPanel() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, explainMode, whatIfResults } = state;

  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Active result: last queried or first stored
  const [activeQuery, setActiveQuery] = useState(() => Object.keys(whatIfResults)[0] || "");
  const result = whatIfResults[activeQuery] || null;

  const analyze = async () => {
    const q = query.trim();
    if (!q || loading) return;

    // Return cached result if already analyzed
    if (whatIfResults[q]) {
      setActiveQuery(q);
      return;
    }

    setLoading(true); setError(null);
    try {
      const data = await whatIfAnalysis(repoUrl, q, explainMode);
      dispatch({ type: "SET_WHAT_IF", query: q, data });
      setActiveQuery(q);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const risk = result ? (RISK_CONFIG[result.risk_level] || RISK_CONFIG.medium) : null;
  const cachedQueries = Object.keys(whatIfResults);

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="card space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-yellow/10 border border-accent-yellow/20 flex items-center justify-center text-lg shrink-0">⚡</div>
          <div>
            <h3 className="font-bold text-white">What-If Impact Analyzer</h3>
            <p className="text-xs text-white/35 mt-0.5">Results are cached — switching tabs won't lose your analysis.</p>
          </div>
        </div>

        <textarea value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && analyze()}
          placeholder='e.g. "What if I remove the authentication module?"'
          rows={3} className="input resize-none" />

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((q) => (
            <button key={q} onClick={() => setQuery(q)}
              className="text-xs text-white/40 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-full
                         hover:border-accent-blue/40 hover:text-accent-blue hover:bg-accent-blue/5
                         hover:scale-[1.03] active:scale-[0.97] transition-all duration-200">
              {q.slice(0, 38)}…
            </button>
          ))}
        </div>

        <button onClick={analyze} disabled={loading || !query.trim()} className="btn-primary w-fit">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing…</>
            : whatIfResults[query.trim()] ? "✓ View Cached Result" : "⚡ Analyze Impact"}
        </button>
      </div>

      {/* Previous analyses */}
      {cachedQueries.length > 1 && (
        <div className="card space-y-2">
          <p className="text-xs text-white/40 font-medium">Previous analyses ({cachedQueries.length})</p>
          <div className="flex flex-wrap gap-2">
            {cachedQueries.map((q) => (
              <button key={q} onClick={() => { setActiveQuery(q); setQuery(q); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200
                  ${activeQuery === q
                    ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue"
                    : "border-white/[0.08] text-white/40 hover:border-white/[0.15] hover:text-white/60"}`}>
                {q.slice(0, 35)}…
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="card border-accent-red/20 bg-accent-red/5 text-accent-red text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-slide-up">
          <div className={`card border ${risk.bg}`}>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{risk.icon}</span>
              <div className="flex-1">
                <p className={`font-bold text-xl uppercase tracking-widest ${risk.color}`}>{result.risk_level} Risk</p>
                <p className="text-xs text-white/35 mt-0.5">
                  Confidence: <span className="text-white/55">{result.confidence}</span>
                  {" · "}Query: <span className="text-white/55 italic">"{result.query}"</span>
                </p>
                <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${risk.bar} rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
                    style={{ width: risk.width }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card-hover">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-sm">💬</div>
              <h4 className="section-title">Impact Explanation</h4>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{result.explanation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.affected_files?.length > 0 && (
              <div className="card-hover">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center text-sm">📁</div>
                  <h4 className="section-title text-sm">Affected Files</h4>
                  <span className="ml-auto badge-warn">{result.affected_files.length}</span>
                </div>
                <ul className="space-y-1.5">
                  {result.affected_files.map((f) => (
                    <li key={f} className="text-xs font-mono text-orange-300 bg-orange-400/5 border border-orange-400/15
                                           px-3 py-1.5 rounded-lg hover:border-orange-400/30 hover:translate-x-0.5 transition-all duration-150">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.breaking_features?.length > 0 && (
              <div className="card-hover">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-sm">💥</div>
                  <h4 className="section-title text-sm">Breaking Features</h4>
                  <span className="ml-auto badge-danger">{result.breaking_features.length}</span>
                </div>
                <ul className="space-y-2">
                  {result.breaking_features.map((f, i) => (
                    <li key={i} className="text-xs text-red-300/80 flex items-start gap-2 hover:text-red-300 transition-colors">
                      <span className="text-accent-red shrink-0 mt-0.5">✗</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.recommendations?.length > 0 && (
            <div className="card-hover">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-sm">✅</div>
                <h4 className="section-title">Recommendations</h4>
              </div>
              <ol className="space-y-3 stagger">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/70 hover:text-white/90 transition-colors animate-slide-up">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple
                                     text-white text-xs flex items-center justify-center font-bold shadow-[0_0_8px_rgba(59,130,246,0.4)]">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{r}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
