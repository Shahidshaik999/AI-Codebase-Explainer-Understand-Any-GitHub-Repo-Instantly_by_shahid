import { useState } from "react";
import { getRepoHistory } from "../services/api";
import { useAnalysis } from "../context/AnalysisContext";

export default function HistoryTimeline() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, explainMode, historyData } = state;

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [limit, setLimit]     = useState(10);

  const load = async () => {
    if (historyData) return; // already loaded — skip API call
    setLoading(true); setError(null);
    try {
      const data = await getRepoHistory(repoUrl, limit, explainMode);
      dispatch({ type: "SET_HISTORY", data });
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const data = historyData;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="card flex items-center gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20
                          flex items-center justify-center text-lg shrink-0">🕰️</div>
          <div>
            <h3 className="font-bold text-white">Codebase Time Machine</h3>
            <p className="text-xs text-white/35 mt-0.5">AI-explained commit history</p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {data && (
            <span className="text-xs text-accent-green bg-accent-green/10 border border-accent-green/20
                             px-2 py-1 rounded-lg">✓ Already Loaded</span>
          )}
          {!data && (
            <>
              <label className="text-xs text-white/40">Commits:</label>
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5
                           text-xs text-white/70 focus:outline-none focus:border-accent-blue/50
                           hover:border-white/[0.15] transition-colors cursor-pointer">
                {[5, 10, 15, 20].map((n) => <option key={n} value={n} className="bg-[#111827]">{n}</option>)}
              </select>
            </>
          )}
          <button onClick={load} disabled={loading || !!data} className="btn-primary text-sm">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading…</>
              : data ? "🕰️ Loaded" : "🕰️ Load History"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-accent-red/20 bg-accent-red/5 text-accent-red text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data?.overall_evolution && (
        <div className="card border-accent-purple/20 bg-gradient-to-br from-accent-purple/8 to-transparent animate-slide-up">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🧬</span>
            <div>
              <h4 className="text-sm font-semibold text-accent-purple mb-2">Repository Evolution</h4>
              <p className="text-sm text-white/70 leading-relaxed">{data.overall_evolution}</p>
              <p className="text-xs text-white/30 mt-2">{data.total_commits_fetched} commits analyzed</p>
            </div>
          </div>
        </div>
      )}

      {data?.commits?.length > 0 && (
        <div className="relative animate-slide-up">
          <div className="absolute left-[19px] top-4 bottom-4 w-px
                          bg-gradient-to-b from-accent-blue/50 via-accent-purple/25 to-transparent" />
          <div className="space-y-3 stagger">
            {data.commits.map((commit, i) => (
              <div key={commit.sha} className="relative pl-11 animate-slide-up"
                   style={{ animationDelay: `${i * 40}ms` }}>
                <div className="absolute left-3 top-4 w-4 h-4 rounded-full
                                bg-gradient-to-br from-accent-blue to-accent-purple
                                border-2 border-surface z-10
                                shadow-[0_0_8px_rgba(59,130,246,0.5)]
                                transition-all duration-200 hover:scale-125" />

                <div
                  className={`card cursor-pointer transition-all duration-200
                    hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.1)]
                    ${expanded === commit.sha ? "border-accent-blue/25 bg-accent-blue/5" : ""}`}
                  onClick={() => setExpanded(expanded === commit.sha ? null : commit.sha)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/90 truncate">{commit.message}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-mono text-accent-blue bg-accent-blue/10
                                         border border-accent-blue/20 px-2 py-0.5 rounded-md">
                          {commit.short_sha}
                        </span>
                        <span className="text-xs text-white/40">{commit.author}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-xs text-white/30">{commit.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {commit.insertions > 0 && (
                        <span className="text-xs font-mono text-accent-green bg-accent-green/10
                                         border border-accent-green/20 px-2 py-0.5 rounded-md">
                          +{commit.insertions}
                        </span>
                      )}
                      {commit.deletions > 0 && (
                        <span className="text-xs font-mono text-accent-red bg-accent-red/10
                                         border border-accent-red/20 px-2 py-0.5 rounded-md">
                          -{commit.deletions}
                        </span>
                      )}
                      <span className="text-white/30 text-xs transition-transform duration-200"
                            style={{ transform: expanded === commit.sha ? "rotate(180deg)" : "none" }}>▼</span>
                    </div>
                  </div>

                  {expanded === commit.sha && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3 animate-fade-in">
                      {commit.ai_insight && (
                        <div className="bg-accent-blue/5 border border-accent-blue/15 rounded-xl px-4 py-3">
                          <p className="text-xs text-accent-blue font-semibold mb-1.5">✨ AI Insight</p>
                          <p className="text-sm text-white/70 leading-relaxed">{commit.ai_insight}</p>
                        </div>
                      )}
                      {commit.files_changed?.length > 0 && (
                        <div>
                          <p className="text-xs text-white/30 mb-2">Files changed ({commit.files_changed.length}):</p>
                          <div className="flex flex-wrap gap-1.5">
                            {commit.files_changed.map((f) => (
                              <span key={f}
                                className="text-xs font-mono text-white/50 bg-white/[0.04]
                                           border border-white/[0.08] px-2 py-0.5 rounded-md
                                           hover:text-white/70 hover:border-white/[0.15] transition-colors">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
