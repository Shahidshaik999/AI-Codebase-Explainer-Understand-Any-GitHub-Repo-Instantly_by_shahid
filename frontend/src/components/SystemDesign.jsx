import { useState, useMemo, useEffect } from "react";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { useAnalysis } from "../context/AnalysisContext";
import { generateSystemDesign } from "../services/api";

const TYPE_META = {
  frontend: { color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  glow: "rgba(96,165,250,0.25)",  emoji: "🖥️", label: "Frontend" },
  backend:  { color: "#34d399", bg: "rgba(52,211,153,0.08)",  glow: "rgba(52,211,153,0.25)",  emoji: "⚙️", label: "Backend"  },
  database: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  glow: "rgba(245,158,11,0.25)",  emoji: "🗄️", label: "Database" },
  cache:    { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", glow: "rgba(167,139,250,0.25)", emoji: "⚡", label: "Cache"    },
  queue:    { color: "#fb923c", bg: "rgba(251,146,60,0.08)",  glow: "rgba(251,146,60,0.25)",  emoji: "📨", label: "Queue"    },
  external: { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", glow: "rgba(148,163,184,0.2)",  emoji: "🌐", label: "External" },
  devops:   { color: "#f472b6", bg: "rgba(244,114,182,0.08)", glow: "rgba(244,114,182,0.25)", emoji: "🔧", label: "DevOps"   },
};

const PATTERN_META = {
  monolith:       { label: "Monolith",      color: "bg-blue-500/10 text-blue-400 border-blue-500/25"     },
  microservices:  { label: "Microservices", color: "bg-green-500/10 text-green-400 border-green-500/25"  },
  serverless:     { label: "Serverless",    color: "bg-purple-500/10 text-purple-400 border-purple-500/25"},
  "event-driven": { label: "Event-Driven",  color: "bg-orange-500/10 text-orange-400 border-orange-500/25"},
  layered:        { label: "Layered",       color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25"},
  other:          { label: "Other",         color: "bg-white/[0.06] text-white/50 border-white/[0.10]"   },
};

function buildFlowGraph(components) {
  const byType = {};
  components.forEach((c) => { const t = c.type || "backend"; if (!byType[t]) byType[t] = []; byType[t].push(c); });
  const nodes = [];
  let col = 0;
  ["frontend","backend","database","cache","queue","external","devops"].forEach((type) => {
    (byType[type] || []).forEach((c, i) => {
      const meta = TYPE_META[type] || TYPE_META.backend;
      nodes.push({
        id: c.name, data: { label: `${meta.emoji} ${c.name}` },
        position: { x: col * 230, y: i * 110 },
        style: {
          background: meta.bg, border: `1.5px solid ${meta.color}50`, color: meta.color,
          borderRadius: 12, fontSize: 11, padding: "8px 14px", maxWidth: 190,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          filter: `drop-shadow(0 0 6px ${meta.glow})`,
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
      label, labelStyle: { fontSize: 9, fill: "#6b7280" },
    });
  };
  wire("frontend","backend","HTTP/REST","#60a5fa",true);
  wire("backend","database","query","#f59e0b");
  wire("backend","cache","cache","#a78bfa");
  wire("backend","queue","publish","#fb923c",true);
  wire("backend","external","API call","#94a3b8");
  return { nodes, edges };
}

function ComponentCard({ c }) {
  const meta = TYPE_META[c.type] || TYPE_META.backend;
  return (
    <div className="rounded-2xl p-4 border transition-all duration-300 cursor-default hover:-translate-y-1 hover:scale-[1.02]"
      style={{ borderColor: meta.color + "25", background: meta.bg }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 24px ${meta.glow}`; e.currentTarget.style.borderColor = meta.color + "60"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = meta.color + "25"; }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{meta.emoji}</span>
        <span className="font-semibold text-sm" style={{ color: meta.color }}>{c.name}</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono border"
          style={{ background: meta.color + "15", color: meta.color, borderColor: meta.color + "30" }}>
          {c.type}
        </span>
      </div>
      {c.technology && <p className="text-xs font-mono text-white/35 mb-1.5">{c.technology}</p>}
      <p className="text-xs text-white/55 leading-relaxed">{c.description}</p>
    </div>
  );
}

export default function SystemDesign() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, explainMode, analysisData, systemDesign: data } = state;

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [view, setView]       = useState("design");

  const load = async () => {
    // Don't re-fetch if already generated
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
    () => data?.components?.length ? buildFlowGraph(data.components) : { nodes: [], edges: [] },
    [data]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useEffect(() => { setNodes(rfNodes); }, [rfNodes]);
  useEffect(() => { setEdges(rfEdges); }, [rfEdges]);

  const patternMeta = PATTERN_META[data?.architecture_pattern] || PATTERN_META.other;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="card flex items-center gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-lg shrink-0">🏗️</div>
          <div>
            <h3 className="font-bold text-white">Auto System Design Generator</h3>
            <p className="text-xs text-white/35 mt-0.5">AI-generated architecture from codebase analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {data && (
            <>
              {/* Already generated badge */}
              <span className="badge-success text-xs">✓ Generated</span>
              <div className="flex gap-1 bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.06]">
                {[["design","📋 Design"],["graph","🕸️ Graph"]].map(([v,label]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={v === view ? "tab-pill-active text-xs" : "tab-pill-inactive text-xs"}>
                    {label}
                  </button>
                ))}
              </div>
              {/* Allow regeneration */}
              <button onClick={() => { dispatch({ type: "SET_SYSTEM_DESIGN", data: null }); setError(null); }}
                className="btn-ghost text-xs px-3 py-1.5">
                ↺ Regenerate
              </button>
            </>
          )}
          {!data && (
            <button onClick={load} disabled={loading} className="btn-primary text-sm">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                : "🏗️ Generate System Design"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card border-accent-red/20 bg-accent-red/5 text-accent-red text-sm">
          <strong>Error:</strong> {error}
          <button onClick={load} className="ml-3 underline text-xs">Retry</button>
        </div>
      )}

      {loading && (
        <div className="card flex items-center gap-4">
          <div className="relative w-8 h-8 shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-accent-blue/15" />
            <div className="absolute inset-0 rounded-full border-2 border-t-accent-blue border-r-accent-purple animate-spin" />
          </div>
          <p className="text-sm text-white/50 animate-shimmer">Analyzing architecture and generating system design…</p>
        </div>
      )}

      {data && view === "design" && (
        <div className="space-y-4 animate-slide-up">
          <div className="card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">📊</div>
              <h3 className="section-title">Architecture Overview</h3>
              <span className={`ml-auto text-xs px-3 py-1 rounded-full font-semibold border ${patternMeta.color}`}>{patternMeta.label}</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{data.architecture_overview}</p>
          </div>

          <div className="card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">🧱</div>
              <h3 className="section-title">System Components</h3>
              <span className="ml-auto badge">{data.components.length}</span>
            </div>
            <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-white/[0.06]">
              {Object.entries(TYPE_META).map(([type, meta]) => (
                <span key={type} className="flex items-center gap-1.5 text-xs text-white/40">
                  <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />{meta.label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
              {data.components.map((c, i) => <ComponentCard key={i} c={c} />)}
            </div>
          </div>

          <div className="card-hover">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">🔁</div>
              <h3 className="section-title">Data Flow</h3>
            </div>
            <div className="relative pl-10">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-accent-blue/50 via-accent-purple/30 to-transparent" />
              <ol className="space-y-5 stagger">
                {data.data_flow.map((step, i) => (
                  <li key={i} className="relative animate-slide-up">
                    <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple
                                    flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                      {i + 1}
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{step.replace(/^Step \d+:\s*/i, "")}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Scaling Strategies", icon: "⚡", color: "accent-green", items: data.scaling_suggestions, bullet: "▲", bulletColor: "text-accent-green" },
              { title: "Bottlenecks",        icon: "⚠️", color: "accent-yellow", items: data.bottlenecks,          bullet: "⚠", bulletColor: "text-accent-yellow" },
              { title: "Improvements",       icon: "🚀", color: "accent-blue",   items: data.improvements,         bullet: "→", bulletColor: "text-accent-blue"   },
            ].map(({ title, icon, color, items, bullet, bulletColor }) => (
              <div key={title} className={`card-hover border-${color}/10`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-7 h-7 rounded-lg bg-${color}/10 border border-${color}/20 flex items-center justify-center text-sm`}>{icon}</div>
                  <h3 className="text-xs font-semibold text-white">{title}</h3>
                </div>
                <ul className="space-y-3">
                  {items.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-xs text-white/60 hover:text-white/80 transition-colors">
                      <span className={`${bulletColor} shrink-0 mt-0.5`}>{bullet}</span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && view === "graph" && (
        <div className="card animate-slide-up space-y-4">
          <div className="flex flex-wrap gap-3">
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <span key={type} className="flex items-center gap-1.5 text-xs text-white/40">
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />{meta.label}
              </span>
            ))}
          </div>
          <div className="rounded-xl overflow-hidden border border-white/[0.06]" style={{ height: 500 }}>
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              fitView fitViewOptions={{ padding: 0.25 }} minZoom={0.2} maxZoom={3}>
              <Background color="rgba(255,255,255,0.025)" gap={24} size={1} />
              <Controls />
              <MiniMap nodeColor={(n) => n.style?.color || "#334155"}
                style={{ background: "#0B0F1A", border: "1px solid rgba(255,255,255,0.06)" }} />
            </ReactFlow>
          </div>
        </div>
      )}
    </div>
  );
}
