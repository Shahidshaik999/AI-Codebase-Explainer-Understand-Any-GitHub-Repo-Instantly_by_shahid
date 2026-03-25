import { useState } from "react";
import { useAnalysis } from "../context/AnalysisContext";

const PHASES = [
  { value: 1, label: "MVP" },
  { value: 2, label: "Smart" },
  { value: 3, label: "Full" },
];

export default function RepoInput({ onAnalyze, loading }) {
  const { state } = useAnalysis();
  const [url,   setUrl]   = useState(state.repoUrl || "");
  const [mode,  setMode]  = useState(state.explainMode || "senior");
  const [phase, setPhase] = useState(1);

  const submit = (e) => {
    e.preventDefault();
    if (url.trim()) onAnalyze(url.trim(), mode, phase);
  };

  return (
    <form onSubmit={submit} style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>
      {/* Main input row — no card box */}
      <div style={{ position: "relative", display: "flex", gap: 8, alignItems: "center" }}>
        {/* Prefix */}
        <span style={{
          position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
          fontSize: 13, color: "#374151", fontFamily: "JetBrains Mono, monospace",
          pointerEvents: "none", userSelect: "none", zIndex: 1,
        }}>
          github.com/
        </span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="owner / repository"
          required
          className="hero-input"
          style={{ paddingLeft: 104, paddingRight: 130 }}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
            padding: "8px 18px", fontSize: 13,
          }}
        >
          {loading
            ? <><Spin /> Analyzing</>
            : "Analyze →"
          }
        </button>
      </div>

      {/* Options row — minimal, centered */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 20,
        marginTop: 14, alignItems: "center", flexWrap: "wrap",
      }}>
        {/* Mode */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#4B5563" }}>Mode</span>
          <div style={{
            display: "flex", gap: 1,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: 2,
          }}>
            {["beginner", "senior"].map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: mode === m ? "#7C3AED" : "transparent",
                color: mode === m ? "#fff" : "#6B7280",
              }}>
                {m === "beginner" ? "Beginner" : "Senior"}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)" }} />

        {/* Depth */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#4B5563" }}>Depth</span>
          <div style={{
            display: "flex", gap: 1,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: 2,
          }}>
            {PHASES.map((p) => (
              <button key={p.value} type="button" onClick={() => setPhase(p.value)} style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: phase === p.value ? "#7C3AED" : "transparent",
                color: phase === p.value ? "#fff" : "#6B7280",
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}

function Spin() {
  return (
    <span style={{
      width: 12, height: 12,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      display: "inline-block",
      animation: "spin 0.8s linear infinite",
    }} />
  );
}
