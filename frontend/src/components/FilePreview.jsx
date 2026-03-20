import { useEffect, useRef, useState, useCallback } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import { explainCode } from "../services/api";

// ── Language label map ────────────────────────────────────────────────────────
const LANG_LABEL = {
  python: "Python", javascript: "JavaScript", jsx: "JSX",
  typescript: "TypeScript", tsx: "TSX", go: "Go", rust: "Rust",
  java: "Java", css: "CSS", scss: "SCSS", html: "HTML",
  json: "JSON", markdown: "Markdown", yaml: "YAML", bash: "Bash",
  toml: "TOML", text: "Text", binary: "Binary",
};

// ── Language badge colors ─────────────────────────────────────────────────────
const LANG_COLOR = {
  python:     { bg: "bg-yellow-500/15", text: "text-yellow-400",  border: "border-yellow-500/25" },
  javascript: { bg: "bg-yellow-400/15", text: "text-yellow-300",  border: "border-yellow-400/25" },
  jsx:        { bg: "bg-cyan-500/15",   text: "text-cyan-400",    border: "border-cyan-500/25"   },
  typescript: { bg: "bg-blue-500/15",   text: "text-blue-400",    border: "border-blue-500/25"   },
  tsx:        { bg: "bg-cyan-400/15",   text: "text-cyan-300",    border: "border-cyan-400/25"   },
  go:         { bg: "bg-teal-500/15",   text: "text-teal-400",    border: "border-teal-500/25"   },
  rust:       { bg: "bg-orange-500/15", text: "text-orange-400",  border: "border-orange-500/25" },
  java:       { bg: "bg-orange-400/15", text: "text-orange-300",  border: "border-orange-400/25" },
  css:        { bg: "bg-purple-500/15", text: "text-purple-400",  border: "border-purple-500/25" },
  json:       { bg: "bg-green-500/15",  text: "text-green-400",   border: "border-green-500/25"  },
  markdown:   { bg: "bg-slate-500/15",  text: "text-slate-400",   border: "border-slate-500/25"  },
  default:    { bg: "bg-white/[0.06]",  text: "text-white/50",    border: "border-white/10"      },
};

// ── Complexity badge ──────────────────────────────────────────────────────────
const COMPLEXITY_META = {
  low:    { label: "Low complexity",    cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  medium: { label: "Medium complexity", cls: "text-amber-400 bg-amber-400/10 border-amber-400/20"      },
  high:   { label: "High complexity",   cls: "text-red-400 bg-red-400/10 border-red-400/20"            },
};

// ── Single-pass syntax highlighter ───────────────────────────────────────────
function highlight(line) {
  if (!line) return "";
  const esc = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const combined = /(["'`])(?:(?!\1)[^\\]|\\.)*\1|(#[^\n]*)|(\/\/[^\n]*)|\b(\d+(?:\.\d+)?)\b|\b(import|export|from|const|let|var|function|return|class|extends|if|else|elif|for|while|async|await|def|self|None|True|False|pass|yield|lambda|with|as|try|except|finally|raise|in|not|and|or|is|del|global|nonlocal|type|interface|enum|struct|pub|fn|use|mod|impl|match|where|new|this|super|static|void|int|str|bool|float|null|undefined|true|false)\b|([a-zA-Z_]\w*)(?=\s*\()/g;
  return esc.replace(combined, (match, str, hash, slash, num, kw, fn) => {
    if (str  !== undefined) return `<span class="text-emerald-400">${match}</span>`;
    if (hash !== undefined) return `<span class="text-white/30 italic">${match}</span>`;
    if (slash!== undefined) return `<span class="text-white/30 italic">${match}</span>`;
    if (num  !== undefined) return `<span class="text-amber-400">${match}</span>`;
    if (kw   !== undefined) return `<span class="text-violet-400 font-medium">${match}</span>`;
    if (fn   !== undefined) return `<span class="text-sky-400">${match}</span>`;
    return match;
  });
}

// ── Explain Modal ─────────────────────────────────────────────────────────────
function ExplainModal({ result, onClose }) {
  const meta = COMPLEXITY_META[result.complexity] || COMPLEXITY_META.medium;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#111827] border border-white/[0.10] rounded-2xl
                      shadow-2xl shadow-black/50 w-full max-w-lg animate-slide-up"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-base">🧠</span>
            <span className="text-sm font-semibold text-white">Code Explanation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${meta.cls}`}>
              {meta.label}
            </span>
            <button onClick={onClose}
              className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none">✕</button>
          </div>
        </div>
        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-white/70 leading-relaxed">{result.explanation}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main FilePreview component ────────────────────────────────────────────────
export default function FilePreview({ loadingPath, onAskAboutFile }) {
  const { state } = useAnalysis();
  const { selectedFile, explainMode } = state;

  const codeRef   = useRef(null);
  const tableRef  = useRef(null);

  const [selection, setSelection]       = useState("");       // selected text
  const [selectionPos, setSelectionPos] = useState(null);     // {x, y} for tooltip
  const [explaining, setExplaining]     = useState(false);
  const [explainResult, setExplainResult] = useState(null);

  // Scroll to top on file change
  useEffect(() => {
    if (codeRef.current) codeRef.current.scrollTop = 0;
    setSelection("");
    setSelectionPos(null);
    setExplainResult(null);
  }, [selectedFile?.file_path]);

  // Track text selection inside the code block
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelection("");
      setSelectionPos(null);
      return;
    }
    const text = sel.toString().trim();
    if (!text || text.length < 5) {
      setSelection("");
      setSelectionPos(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    setSelection(text);
    setSelectionPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, []);

  const handleExplainSelection = async () => {
    if (!selection || !selectedFile) return;
    setExplaining(true);
    setSelectionPos(null);
    try {
      const result = await explainCode(selection, selectedFile.file_path, explainMode);
      setExplainResult(result);
    } catch (e) {
      setExplainResult({ explanation: "Failed to get explanation.", complexity: "medium" });
    } finally {
      setExplaining(false);
      setSelection("");
      window.getSelection()?.removeAllRanges();
    }
  };

  // ── Empty state ──
  if (!selectedFile && !loadingPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]
                      text-white/20 select-none gap-3">
        <span className="text-5xl">📄</span>
        <p className="text-sm">Select a file to preview</p>
        <p className="text-xs text-white/10">Click any file in the explorer</p>
      </div>
    );
  }

  // ── Loading state ──
  if (loadingPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
        <span className="w-6 h-6 border-2 border-white/20 border-t-accent-blue rounded-full animate-spin" />
        <p className="text-xs text-white/40">Loading {loadingPath.split("/").pop()}…</p>
      </div>
    );
  }

  const { file_path, content, summary, language, line_count, size_kb, truncated } = selectedFile;
  const fileName  = file_path.split("/").pop();
  const langLabel = LANG_LABEL[language] || language;
  const langColor = LANG_COLOR[language] || LANG_COLOR.default;

  return (
    <>
      {/* Explain modal */}
      {explainResult && (
        <ExplainModal result={explainResult} onClose={() => setExplainResult(null)} />
      )}

      {/* Floating "Explain" tooltip on selection */}
      {selectionPos && selection && (
        <div
          className="fixed z-40 transform -translate-x-1/2 -translate-y-full"
          style={{ left: selectionPos.x, top: selectionPos.y }}
        >
          <button
            onClick={handleExplainSelection}
            disabled={explaining}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-accent-blue text-white shadow-lg shadow-accent-blue/30
                       hover:bg-blue-500 transition-all duration-150 whitespace-nowrap
                       border border-blue-400/30"
          >
            {explaining
              ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Explaining…</>
              : <><span>🧠</span> Explain Selection</>}
          </button>
          {/* Arrow */}
          <div className="w-2 h-2 bg-accent-blue rotate-45 mx-auto -mt-1 rounded-sm" />
        </div>
      )}

      <div className="flex flex-col h-full min-h-[400px] animate-fade-in">

        {/* ── File header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]
                        bg-white/[0.02] rounded-t-2xl flex-wrap gap-y-2 shrink-0">
          <span className="text-base shrink-0">📄</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono font-semibold text-white/90 truncate">{fileName}</p>
            <p className="text-[10px] text-white/25 font-mono truncate">{file_path}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* Language badge */}
            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium
                              ${langColor.bg} ${langColor.text} ${langColor.border}`}>
              {langLabel}
            </span>
            <span className="badge text-[10px]">{line_count} lines</span>
            {size_kb != null && (
              <span className="badge text-[10px]">{size_kb} KB</span>
            )}
            {truncated && (
              <span className="badge text-[10px] text-amber-400 border-amber-400/30">⚠ truncated</span>
            )}
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {explaining && (
              <span className="text-[10px] text-white/40 flex items-center gap-1">
                <span className="w-3 h-3 border border-white/20 border-t-accent-blue rounded-full animate-spin" />
                Explaining…
              </span>
            )}
            {onAskAboutFile && (
              <button
                onClick={() => onAskAboutFile(file_path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                           bg-accent-purple/15 text-accent-purple border border-accent-purple/25
                           hover:bg-accent-purple/25 transition-all duration-150"
              >
                💬 Ask about this file
              </button>
            )}
          </div>
        </div>

        {/* ── AI Summary ── */}
        {summary && (
          <div className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.06]
                          bg-gradient-to-r from-accent-blue/5 to-transparent shrink-0">
            <span className="text-sm shrink-0 mt-0.5">🧠</span>
            <p className="text-xs text-white/60 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* ── Selection hint ── */}
        {content && (
          <div className="px-4 py-1.5 border-b border-white/[0.04] bg-white/[0.01] shrink-0">
            <p className="text-[10px] text-white/20">
              💡 Select any code to get an AI explanation
            </p>
          </div>
        )}

        {/* ── Code block ── */}
        {content ? (
          <div ref={codeRef}
            className="flex-1 overflow-auto bg-[#0d1117] rounded-b-2xl
                       scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
            onMouseUp={handleMouseUp}>
            <table ref={tableRef} className="w-full border-collapse text-xs font-mono">
              <tbody>
                {content.split("\n").map((line, i) => (
                  <tr key={i} className="hover:bg-white/[0.025] transition-colors group">
                    <td className="select-none text-right pr-3 pl-4 py-[1px] text-white/15
                                   border-r border-white/[0.04] w-10 shrink-0
                                   group-hover:text-white/35 transition-colors font-mono">
                      {i + 1}
                    </td>
                    <td className="pl-4 pr-4 py-[1px] text-white/75 whitespace-pre leading-5"
                      dangerouslySetInnerHTML={{ __html: highlight(line) }}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm
                          rounded-b-2xl bg-[#0d1117]">
            Binary file — no preview available.
          </div>
        )}
      </div>
    </>
  );
}
