import { useState } from "react";
import { Zap, AlertTriangle, ChevronRight } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { whatIfAnalysis } from "../services/api";

const RISK = {
  low:      { color: "var(--success)", bg: "var(--success-bg)",  border: "var(--success-border)", bar: "#10B981", w: "25%",  label: "Low"      },
  medium:   { color: "var(--warning)", bg: "var(--warning-bg)",  border: "var(--warning-border)", bar: "#F59E0B", w: "50%",  label: "Medium"   },
  high:     { color: "#F97316",        bg: "#FFF7ED",             border: "#FED7AA",               bar: "#F97316", w: "75%",  label: "High"     },
  critical: { color: "var(--danger)",  bg: "var(--danger-bg)",   border: "var(--danger-border)",  bar: "#EF4444", w: "100%", label: "Critical" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-slide-up">

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "18px 20px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Zap size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            What happens if…?
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            Explore how changing or removing a component could affect the codebase.
          </p>
        </div>
      </div>

      {/* ── Input card ── */}
      <div className="card">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && analyze()}
          placeholder='e.g. "What if I remove the authentication module?"'
          rows={3}
          className="input"
          style={{ resize: "none", marginBottom: 10, fontSize: 13, lineHeight: 1.6 }}
        />
        {/* Example chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {EXAMPLES.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, padding: "4px 10px", borderRadius: 99,
                background: "var(--bg-muted)", border: "1px solid var(--border)",
                color: "var(--text-muted)", cursor: "pointer", transition: "all var(--t-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-border)";
                e.currentTarget.style.color = "var(--accent)";
                e.currentTarget.style.background = "var(--accent-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "var(--bg-muted)";
              }}
            >
              <ChevronRight size={9} />
              {q}
            </button>
          ))}
        </div>
        <button
          onClick={analyze}
          disabled={loading || !query.trim()}
          className="btn-primary"
        >
          {loading
            ? <><SpinIcon /> Analyzing impact…</>
            : whatIfResults[query.trim()]
              ? <><Zap size={13} /> View Result</>
              : <><Zap size={13} /> Analyze Impact</>}
        </button>
      </div>

      {/* ── Cached queries ── */}
      {cached.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {cached.map((q) => (
            <button
              key={q}
              onClick={() => { setActive(q); setQuery(q); }}
              style={{
                fontSize: 11, padding: "4px 12px", borderRadius: 99, cursor: "pointer",
                transition: "all var(--t-fast)",
                background: active === q ? "var(--accent-bg)" : "var(--bg-card)",
                border: `1px solid ${active === q ? "var(--accent-border)" : "var(--border)"}`,
                color: active === q ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {q.length > 42 ? q.slice(0, 42) + "…" : q}
            </button>
          ))}
        </div>
      )}

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

      {/* ── Result ── */}
      {result && risk && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="animate-slide-up">

          {/* Risk level bar */}
          <div style={{
            padding: "16px 18px", borderRadius: 10,
            background: risk.bg, border: `1px solid ${risk.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} style={{ color: risk.color }} />
                <span style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
                  textTransform: "uppercase", color: risk.color,
                }}>
                  {risk.label} Risk
                </span>
              </div>
              {result.confidence && (
                <span className="badge">{result.confidence} confidence</span>
              )}
            </div>
            <div style={{ height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: risk.w, background: risk.bar,
                borderRadius: 2, transition: "width 0.8s ease",
                animation: "progressFill 0.8s ease both",
              }} />
            </div>
          </div>

          {/* Explanation */}
          <div className="card-hover">
            <p className="section-label" style={{ marginBottom: 10 }}>Impact Explanation</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.75, margin: 0 }}>
              {result.explanation}
            </p>
          </div>

          {/* Grid: affected files + breaking features */}
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
                      padding: "4px 8px", borderRadius: 5, color: "var(--warning)",
                      background: "var(--warning-bg)", border: "1px solid var(--warning-border)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      display: "block",
                    }}>
                      {f}
                    </span>
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
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--danger)", flexShrink: 0 }}>✕</span>
                      <span style={{ lineHeight: 1.5 }}>{f}</span>
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
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: "var(--accent)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700,
                    }}>
                      {i + 1}
                    </span>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
                      {r}
                    </p>
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

function SpinIcon() {
  return (
    <span style={{
      width: 12, height: 12,
      border: "2px solid rgba(255,255,255,0.35)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      display: "inline-block",
      animation: "spin 0.75s linear infinite",
    }} />
  );
}
