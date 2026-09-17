import { FileText, Layers, Play, ArrowRight, Lightbulb, Star } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";

function str(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.description || val.summary || val.text || JSON.stringify(val);
  return String(val);
}

// Each entry has a single accent color; alpha variants work in both light + dark
const TECH_ACCENT = {
  react:      "#0891B2",
  python:     "#F59E0B",
  javascript: "#EAB308",
  typescript: "#3B82F6",
  fastapi:    "#22C55E",
  node:       "#16A34A",
  nodejs:     "#16A34A",
  docker:     "#2563EB",
  postgres:   "#7C3AED",
  postgresql: "#7C3AED",
  mongodb:    "#16A34A",
  redis:      "#EF4444",
  tailwind:   "#14B8A6",
  tailwindcss:"#14B8A6",
  go:         "#06B6D4",
  rust:       "#F97316",
  java:       "#EA580C",
  vue:        "#10B981",
  angular:    "#DC2626",
  svelte:     "#F97316",
  nextjs:     "#6B7280",
  nuxt:       "#22C55E",
  express:    "#6B7280",
  flask:      "#374151",
  django:     "#065F46",
  graphql:    "#EC4899",
  aws:        "#F59E0B",
  azure:      "#3B82F6",
  gcp:        "#EF4444",
  default:    "#6B7280",
};

function techColor(tech) {
  const k = tech.toLowerCase().replace(/[^a-z]/g, "");
  const accent = TECH_ACCENT[k] || TECH_ACCENT.default;
  return {
    bg:     accent + "18",
    text:   accent,
    border: accent + "35",
  };
}

export default function SummaryCard() {
  const { state: { analysisData: r } } = useAnalysis();
  if (!r) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="stagger">

      {/* ── PROJECT SUMMARY ── */}
      <div className="card-hover">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", align: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <FileText size={15} style={{ color: "var(--accent)" }} />
            </div>
            <div style={{ paddingLeft: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
              <p className="section-label">Project Summary</p>
              {r.repo_name && (
                <p style={{
                  fontSize: 15, fontWeight: 700, color: "var(--text)",
                  letterSpacing: "-0.02em", margin: 0,
                  fontFamily: "JetBrains Mono, monospace",
                }}>
                  {r.repo_name}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
            <span className={r.explain_mode === "beginner" ? "badge-green" : "badge-purple"}>
              {r.explain_mode} mode
            </span>
            {r.total_files_analyzed != null && (
              <span className="badge">
                {r.total_files_analyzed} files
              </span>
            )}
          </div>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.75, margin: 0 }}>
          {str(r.summary)}
        </p>
      </div>

      {/* ── TECH STACK ── */}
      {r.tech_stack?.length > 0 && (
        <div className="card-hover">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--bg-muted)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Layers size={13} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="section-label">Tech Stack</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {r.tech_stack.map((t, i) => {
              const c = techColor(str(t));
              return (
                <span key={i} style={{
                  padding: "4px 12px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 500,
                  background: c.bg,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                  cursor: "default",
                  transition: "transform var(--t-fast)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}>
                  {str(t)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ENTRY POINTS ── */}
      {r.entry_points?.length > 0 && (
        <div className="card-hover">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--success-bg)", border: "1px solid var(--success-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Play size={11} style={{ color: "var(--success)" }} />
            </div>
            <p className="section-label">Entry Points</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {r.entry_points.map((ep, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 7,
                background: "var(--bg-muted)",
                border: "1px solid var(--border-muted)",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
                color: "var(--text)",
              }}>
                <span style={{ color: "var(--success)", fontSize: 9, flexShrink: 0 }}>▶</span>
                {str(ep)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXECUTION FLOW ── */}
      {r.execution_flow && (
        <div className="card-hover">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowRight size={12} style={{ color: "var(--accent)" }} />
            </div>
            <p className="section-label">Execution Flow</p>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.75, whiteSpace: "pre-line", margin: 0 }}>
            {str(r.execution_flow)}
          </p>
        </div>
      )}

      {/* ── WHERE TO START ── */}
      {r.where_to_start && (
        <div style={{
          padding: "16px 18px",
          borderRadius: 10,
          background: "var(--accent-bg)",
          border: "1px solid var(--accent-border)",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
          }}>
            <Lightbulb size={13} style={{ color: "#fff" }} />
          </div>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "var(--accent)",
              marginBottom: 6, margin: "0 0 6px",
            }}>
              Where to Start
            </p>
            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7, margin: 0 }}>
              {str(r.where_to_start)}
            </p>
          </div>
        </div>
      )}

      {/* ── IMPORTANT FILES ── */}
      {r.important_files?.length > 0 && (
        <div className="card-hover">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "var(--warning-bg)", border: "1px solid var(--warning-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Star size={13} style={{ color: "var(--warning)" }} />
              </div>
              <p className="section-label">Key Files</p>
            </div>
            <span className="badge">{r.important_files.length} files</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {r.important_files.map((file, idx) => (
              <ImportantFileRow key={file.path || idx} file={file} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}

      {/* ── FOLDER SUMMARIES ── */}
      {r.folder_summaries?.length > 0 && (
        <div className="card-hover">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <p className="section-label">Folder Summaries</p>
            <span className="badge">{r.folder_summaries.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {r.folder_summaries.map((folder, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 7,
                border: "1px solid var(--border-muted)",
                background: "var(--bg-subtle)",
                transition: "border-color var(--t-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-muted)"; }}>
                <div style={{
                  width: 2, background: "var(--accent)", borderRadius: 99,
                  flexShrink: 0, opacity: 0.4,
                }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                    color: "var(--text)", fontWeight: 500, margin: "0 0 2px",
                  }}>
                    {folder.path}/
                  </p>
                  <p style={{
                    fontSize: 12, color: "var(--text-muted)",
                    lineHeight: 1.5, margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {folder.summary}
                  </p>
                </div>
                <span className="badge" style={{ flexShrink: 0, alignSelf: "flex-start" }}>
                  {folder.file_count} files
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const LANG_SHORT = {
  Python:      { color: "#D97706", short: "PY" },
  JavaScript:  { color: "#CA8A04", short: "JS" },
  TypeScript:  { color: "#2563EB", short: "TS" },
  "React/JSX": { color: "#0891B2", short: "RX" },
  "React/TSX": { color: "#0891B2", short: "TX" },
  Java:        { color: "#EA580C", short: "JV" },
  Go:          { color: "#0D9488", short: "GO" },
  Rust:        { color: "#C2410C", short: "RS" },
  default:     { color: "#6B7280", short: "??" },
};

function ImportantFileRow({ file, rank }) {
  const meta = LANG_SHORT[file.language] || LANG_SHORT.default;
  const fileName = (file.path || "").split("/").pop();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 10px",
      borderRadius: 7,
      transition: "background var(--t-fast)",
      cursor: "default",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
      {/* Rank */}
      <span style={{
        width: 20, height: 20, borderRadius: "50%",
        background: rank <= 3 ? "var(--accent-bg)" : "var(--bg-muted)",
        border: `1px solid ${rank <= 3 ? "var(--accent-border)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 700, flexShrink: 0,
        color: rank <= 3 ? "var(--accent)" : "var(--text-subtle)",
      }}>
        {rank}
      </span>
      {/* Lang badge */}
      <span style={{
        width: 24, height: 24, borderRadius: 5,
        background: meta.color + "14",
        border: `1px solid ${meta.color}28`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 8, fontWeight: 700, flexShrink: 0,
        color: meta.color,
      }}>
        {meta.short}
      </span>
      {/* File info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 12, fontFamily: "JetBrains Mono, monospace",
          color: "var(--text)", fontWeight: 500, margin: "0 0 1px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {fileName}
        </p>
        <p style={{
          fontSize: 11, color: "var(--text-muted)", margin: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {file.reason}
        </p>
      </div>
      {/* Path */}
      <p style={{
        fontSize: 10, fontFamily: "JetBrains Mono, monospace",
        color: "var(--text-subtle)", flexShrink: 0,
        maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        margin: 0,
      }}>
        {file.path}
      </p>
    </div>
  );
}
