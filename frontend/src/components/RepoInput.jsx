import { useState } from "react";
import { GitFork, ArrowRight } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";

const PHASES = [
  { value: 1, label: "MVP",  desc: "Fast, basic analysis"    },
  { value: 2, label: "Smart",desc: "Balanced depth & speed"  },
  { value: 3, label: "Full", desc: "Deep analysis, slower"   },
];

/**
 * compact = true → smaller inline strip used after analysis
 * compact = false (default) → full hero version
 */
export default function RepoInput({ onAnalyze, loading, compact = false }) {
  const { state } = useAnalysis();
  const [url,   setUrl]   = useState(state.repoUrl || "");
  const [mode,  setMode]  = useState(state.explainMode || "senior");
  const [phase, setPhase] = useState(1);

  const submit = (e) => {
    e.preventDefault();
    if (url.trim() && !loading) onAnalyze(url.trim(), mode, phase);
  };

  if (compact) {
    return (
      <form onSubmit={submit}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 9,
          padding: "6px 6px 6px 12px",
          maxWidth: 640,
          transition: "border-color var(--t-fast), box-shadow var(--t-fast)",
        }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91,75,255,0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <GitFork size={13} style={{ color: "var(--text-subtle)", flexShrink: 0 }} />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="github.com/owner/repository"
            required
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 12,
              fontFamily: "JetBrains Mono, monospace",
              color: "var(--text)",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary"
            style={{ padding: "5px 12px", fontSize: 12 }}
          >
            {loading
              ? <><SpinIcon size={11} /> Analyzing</>
              : <><ArrowRight size={12} /> Re-analyze</>}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submit}>
      {/* Main input */}
      <div style={{ position: "relative" }}>
        {/* GitHub icon prefix */}
        <div style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 2,
        }}>
          <GitFork size={15} style={{ color: "var(--text-subtle)" }} />
          <span style={{
            fontSize: 13,
            fontFamily: "JetBrains Mono, monospace",
            color: "var(--text-subtle)",
          }}>
            github.com/
          </span>
        </div>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="owner/repository"
          required
          aria-label="GitHub repository URL"
          className="hero-input"
          style={{ paddingLeft: 140, paddingRight: 148 }}
        />

        {/* CTA button */}
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary"
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            padding: "8px 16px",
            fontSize: 13,
          }}
        >
          {loading
            ? <><SpinIcon size={12} /> Analyzing</>
            : <>Analyze <ArrowRight size={13} /></>}
        </button>
      </div>

      {/* Options row */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        marginTop: 14,
        flexWrap: "wrap",
      }}>
        {/* Mode toggle */}
        <ToggleGroup
          label="Mode"
          options={[
            { value: "beginner", label: "Beginner" },
            { value: "senior",   label: "Senior"   },
          ]}
          value={mode}
          onChange={setMode}
        />

        <span style={{ width: 1, height: 16, background: "var(--border)" }} />

        {/* Depth toggle */}
        <ToggleGroup
          label="Depth"
          options={PHASES.map((p) => ({ value: String(p.value), label: p.label, title: p.desc }))}
          value={String(phase)}
          onChange={(v) => setPhase(Number(v))}
        />
      </div>
    </form>
  );
}

function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 500 }}>{label}</span>
      <div style={{
        display: "flex",
        background: "var(--bg-muted)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: 2,
        gap: 1,
      }}>
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              title={opt.title}
              onClick={() => onChange(opt.value)}
              style={{
                padding: "3px 10px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "all var(--t-fast)",
                background: isActive ? "var(--accent)" : "transparent",
                color: isActive ? "#fff" : "var(--text-muted)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpinIcon({ size = 12 }) {
  return (
    <span style={{
      width: size, height: size,
      border: "1.8px solid rgba(255,255,255,0.35)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      display: "inline-block",
      animation: "spin 0.75s linear infinite",
      flexShrink: 0,
    }} />
  );
}
