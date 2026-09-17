import { useState, useMemo, useEffect } from "react";
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState, MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Cpu, TrendingUp, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { generateSystemDesign } from "../services/api";

const TYPE_META = {
  frontend: { color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  label: "Frontend" },
  backend:  { color: "#10B981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  label: "Backend"  },
  database: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  label: "Database" },
  cache:    { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.25)",  label: "Cache"    },
  queue:    { color: "#F97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.25)",  label: "Queue"    },
  external: { color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.25)", label: "External" },
  devops:   { color: "#EC4899", bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.25)",  label: "DevOps"   },
};

function buildGraph(components) {
  const byType = {};
  components.forEach((c) => {
    const t = c.type || "backend";
    if (!byType[t]) byType[t] = [];
    byType[t].push(c);
  });
  const nodes = [];
  let col = 0;
  ["frontend","backend","database","cache","queue","external","devops"].forEach((type) => {
    (byType[type] || []).forEach((c, i) => {
      const m = TYPE_META[type] || TYPE_META.backend;
      nodes.push({
        id: c.name,
        data: { label: c.name },
        position: { x: col * 230, y: i * 100 },
        style: {
          background: m.bg, border: `1.5px solid ${m.border}`,
          color: m.color, borderRadius: 8, fontSize: 11,
          padding: "7px 14px", maxWidth: 190,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          fontWeight: 500, fontFamily: "JetBrains Mono, monospace",
        },
      });
    });
    if ((byType[type] || []).length) col++;
  });
  const edges = [];
  const has   = (t) => (byType[t] || []).length > 0;
  const first = (t) => (byType[t] || [])[0]?.name;
  const wire  = (from, to, label, color, animated = false) => {
    if (has(from) && has(to)) edges.push({
      id: `${from}-${to}`, source: first(from), target: first(to), animated,
      style: { stroke: color, strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color },
      label, labelStyle: { fontSize: 9, fill: "var(--text-subtle)" },
      labelBgStyle: { fill: "var(--bg-card)", fillOpacity: 0.85 },
    });
  };
  wire("frontend","backend","HTTP","#5B4BFF",true);
  wire("backend","database","query","#D97706");
  wire("backend","cache","cache","#7C3AED");
  wire("backend","queue","publish","#EA580C",true);
  wire("backend","external","API","#4B5563");
  return { nodes, edges };
}

export default function SystemDesign() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, explainMode, analysisData, systemDesign: data } = state;

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [view,    setView]    = useState("design");

  const load = async () => {
    if (data) return;
    setLoading(true); setError(null);
    try {
      const result = await generateSystemDesign(
        repoUrl, explainMode,
        analysisData?.summary || null,
        analysisData?.tech_stack || null,
        analysisData?.execution_flow || null,
      );
      dispatch({ type: "SET_SYSTEM_DESIGN", data: result });
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const { nodes: rfNodes, edges: rfEdges } = useMemo(
    () => data?.components?.length ? buildGraph(data.components) : { nodes: [], edges: [] },
    [data]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useEffect(() => { setNodes(rfNodes); }, [rfNodes]);
  useEffect(() => { setEdges(rfEdges); }, [rfEdges]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-slide-up">

      {/* ── Header ── */}
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
          <Cpu size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
            System Architecture
          </h2>
          <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: 0 }}>
            AI-generated technical architecture of your repository
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {data && (
            <>
              <span className="badge-green">✓ Generated</span>
              {/* View toggle */}
              <div style={{ display: "flex", gap: 1, background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: 2 }}>
                {[["design","Design"],["graph","Graph"]].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={view === v ? "tab-pill-active" : "tab-pill-inactive"}
                    style={{ fontSize: 11 }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <button
                onClick={() => dispatch({ type: "SET_SYSTEM_DESIGN", data: null })}
                className="btn-secondary"
                style={{ fontSize: 12 }}
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            </>
          )}
          {!data && (
            <button onClick={load} disabled={loading} className="btn-primary">
              {loading ? <><SpinIcon /> Generating…</> : <><Cpu size={13} /> Generate</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: "12px 14px", borderRadius: 8, fontSize: 13,
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          color: "var(--danger)", display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={load} className="btn-ghost" style={{ fontSize: 12 }}>
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            width: 16, height: 16, border: "2px solid var(--border)",
            borderTopColor: "var(--accent)", borderRadius: "50%",
            display: "inline-block", animation: "spin 0.8s linear infinite", flexShrink: 0,
          }} />
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Analyzing architecture…
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!data && !loading && !error && (
        <div style={{
          textAlign: "center", padding: "52px 20px",
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
        }}>
          <Cpu size={30} style={{ margin: "0 auto 12px", color: "var(--border-strong)" }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", margin: "0 0 4px" }}>
            No architecture generated yet
          </p>
          <p style={{ fontSize: 12, color: "var(--text-subtle)", margin: "0 0 16px" }}>
            Generate an AI-powered system design document from your codebase
          </p>
          <button onClick={load} className="btn-primary">
            <Cpu size={13} /> Generate Architecture
          </button>
        </div>
      )}

      {/* ── Design view ── */}
      {data && view === "design" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-slide-up">

          {/* Architecture overview */}
          <div className="card-hover">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p className="section-label">Architecture Overview</p>
              {data.architecture_pattern && (
                <span className="badge-purple">{data.architecture_pattern}</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.75, margin: 0 }}>
              {data.architecture_overview}
            </p>
          </div>

          {/* Components */}
          {data.components?.length > 0 && (
            <div className="card-hover">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p className="section-label">Components</p>
                <span className="badge">{data.components.length}</span>
              </div>
              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border-muted)" }}>
                {Object.entries(TYPE_META).map(([type, m]) => (
                  <span key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block" }} />
                    {m.label}
                  </span>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {data.components.map((c, i) => {
                  const m = TYPE_META[c.type] || TYPE_META.backend;
                  return (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: 8,
                      background: m.bg, border: `1px solid ${m.border}`,
                      transition: "transform var(--t-base), box-shadow var(--t-base)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{c.name}</span>
                        <span style={{
                          fontSize: 9, color: m.color, opacity: 0.7, fontWeight: 500,
                          textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                          {c.type}
                        </span>
                      </div>
                      {c.technology && (
                        <p style={{ fontSize: 10, color: m.color, fontFamily: "JetBrains Mono, monospace", margin: "0 0 4px", opacity: 0.8 }}>
                          {c.technology}
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55, margin: 0 }}>
                        {c.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data flow */}
          {data.data_flow?.length > 0 && (
            <div className="card-hover">
              <p className="section-label" style={{ marginBottom: 16 }}>Data Flow</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
                {data.data_flow.map((step, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    paddingBottom: i < data.data_flow.length - 1 ? 14 : 0,
                    position: "relative",
                  }}>
                    {/* Step number + line */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: "var(--accent)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      {i < data.data_flow.length - 1 && (
                        <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 4, minHeight: 14 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, margin: "2px 0 0", paddingBottom: i < data.data_flow.length - 1 ? 0 : 0 }}>
                      {step.replace(/^Step \d+:\s*/i, "")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scaling / Bottlenecks / Improvements */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { title: "Scaling Suggestions", icon: TrendingUp,     items: data.scaling_suggestions, color: "var(--success)", bullet: "↑" },
              { title: "Bottlenecks",         icon: AlertTriangle,  items: data.bottlenecks,         color: "var(--warning)", bullet: "⚠" },
              { title: "Improvements",        icon: ArrowRight,     items: data.improvements,        color: "var(--accent)",  bullet: "→" },
            ].map(({ title, icon: Icon, items, color, bullet }) => (
              items?.length > 0 && (
                <div key={title} className="card-hover">
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                    <Icon size={12} style={{ color, flexShrink: 0 }} />
                    <p className="section-label">{title}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                        <span style={{ color, flexShrink: 0, marginTop: 1 }}>{bullet}</span>
                        <span style={{ lineHeight: 1.55 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* ── Graph view ── */}
      {data && view === "graph" && (
        <div
          style={{
            borderRadius: 10, overflow: "hidden",
            border: "1px solid var(--border)", height: 520,
            background: "var(--bg-subtle)",
          }}
          className="animate-slide-up"
        >
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            fitView fitViewOptions={{ padding: 0.25 }} minZoom={0.2} maxZoom={3}
          >
            <Background color="var(--border)" gap={24} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(n) => n.style?.color || "var(--accent)"}
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 8 }}
            />
          </ReactFlow>
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
