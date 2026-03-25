import { useState } from "react";
import { getRepoHistory } from "../services/api";
import { useAnalysis } from "../context/AnalysisContext";

export default function HistoryTimeline() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, explainMode, historyData } = state;

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [limit,    setLimit]    = useState(10);

  const load = async () => {
    if (historyData) return;
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="animate-slide-up">

      {/* Controls */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB" }}>Time Machine</p>
          <p style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>AI-explained commit history</p>
        </div>
        {!historyData && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#4B5563" }}>Commits</span>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#9CA3AF",
              cursor: "pointer", outline: "none",
            }}>
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n} style={{ background: "#111827" }}>{n}</option>
              ))}
            </select>
          </div>
        )}
        {historyData
          ? <span className="badge-green">✓ Loaded</span>
          : (
            <button onClick={load} disabled={loading} className="btn-primary">
              {loading ? <><Spin /> Loading…</> : "Load History"}
            </button>
          )
        }
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13,
                      background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
          {error}
        </div>
      )}

      {/* Evolution summary */}
      {historyData?.overall_evolution && (
        <div style={{
          padding: "16px 18px", borderRadius: 12,
          background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)",
        }} className="animate-slide-up">
          <p className="section-label" style={{ marginBottom: 8, color: "#7C3AED" }}>Repository Evolution</p>
          <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.7 }}>{historyData.overall_evolution}</p>
          <p style={{ fontSize: 11, color: "#4B5563", marginTop: 8 }}>
            {historyData.total_commits_fetched} commits analyzed
          </p>
        </div>
      )}

      {/* Timeline */}
      {historyData?.commits?.length > 0 && (
        <div style={{ position: "relative" }} className="animate-slide-up">
          {/* Vertical line */}
          <div style={{
            position: "absolute", left: 11, top: 8, bottom: 8, width: 1,
            background: "linear-gradient(to bottom, rgba(124,58,237,0.4), rgba(255,255,255,0.04))",
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {historyData.commits.map((commit, i) => (
              <div key={commit.sha} style={{ paddingLeft: 32, position: "relative" }}>
                {/* Dot */}
                <div style={{
                  position: "absolute", left: 6, top: 16,
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#7C3AED", border: "2px solid #0B0F14",
                  boxShadow: "0 0 6px rgba(124,58,237,0.5)",
                }} />

                <div
                  className="card"
                  style={{ cursor: "pointer", transition: "all 0.15s",
                           borderColor: expanded === commit.sha ? "rgba(124,58,237,0.3)" : undefined }}
                  onClick={() => setExpanded(expanded === commit.sha ? null : commit.sha)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = expanded === commit.sha ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.07)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "#E5E7EB", fontWeight: 500,
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {commit.message}
                      </p>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{
                          fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                          padding: "1px 7px", borderRadius: 5,
                          background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
                          color: "#A78BFA",
                        }}>{commit.short_sha}</span>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>{commit.author}</span>
                        <span style={{ fontSize: 11, color: "#4B5563" }}>{commit.date}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                      {commit.insertions > 0 && (
                        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                                       color: "#10B981", padding: "1px 6px", borderRadius: 5,
                                       background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                          +{commit.insertions}
                        </span>
                      )}
                      {commit.deletions > 0 && (
                        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                                       color: "#EF4444", padding: "1px 6px", borderRadius: 5,
                                       background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                          -{commit.deletions}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: "#4B5563",
                                     transform: expanded === commit.sha ? "rotate(180deg)" : "none",
                                     transition: "transform 0.2s", display: "inline-block" }}>▼</span>
                    </div>
                  </div>

                  {expanded === commit.sha && (
                    <div className="animate-fade-in" style={{
                      marginTop: 12, paddingTop: 12,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      {commit.ai_insight && (
                        <div style={{
                          padding: "10px 12px", borderRadius: 8, marginBottom: 10,
                          background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)",
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "#7C3AED", marginBottom: 6 }}>AI Insight</p>
                          <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>{commit.ai_insight}</p>
                        </div>
                      )}
                      {commit.files_changed?.length > 0 && (
                        <div>
                          <p style={{ fontSize: 11, color: "#4B5563", marginBottom: 6 }}>
                            Files changed ({commit.files_changed.length})
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {commit.files_changed.map((f) => (
                              <span key={f} style={{
                                fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                                padding: "2px 8px", borderRadius: 5, color: "#6B7280",
                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                              }}>{f}</span>
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

function Spin() {
  return <span style={{
    width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
    animation: "spin 0.8s linear infinite",
  }} />;
}
