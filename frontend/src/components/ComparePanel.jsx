import { useState } from "react";
import { GitCompareArrows, ArrowRight, Star, AlertTriangle, CheckCircle, Trophy } from "lucide-react";
import { compareRepos } from "../services/api";
import { useAnalysis } from "../context/AnalysisContext";

export default function ComparePanel() {
  const { state } = useAnalysis();
  const [urlA, setUrlA] = useState(state.repoUrl || "");
  const [urlB, setUrlB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const compare = async () => {
    if (!urlA.trim() || !urlB.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await compareRepos(urlA.trim(), urlB.trim(), state.explainMode);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="animate-slide-up">

      {/* Header */}
      <div style={{
        padding: "16px 20px",
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
        display: "flex", alignItems: "flex-start", gap: 14,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <GitCompareArrows size={18} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 3px", letterSpacing: "-0.02em" }}>
            Compare Repositories
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            Powered by Meta Llama 4 · Side-by-side AI analysis of two codebases
          </p>
        </div>
        <span className="badge-purple" style={{ marginLeft: "auto", flexShrink: 0 }}>
          Meta Llama 4
        </span>
      </div>

      {/* Inputs */}
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Repository A
            </p>
            <input
              className="input"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}
              placeholder="https://github.com/owner/repo-a"
              value={urlA}
              onChange={(e) => setUrlA(e.target.value)}
            />
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--bg-muted)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 20,
          }}>
            <ArrowRight size={13} style={{ color: "var(--text-subtle)" }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Repository B
            </p>
            <input
              className="input"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}
              placeholder="https://github.com/owner/repo-b"
              value={urlB}
              onChange={(e) => setUrlB(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={compare}
          disabled={loading || !urlA.trim() || !urlB.trim()}
          className="btn-primary"
          style={{ width: "100%" }}
        >
          {loading
            ? <><SpinIcon /> Comparing with Meta Llama 4…</>
            : <><GitCompareArrows size={14} /> Compare Repositories</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 14px", borderRadius: 8,
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          fontSize: 13, color: "var(--danger)",
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-slide-up">

          {/* Side by side repo cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[result.repo_a, result.repo_b].map((repo, i) => repo && (
              <div key={i} className="card-hover">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <p className="section-label" style={{ marginBottom: 4 }}>Repo {i === 0 ? "A" : "B"}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
                      {repo.name}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 22, fontWeight: 800, color: "var(--accent)",
                      lineHeight: 1, marginBottom: 2,
                    }}>
                      {repo.code_quality_score}<span style={{ fontSize: 12, color: "var(--text-subtle)" }}>/10</span>
                    </div>
                    <p style={{ fontSize: 10, color: "var(--text-subtle)", margin: 0 }}>quality score</p>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65, margin: "0 0 12px" }}>
                  {repo.summary}
                </p>

                {/* Tech stack */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                  {repo.tech_stack?.map((t, j) => (
                    <span key={j} className="badge" style={{ fontSize: 10 }}>{t}</span>
                  ))}
                </div>

                {/* Architecture */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <span className="badge-purple" style={{ fontSize: 10 }}>{repo.architecture_pattern}</span>
                  <span className="badge" style={{ fontSize: 10 }}>{repo.complexity} complexity</span>
                </div>

                {/* Strengths */}
                {repo.strengths?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    {repo.strengths.map((s, j) => (
                      <div key={j} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                        <CheckCircle size={11} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Weaknesses */}
                {repo.weaknesses?.length > 0 && (
                  <div>
                    {repo.weaknesses.map((w, j) => (
                      <div key={j} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                        <AlertTriangle size={11} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comparison summary */}
          {result.comparison && (
            <div className="card-hover">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Trophy size={14} style={{ color: "var(--warning)" }} />
                <p className="section-label">Comparison Summary</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{
                  padding: "10px 12px", borderRadius: 8,
                  background: "var(--success-bg)", border: "1px solid var(--success-border)",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                    Better for Learning
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
                    {result.comparison.better_for_learning === "repo_a" ? result.repo_a?.name : result.repo_b?.name}
                  </p>
                </div>
                <div style={{
                  padding: "10px 12px", borderRadius: 8,
                  background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                    Better for Production
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
                    {result.comparison.better_for_production === "repo_a" ? result.repo_a?.name : result.repo_b?.name}
                  </p>
                </div>
              </div>

              {/* Key differences */}
              {result.comparison.key_differences?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: "0 0 8px", fontWeight: 600 }}>Key Differences</p>
                  {result.comparison.key_differences.map((d, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                      <span style={{ color: "var(--accent)", fontSize: 11, flexShrink: 0, marginTop: 1 }}>→</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{d}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendation */}
              {result.comparison.recommendation && (
                <div style={{
                  padding: "12px 14px", borderRadius: 8,
                  background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                    AI Recommendation
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7, margin: 0 }}>
                    {result.comparison.recommendation}
                  </p>
                </div>
              )}
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
      borderTopColor: "#fff", borderRadius: "50%",
      display: "inline-block", animation: "spin 0.75s linear infinite",
    }} />
  );
}
