import { useState, useMemo, useEffect } from "react";
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState, MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { getExecutionFlow } from "../services/api";
import { useAnalysis } from "../context/AnalysisContext";

const TYPE_COLORS = {
  file:     { border: "#60a5fa", bg: "rgba(96,165,250,0.08)",  text: "#60a5fa", glow: "rgba(96,165,250,0.3)"  },
  function: { border: "#34d399", bg: "rgba(52,211,153,0.08)",  text: "#34d399", glow: "rgba(52,211,153,0.3)"  },
  class:    { border: "#f59e0b", bg: "rgba(245,158,11,0.08)",  text: "#f59e0b", glow: "rgba(245,158,11,0.3)"  },
};

const EDGE_COLORS = {
  import:  "rgba(255,255,255,0.10)",
  call:    "#34d399",
  inherit: "#f59e0b",
};

function buildLayout(rawNodes) {
  const byType = { file: [], function: [], class: [] };
  rawNodes.forEach((n) => (byType[n.data.type] || byType.file).push(n));
  let y = 0;
  const positioned = [];
  for (const [, nodes] of Object.entries(byType)) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    nodes.forEach((n, i) => {
      positioned.push({
        ...n,
        position: { x: (i % cols) * 210, y: y + Math.floor(i / cols) * 85 },
      });
    });
    y += Math.ceil(nodes.length / Math.max(1, Math.ceil(Math.sqrt(nodes.length)))) * 85 + 60;
  }
  return positioned;
}

export default function FlowGraph() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, flowGraph } = state;

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState("all");

  const load = async () => {
    if (flowGraph) return; // already loaded — skip API call
    setLoading(true); setError(null);
    try {
      const data = await getExecutionFlow(repoUrl);
      dispatch({ type: "SET_FLOW_GRAPH", data });
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const flowData = flowGraph;

  const rfNodes = useMemo(() => {
    if (!flowData?.graph?.nodes) return [];
    const filtered = filter === "all"
      ? flowData.graph.nodes
      : flowData.graph.nodes.filter((n) => n.type === filter);

    return buildLayout(filtered.map((n) => {
      const c = TYPE_COLORS[n.type] || TYPE_COLORS.file;
      const isEntry = n.id === flowData.graph.entry_point;
      return {
        id: n.id,
        data: { label: n.label, type: n.type },
        style: {
          background: isEntry ? "rgba(59,130,246,0.15)" : c.bg,
          border: `${isEntry ? 2 : 1.5}px solid ${isEntry ? "#3b82f6" : c.border + "55"}`,
          color: isEntry ? "#60a5fa" : c.text,
          borderRadius: 10,
          fontSize: 10,
          padding: "5px 10px",
          maxWidth: 170,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          filter: `drop-shadow(0 0 ${isEntry ? "8px" : "4px"} ${isEntry ? "rgba(59,130,246,0.5)" : c.glow})`,
          transition: "all 0.2s",
        },
      };
    }));
  }, [flowData, filter]);

  const rfEdges = useMemo(() => {
    if (!flowData?.graph?.edges) return [];
    const visibleIds = new Set(rfNodes.map((n) => n.id));
    return flowData.graph.edges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e, i) => ({
        id: `e-${i}`,
        source: e.source, target: e.target,
        animated: e.type === "call",
        style: { stroke: EDGE_COLORS[e.type] || EDGE_COLORS.import, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLORS[e.type] || EDGE_COLORS.import },
        label: e.type !== "import" ? e.type : undefined,
        labelStyle: { fontSize: 9, fill: "#6b7280" },
      }));
  }, [flowData, rfNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useEffect(() => { setNodes(rfNodes); }, [rfNodes]);
  useEffect(() => { setEdges(rfEdges); }, [rfEdges]);

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="card flex items-center gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
          }}>🔀</div>
          <div>
            <h3 className="font-bold text-white">Execution Flow Simulator</h3>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>AST-extracted function/class call graph</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {flowData && (
            <span style={{
              fontSize: 11, color: "#34d399",
              background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.20)",
              padding: "3px 10px", borderRadius: 8,
            }}>✓ Already Loaded</span>
          )}
          <div className="flex gap-1 bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.06]">
            {["all", "file", "function", "class"].map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={filter === t ? "tab-pill-active text-xs" : "tab-pill-inactive text-xs"}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading || !!flowData} className="btn-primary text-sm">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Building…</>
              : flowData ? "⚡ Loaded" : "⚡ Build Flow"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, fontSize: 13,
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444",
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {flowData && (
        <>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2">
              <span className="badge">{flowData.graph.nodes.length} nodes</span>
              <span className="badge">{flowData.graph.edges.length} edges</span>
              {flowData.graph.entry_point && (
                <span className="badge" style={{ color: "#60a5fa", borderColor: "rgba(96,165,250,0.25)", background: "rgba(96,165,250,0.08)" }}>
                  Entry: {flowData.graph.entry_point.split("::").pop()}
                </span>
              )}
            </div>
            <div className="flex gap-4 ml-auto flex-wrap">
              {Object.entries(TYPE_COLORS).map(([type, c]) => (
                <span key={type} className="flex items-center gap-1.5 text-xs text-white/40">
                  <span className="w-2 h-2 rounded-sm" style={{ background: c.border }} />
                  {type}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs text-white/40">
                <span className="w-4 h-px inline-block" style={{ background: "#34d399" }} /> call
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/40">
                <span className="w-4 h-px inline-block" style={{ background: "#f59e0b" }} /> inherit
              </span>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/[0.06]" style={{ height: 540 }}>
            <ReactFlow nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.1} maxZoom={3}>
              <Background color="rgba(255,255,255,0.025)" gap={24} size={1} />
              <Controls />
              <MiniMap nodeColor={(n) => n.style?.color || "#334155"}
                style={{ background: "#0B0F1A", border: "1px solid rgba(255,255,255,0.06)" }} />
            </ReactFlow>
          </div>
        </>
      )}
    </div>
  );
}
