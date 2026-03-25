import { useAnalysis } from "../context/AnalysisContext";

function str(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.description || val.summary || val.text || JSON.stringify(val);
  return String(val);
}

export default function SummaryCard() {
  const { state: { analysisData: r } } = useAnalysis();
  if (!r) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="stagger">

      {/* Summary */}
      <div className="card-hover animate-slide-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      marginBottom: 14, gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="ai-label">✦ Summary</span>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#E5E7EB", letterSpacing: "-0.01em" }}>
              {r.repo_name}
            </p>
          </div>
          <span className={r.explain_mode === "beginner" ? "badge-green" : "badge-purple"} style={{ flexShrink: 0 }}>
            {r.explain_mode} mode
          </span>
        </div>
        <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.75 }}>{str(r.summary)}</p>
        <p style={{ fontSize: 11, color: "#374151", marginTop: 14, paddingTop: 14,
                    borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {r.total_files_analyzed} files analyzed
        </p>
      </div>

      {/* Tech Stack */}
      {r.tech_stack?.length > 0 && (
        <div className="card-hover animate-slide-up">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span className="ai-label">✦ Detected Stack</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {r.tech_stack.map((t, i) => (
              <span key={i} style={{
                padding: "4px 11px", borderRadius: 99, fontSize: 12, fontWeight: 500,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                color: "#9CA3AF", cursor: "default", transition: "all 0.15s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "rgba(124,58,237,0.45)";
                e.target.style.color = "#C4B5FD";
                e.target.style.background = "rgba(124,58,237,0.08)";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.09)";
                e.target.style.color = "#9CA3AF";
                e.target.style.background = "rgba(255,255,255,0.04)";
              }}>
                {str(t)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Entry Points */}
      {r.entry_points?.length > 0 && (
        <div className="card-hover animate-slide-up">
          <span className="ai-label" style={{ marginBottom: 12, display: "inline-flex" }}>✦ Entry Points</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
            {r.entry_points.map((ep, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#9CA3AF",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <span style={{ color: "#4B5563", fontSize: 9 }}>▶</span>
                {str(ep)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Flow */}
      {r.execution_flow && (
        <div className="card-hover animate-slide-up">
          <span className="ai-label" style={{ marginBottom: 12, display: "inline-flex" }}>✦ Execution Flow</span>
          <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.75, whiteSpace: "pre-line", marginTop: 12 }}>
            {str(r.execution_flow)}
          </p>
        </div>
      )}

      {/* Where to Start */}
      {r.where_to_start && (
        <div className="animate-slide-up" style={{
          padding: "16px 18px", borderRadius: 12,
          background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)",
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                      textTransform: "uppercase", color: "#7C3AED", marginBottom: 8 }}>
            Where to Start
          </p>
          <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.7 }}>{str(r.where_to_start)}</p>
        </div>
      )}
    </div>
  );
}
