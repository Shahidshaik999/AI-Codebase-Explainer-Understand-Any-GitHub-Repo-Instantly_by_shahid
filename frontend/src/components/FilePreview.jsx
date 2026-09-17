import { useEffect, useRef, useState, useCallback } from "react";
import { Copy, Check, MessageSquare, X, Brain, AlertTriangle } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { explainCode } from "../services/api";

const LANG_LABEL = {
  python: "Python", javascript: "JavaScript", jsx: "JSX",
  typescript: "TypeScript", tsx: "TSX", go: "Go", rust: "Rust",
  java: "Java", css: "CSS", scss: "SCSS", html: "HTML",
  json: "JSON", markdown: "Markdown", yaml: "YAML", bash: "Bash",
  toml: "TOML", text: "Text", binary: "Binary",
};

const LANG_COLOR = {
  python:     { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  javascript: { bg: "#FEF9C3", text: "#CA8A04", border: "#FDE047" },
  jsx:        { bg: "#ECFEFF", text: "#0891B2", border: "#A5F3FC" },
  typescript: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  tsx:        { bg: "#ECFEFF", text: "#0891B2", border: "#A5F3FC" },
  go:         { bg: "#F0FDFA", text: "#0D9488", border: "#99F6E4" },
  rust:       { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  java:       { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  css:        { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
  json:       { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
  default:    { bg: "var(--bg-muted)", text: "var(--text-muted)", border: "var(--border)" },
};

const COMPLEXITY_META = {
  low:    { label: "Low complexity",    color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  medium: { label: "Medium complexity", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  high:   { label: "High complexity",   color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

/* ──────────────────────────────────────────────────────────────────────────
   Light syntax highlighter for dark code blocks
   ────────────────────────────────────────────────────────────────────────── */
function highlight(line) {
  if (!line) return "";
  const esc = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(
    /(["'`])(?:(?!\1)[^\\]|\\.)*\1|(#[^\n]*)|(\/\/[^\n]*)|\b(\d+(?:\.\d+)?)\b|\b(import|export|from|const|let|var|function|return|class|extends|if|else|elif|for|while|async|await|def|self|None|True|False|pass|yield|lambda|with|as|try|except|finally|raise|in|not|and|or|is|del|global|nonlocal|type|interface|enum|struct|pub|fn|use|mod|impl|match|where|new|this|super|static|void|int|str|bool|float|null|undefined|true|false)\b|([a-zA-Z_]\w*)(?=\s*\()/g,
    (match, strQ, hash, slash, num, kw, fn) => {
      if (strQ  !== undefined) return `<span style="color:#A3BE8C">${match}</span>`;
      if (hash  !== undefined) return `<span style="color:#616E88;font-style:italic">${match}</span>`;
      if (slash !== undefined) return `<span style="color:#616E88;font-style:italic">${match}</span>`;
      if (num   !== undefined) return `<span style="color:#B48EAD">${match}</span>`;
      if (kw    !== undefined) return `<span style="color:#81A1C1;font-weight:500">${match}</span>`;
      if (fn    !== undefined) return `<span style="color:#88C0D0">${match}</span>`;
      return match;
    }
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Explain modal
   ────────────────────────────────────────────────────────────────────────── */
function ExplainModal({ result, onClose }) {
  const meta = COMPLEXITY_META[result.complexity] || COMPLEXITY_META.medium;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      {/* Modal */}
      <div
        className="animate-slide-up"
        style={{
          position: "relative",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 20px 50px rgba(0,0,0,0.16)",
          width: "100%", maxWidth: 520,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 16px", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Brain size={13} style={{ color: "var(--accent)" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              AI Code Explanation
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 500,
              background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
            }}>
              {meta.label}
            </span>
            <button className="btn-icon" onClick={onClose} aria-label="Close">
              <X size={13} />
            </button>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: "16px 18px" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.75, margin: 0 }}>
            {result.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   File Preview (full component)
   ────────────────────────────────────────────────────────────────────────── */
export default function FilePreview({ loadingPath, onAskAboutFile }) {
  const { state } = useAnalysis();
  const { selectedFile, explainMode } = state;

  const codeRef  = useRef(null);
  const tableRef = useRef(null);

  const [selection,     setSelection]     = useState("");
  const [selectionPos,  setSelectionPos]  = useState(null);
  const [explaining,    setExplaining]    = useState(false);
  const [explainResult, setExplainResult] = useState(null);
  const [copied,        setCopied]        = useState(false);

  useEffect(() => {
    if (codeRef.current) codeRef.current.scrollTop = 0;
    setSelection(""); setSelectionPos(null); setExplainResult(null); setCopied(false);
  }, [selectedFile?.file_path]);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setSelection(""); setSelectionPos(null); return; }
    const text = sel.toString().trim();
    if (!text || text.length < 5) { setSelection(""); setSelectionPos(null); return; }
    const range = sel.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    setSelection(text);
    setSelectionPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  }, []);

  const handleExplain = async () => {
    if (!selection || !selectedFile) return;
    setExplaining(true); setSelectionPos(null);
    try {
      const result = await explainCode(selection, selectedFile.file_path, explainMode);
      setExplainResult(result);
    } catch {
      setExplainResult({ explanation: "Failed to get explanation.", complexity: "medium" });
    } finally {
      setExplaining(false); setSelection("");
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCopy = async () => {
    if (!selectedFile?.content) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  /* Empty state */
  if (!selectedFile && !loadingPath) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100%",
        gap: 10, userSelect: "none",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "var(--bg-muted)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", margin: 0 }}>
          Select a file to view
        </p>
        <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: 0 }}>
          Click any file in the explorer
        </p>
      </div>
    );
  }

  /* Loading state */
  if (loadingPath) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100%", gap: 10,
      }}>
        <span style={{
          width: 20, height: 20, border: "2px solid var(--border)",
          borderTopColor: "var(--accent)", borderRadius: "50%",
          display: "inline-block", animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Loading {loadingPath.split("/").pop()}…
        </p>
      </div>
    );
  }

  const { file_path, content, summary, language, line_count, size_kb, truncated } = selectedFile;
  const fileName  = file_path.split("/").pop();
  const langLabel = LANG_LABEL[language] || language;
  const langColor = LANG_COLOR[language] || LANG_COLOR.default;

  return (
    <>
      {explainResult && (
        <ExplainModal result={explainResult} onClose={() => setExplainResult(null)} />
      )}

      {/* Floating explain button */}
      {selectionPos && selection && (
        <div
          className="explain-tooltip"
          style={{
            left: selectionPos.x, top: selectionPos.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <button
            onClick={handleExplain}
            disabled={explaining}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: "var(--accent)", color: "#fff", cursor: "pointer",
              border: "none", boxShadow: "0 4px 16px rgba(91,75,255,0.4)",
              transition: "all var(--t-fast)", whiteSpace: "nowrap",
              pointerEvents: "all",
            }}
          >
            {explaining
              ? <><span style={{ width: 10, height: 10, border: "1.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Explaining…</>
              : <><Brain size={12} /> Explain with AI</>}
          </button>
          {/* Arrow */}
          <div style={{
            width: 8, height: 8, background: "var(--accent)",
            transform: "rotate(45deg)", margin: "-4px auto 0", borderRadius: 2,
          }} />
        </div>
      )}

      <div
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
        className="animate-fade-in"
      >
        {/* ── File header ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 12px", borderBottom: "1px solid var(--border)",
          background: "var(--bg-card)", flexShrink: 0, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontSize: 10, padding: "1px 7px", borderRadius: 4, fontWeight: 600,
                background: langColor.bg, color: langColor.text,
                border: `1px solid ${langColor.border}`, flexShrink: 0,
              }}>{langLabel}</span>
              <p style={{
                fontSize: 12, fontFamily: "JetBrains Mono, monospace", fontWeight: 600,
                color: "var(--text)", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {fileName}
              </p>
            </div>
            <p style={{
              fontSize: 10, color: "var(--text-subtle)", margin: "2px 0 0",
              fontFamily: "JetBrains Mono, monospace",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {file_path}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span className="badge" style={{ fontSize: 10 }}>{line_count} lines</span>
            {size_kb != null && <span className="badge" style={{ fontSize: 10 }}>{size_kb} KB</span>}
            {truncated && (
              <span className="badge-yellow" style={{ fontSize: 10 }}>
                <AlertTriangle size={9} /> truncated
              </span>
            )}
            {explaining && (
              <span style={{ fontSize: 10, color: "var(--text-subtle)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, border: "1.5px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                Explaining…
              </span>
            )}
            {onAskAboutFile && (
              <button
                className="btn-ghost"
                onClick={() => onAskAboutFile(file_path)}
                style={{ fontSize: 11 }}
              >
                <MessageSquare size={11} />
                Ask AI
              </button>
            )}
            {content && (
              <button
                className="btn-icon"
                onClick={handleCopy}
                title="Copy file contents"
                aria-label="Copy file contents"
              >
                {copied ? <Check size={13} style={{ color: "var(--success)" }} /> : <Copy size={13} />}
              </button>
            )}
          </div>
        </div>

        {/* ── AI Summary ── */}
        {summary && (
          <div style={{
            display: "flex", gap: 10, padding: "9px 12px",
            borderBottom: "1px solid var(--border)",
            background: "var(--accent-bg)", flexShrink: 0,
          }}>
            <Brain size={13} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
              {summary}
            </p>
          </div>
        )}

        {/* ── Selection hint ── */}
        {content && (
          <div style={{
            padding: "4px 12px", borderBottom: "1px solid var(--border-muted)",
            background: "var(--bg-card)", flexShrink: 0,
          }}>
            <p style={{ fontSize: 10, color: "var(--text-subtle)", margin: 0 }}>
              Select any code to explain it with AI
            </p>
          </div>
        )}

        {/* ── Code ── */}
        {content ? (
          <div
            ref={codeRef}
            style={{ flex: 1, overflowY: "auto", background: "var(--editor-bg)" }}
            onMouseUp={handleMouseUp}
          >
            <table
              ref={tableRef}
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
            >
              <tbody>
                {content.split("\n").map((line, i) => (
                  <tr
                    key={i}
                    style={{ transition: "background 0.1s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--editor-line)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Line number */}
                    <td style={{
                      userSelect: "none", textAlign: "right",
                      paddingRight: 12, paddingLeft: 14,
                      paddingTop: 1, paddingBottom: 1,
                      color: "var(--editor-num)",
                      borderRight: "1px solid rgba(255,255,255,0.05)",
                      width: 44, flexShrink: 0,
                      fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                    }}>
                      {i + 1}
                    </td>
                    {/* Code content */}
                    <td
                      style={{
                        paddingLeft: 14, paddingRight: 14,
                        paddingTop: 1, paddingBottom: 1,
                        color: "var(--editor-text)",
                        whiteSpace: "pre", lineHeight: 1.6,
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                      dangerouslySetInnerHTML={{ __html: highlight(line) }}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-subtle)", fontSize: 13, background: "var(--editor-bg)",
          }}>
            Binary file — no preview available.
          </div>
        )}
      </div>
    </>
  );
}
