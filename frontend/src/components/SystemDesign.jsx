import { useState, useMemo, useEffect } from "react";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { useAnalysis } from "../context/AnalysisContext";
import { generateSystemDesign } from "../services/api";

const TYPE_META = {
  frontend: { color: "#60A5FA", bg: "rgba(96,165,250,0.07)",  label: "Frontend" },
  backend:  { color: "#34D399", bg: "rgba(52,211,153,0.07)",  label: "Backend"  },
  database: { color: "#F59E0B", bg: "rgba(245,158,11,0.07)",  label: "Database" },
  cache:    { color: "#A78BFA", bg: "rgba(167,139,250,0.07)", label: "Cache"    },
  queue:    { color: "#FB923C", bg: "rgba(251,146,60,0.07)",  label: "Queue"    },
  external: { color: "#94A3B8", bg: "rgba(148,163,184,0.07)", label: "External" },
  devops:   { color: "#F472B6", bg: "rgba(244,114,182,0.07)", label: "DevOps"   },
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
        position: { x: col * 220, y: i * 100 },
        style: {
          background: m.bg, border: `1px solid ${m.color}40`, color: m.color,
          borderRadius: 10, fontSize: 11, padding: "7px 14px",
          maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        },
      });
    });
    if ((byType[type] || []).length) col++;
  });
  const edges = [];
  const has = (t) => (byType[t] || []).length > 0;
  const first = (t) => (byType[t] || [])[0]?.name;
  const wire = (from, to, label, color, animated = false) => {
    if (has(from) && has(to)) edges.push({
      id: `${from}-${to}`, source: first(from), target: first(to), animated,
      style: { stroke: color, strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color },
      label, labelStyle: { fontSize: 9, fill: "#6B7280" },
    });
  };
  wire("frontend","backend","HTTP","#60A5FA",true);
  wire("backend","database","query","#F59E0B");
  wire("backend","cache","cache","#A78BFA");
  wire("backend","queue","publish","#FB923C",true);
  wire("backend","external","API","#94A3B8");
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="animate-slide-up">

      {/* Header */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB" }}>System Design</p>
          <p style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>AI-generated architecture from codebase</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {data && (
            <>
              <span className="badge-green">✓ Generated</span>
              <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 2 }}>
                {[["design","Design"],["graph","Graph"]].map(([v, l]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={view === v ? "tab-pill-active" : "tab-pill-inactive"}
                    style={{ fontSize: 11 }}>
                    {l}
                  </button>
                ))}
              </div>
              <button onClick={() => dispatch({ type: "SET_SYSTEM_DESIGN", data: null })}
                className="btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }}>
                Regenerate
              </button>
            </>
          )}
          {!data && (
            <button onClick={load} disabled={loading} className="btn-primary">
              {loading ? <><Spin /> Generating…</> : "Generate"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13,
                      background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
          {error}
          <button onClick={load} style={{ marginLeft: 10, textDecoration: "underline", fontSize: 12, background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {loading && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Spin />
          <p style={{ fontSize: 13, color: "#6B7280" }}>Analyzing architecture…</p>
        </div>
      )}

      {data && view === "design" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="animate-slide-up">

          {/* Overview */}
          <div className="card-hover">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <p className="section-label">Architecture Overview</p>
              <span className="badge">{data.architecture_pattern}</span>
            </div>
            <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.7 }}>{data.architecture_overview}</p>
          </div>

          {/* Components */}
          <div className="card-hover">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <p className="section-label">Components</p>
              <span className="badge">{data.components.length}</span>
            </div>
            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14,
                          paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {Object.entries(TYPE_META).map(([type, m]) => (
                <span key={type} style={{ display: "flex", alignItems: "center", gap: 5,
                                          fontSize: 11, color: "#6B7280" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block" }} />
                  {m.label}
                </span>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {data.components.map((c, i) => {
                const m = TYPE_META[c.type] || TYPE_META.backend;
                return (
                  <div key={i} style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: m.bg, border: `1px solid ${m.color}25`,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = m.color + "50"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = m.color + "25"; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: m.color, opacity: 0.6 }}>{c.type}</span>
                    </div>
                    {c.technology && <p style={{ fontSize: 11, color: "#4B5563", fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>{c.technology}</p>}
                    <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>{c.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Flow */}
          {data.data_flow?.length > 0 && (
            <div className="card-hover">
              <p className="section-label" style={{ marginBottom: 14 }}>Data Flow</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 20, position: "relative" }}>
                <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 1,
                              background: "linear-gradient(to bottom, #7C3AED, rgba(124,58,237,0.1))" }} />
                {data.data_flow.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      background: "#7C3AED", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700, marginLeft: -27,
                    }}>{i + 1}</span>
                    <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6, margin: 0 }}>
                      {step.replace(/^Step \d+:\s*/i, "")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-col grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { title: "Scaling",      items: data.scaling_suggestions, color: "#10B981", bullet: "↑" },
              { title: "Bottlenecks",  items: data.bottlenecks,         color: "#F59E0B", bullet: "⚠" },
              { title: "Improvements", items: data.improvements,        color: "#7C3AED", bullet: "→" },
            ].map(({ title, items, color, bullet }) => (
              <div key={title} className="card-hover">
                <p className="section-label" style={{ marginBottom: 10 }}>{title}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(items || []).map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#9CA3AF" }}>
                      <span style={{ color, flexShrink: 0 }}>{bullet}</span>
                      <span style={{ lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && view === "graph" && (
        <div className="card animate-slide-up">
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", height: 500 }}>
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              fitView fitViewOptions={{ padding: 0.25 }} minZoom={0.2} maxZoom={3}>
              <Background color="rgba(255,255,255,0.02)" gap={24} size={1} />
              <Controls />
              <MiniMap nodeColor={(n) => n.style?.color || "#334155"}
                style={{ background: "#0B0F14", border: "1px solid rgba(255,255,255,0.07)" }} />
            </ReactFlow>
          </div>
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
