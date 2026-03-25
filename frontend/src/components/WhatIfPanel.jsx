import { useState } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import { whatIfAnalysis } from "../services/api";

const RISK = {
  low:      { color: "#10B981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  bar: "#10B981", w: "25%"  },
  medium:   { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  bar: "#F59E0B", w: "50%"  },
  high:     { color: "#F97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)",  bar: "#F97316", w: "75%"  },
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   bar: "#EF4444", w: "100%" },
};

const EXAMPLES = [
  "What if I remove authentication?",
  "What if I replace the database layer?",
  "What if I delete rate limiting?",
  "What if I remove all error handling?",
];

export default function WhatIfPanel() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, explainMode, whatIfResults } = state;

  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [active,  setActive]  = useState(() => Object.keys(whatIfResults)[0] || "");

  const result = whatIfResults[active] || null;
  const risk   = result ? (RISK[result.risk_level] || RISK.medium) : null;

  const analyze = async () => {
    const q = query.trim();
    if (!q || loading) return;
    if (whatIfResults[q]) { setActive(q); return; }
    setLoading(true); setError(null);
    try {
      const data = await whatIfAnalysis(repoUrl, q, explainMode);
      dispatch({ type: "SET_WHAT_IF", query: q, data });
      setActive(q);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const cached = Object.keys(whatIfResults);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="animate-slide-up">

      {/* Input card */}
      <div className="card">
        <p className="section-label" style={{ marginBottom: 14 }}>What-If Impact Analyzer</p>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && analyze()}
          placeholder='e.g. "What if I remove the authentication module?"'
          rows={3}
          className="input"
          style={{ resize: "none", marginBottom: 10 }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {EXAMPLES.map((q) => (
            <button key={q} onClick={() => setQuery(q)} style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 99,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              color: "#6B7280", cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = "rgba(124,58,237,0.3)"; e.target.style.color = "#A78BFA"; }}
            onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; e.target.style.color = "#6B7280"; }}>
              {q}
            </button>
          ))}
        </div>
        <button onClick={analyze} disabled={loading || !query.trim()} className="btn-primary">
          {loading
            ? <><Spin /> Analyzing…</>
            : whatIfResults[query.trim()] ? "View Result" : "Analyze Impact"}
        </button>
      </div>

      {/* Cached queries */}
      {cached.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {cached.map((q) => (
            <button key={q} onClick={() => { setActive(q); setQuery(q); }} style={{
              fontSize: 11, padding: "4px 12px", borderRadius: 99, cursor: "pointer",
              transition: "all 0.15s",
              background: active === q ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${active === q ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.07)"}`,
              color: active === q ? "#A78BFA" : "#6B7280",
            }}>
              {q.length > 40 ? q.slice(0, 40) + "…" : q}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13,
                      background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="animate-slide-up">

          {/* Risk level */}
          <div style={{
            padding: "16px 18px", borderRadius: 12,
            background: risk.bg, border: `1px solid ${risk.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                             textTransform: "uppercase", color: risk.color }}>
                {result.risk_level} Risk
              </span>
              <span className="badge">{result.confidence} confidence</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: risk.w, background: risk.bar,
                            borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
          </div>

          {/* Explanation */}
          <div className="card-hover">
            <p className="section-label" style={{ marginBottom: 10 }}>Impact Explanation</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.7 }}>{result.explanation}</p>
          </div>

          {/* Affected + Breaking */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {result.affected_files?.length > 0 && (
              <div className="card-hover">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <p className="section-label">Affected Files</p>
                  <span className="badge-yellow">{result.affected_files.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {result.affected_files.map((f) => (
                    <span key={f} style={{
                      fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                      padding: "4px 8px", borderRadius: 6, color: "#F59E0B",
                      background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                    }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
            {result.breaking_features?.length > 0 && (
              <div className="card-hover">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <p className="section-label">Breaking Features</p>
                  <span className="badge-red">{result.breaking_features.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.breaking_features.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#9CA3AF" }}>
                      <span style={{ color: "#EF4444", flexShrink: 0 }}>✗</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="card-hover">
              <p className="section-label" style={{ marginBottom: 12 }}>Recommendations</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.recommendations.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: "#7C3AED", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 600,
                    }}>{i + 1}</span>
                    <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6, margin: 0 }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
