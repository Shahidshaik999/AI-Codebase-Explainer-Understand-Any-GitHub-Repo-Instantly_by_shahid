import { useState } from "react";
import { History, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-slide-up">

      {/* ── Header / Controls ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "16px 18px",
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <History size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
            Git History
          </p>
          <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: 0 }}>
            AI-explained commit timeline
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {!historyData && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>Commits</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{
                  background: "var(--bg-muted)", border: "1px solid var(--border)",
                  borderRadius: 6, padding: "4px 8px", fontSize: 11,
                  color: "var(--text)", cursor: "pointer", outline: "none",
                }}
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
          {historyData
            ? <span className="badge-green">✓ {historyData.total_commits_fetched} commits</span>
            : (
              <button onClick={load} disabled={loading} className="btn-primary" style={{ fontSize: 12 }}>
                {loading ? <><SpinIcon /> Loading…</> : "Load History"}
              </button>
            )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: "12px 14px", borderRadius: 8,
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          fontSize: 13, color: "var(--danger)",
        }}>
          {error}
        </div>
      )}

      {/* ── Evolution summary ── */}
      {historyData?.overall_evolution && (
        <div style={{
          padding: "16px 18px", borderRadius: 10,
          background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
          display: "flex", gap: 12, alignItems: "flex-start",
        }} className="animate-slide-up">
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "var(--accent)", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Sparkles size={13} style={{ color: "#fff" }} />
          </div>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
              color: "var(--accent)", margin: "0 0 5px",
            }}>
              Repository Evolution
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
              {historyData.overall_evolution}
            </p>
          </div>
        </div>
      )}

      {/* ── Commit timeline ── */}
      {historyData?.commits?.length > 0 && (
        <div style={{ position: "relative" }} className="animate-slide-up">
          {/* Vertical line */}
          <div style={{
            position: "absolute",
            left: 12, top: 8, bottom: 8, width: 1,
            background: "linear-gradient(to bottom, var(--accent-border), var(--border-muted))",
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {historyData.commits.map((commit) => {
              const isOpen = expanded === commit.sha;
              return (
                <div key={commit.sha} style={{ paddingLeft: 32, position: "relative" }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: "absolute", left: 7, top: 17,
                    width: 10, height: 10, borderRadius: "50%",
                    background: "var(--accent)", border: "2px solid var(--bg)",
                    transition: "transform var(--t-fast)",
                  }} />

                  <div
                    style={{
                      background: "var(--bg-card)",
                      border: `1px solid ${isOpen ? "var(--accent-border)" : "var(--border)"}`,
                      borderRadius: 9, padding: "12px 14px",
                      cursor: "pointer",
                      transition: "border-color var(--t-fast), box-shadow var(--t-fast)",
                    }}
                    onClick={() => setExpanded(isOpen ? null : commit.sha)}
                    onMouseEnter={(e) => {
                      if (!isOpen) {
                        e.currentTarget.style.borderColor = "var(--border-strong)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isOpen ? "var(--accent-border)" : "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Commit header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, color: "var(--text)", fontWeight: 500,
                          margin: "0 0 6px",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {commit.message}
                        </p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{
                            fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                            padding: "1px 6px", borderRadius: 4,
                            background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
                            color: "var(--accent)",
                          }}>
                            {commit.short_sha}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{commit.author}</span>
                          <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>{commit.date}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                        {commit.insertions > 0 && (
                          <span style={{
                            fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                            color: "var(--success)", padding: "1px 5px", borderRadius: 4,
                            background: "var(--success-bg)", border: "1px solid var(--success-border)",
                          }}>
                            +{commit.insertions}
                          </span>
                        )}
                        {commit.deletions > 0 && (
                          <span style={{
                            fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                            color: "var(--danger)", padding: "1px 5px", borderRadius: 4,
                            background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
                          }}>
                            -{commit.deletions}
                          </span>
                        )}
                        <span style={{
                          color: "var(--text-subtle)", fontSize: 11,
                          display: "inline-flex", alignItems: "center",
                          transition: "transform var(--t-fast)",
                        }}>
                          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </span>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isOpen && (
                      <div
                        className="animate-fade-in"
                        style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-muted)" }}
                      >
                        {commit.ai_insight && (
                          <div style={{
                            padding: "10px 12px", borderRadius: 7, marginBottom: 10,
                            background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
                            display: "flex", gap: 8, alignItems: "flex-start",
                          }}>
                            <Sparkles size={12} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <p style={{
                                fontSize: 10, fontWeight: 700, color: "var(--accent)",
                                textTransform: "uppercase", letterSpacing: "0.05em",
                                margin: "0 0 4px",
                              }}>
                                AI Insight
                              </p>
                              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
                                {commit.ai_insight}
                              </p>
                            </div>
                          </div>
                        )}
                        {commit.files_changed?.length > 0 && (
                          <div>
                            <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: "0 0 6px" }}>
                              {commit.files_changed.length} files changed
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {commit.files_changed.map((f) => (
                                <span key={f} style={{
                                  fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                                  padding: "2px 7px", borderRadius: 4,
                                  background: "var(--bg-muted)", border: "1px solid var(--border)",
                                  color: "var(--text-muted)",
                                }}>
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SpinIcon() {
  return (
    <span style={{
      width: 12, height: 12,
      border: "2px solid rgba(255,255,255,0.35)",
      borderTopColor: "#fff", borderRadius: "50%",
      display: "inline-block", animation: "spin 0.75s linear infinite",
    }} />
  );
}
