import { useMemo, useEffect } from "react";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { useAnalysis } from "../context/AnalysisContext";

const NODE_COLORS = {
  Python: "#facc15", JavaScript: "#fde047", TypeScript: "#60a5fa",
  "React/JSX": "#22d3ee", "React/TSX": "#67e8f9", Java: "#fb923c",
  Go: "#2dd4bf", default: "#94a3b8",
};

function buildLayout(rawNodes) {
  const cols = Math.max(3, Math.ceil(Math.sqrt(rawNodes.length)));
  return rawNodes.map((n, i) => ({
    ...n, position: { x: (i % cols) * 230, y: Math.floor(i / cols) * 90 },
  }));
}

export default function GraphView() {
  const { state: { analysisData } } = useAnalysis();
  const graph = analysisData?.dependency_graph;

  const rfNodes = useMemo(() => {
    if (!graph?.nodes?.length) return [];
    return buildLayout(graph.nodes.map((n) => {
      const color = NODE_COLORS[n.language] || NODE_COLORS.default;
      return {
        id: n.id, data: { label: n.label },
        style: {
          background: color + "12", border: `1.5px solid ${color}50`, color,
          borderRadius: 10, fontSize: 11, padding: "6px 12px",
          maxWidth: 190, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          filter: `drop-shadow(0 0 4px ${color}40)`, transition: "all 0.2s",
        },
      };
    }));
  }, [graph]);

  const rfEdges = useMemo(() => {
    if (!graph?.edges?.length) return [];
    return graph.edges.map((e, i) => ({
      id: `e-${i}`, source: e.source, target: e.target,
      style: { stroke: "rgba(255,255,255,0.12)", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.15)" },
    }));
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useEffect(() => { setNodes(rfNodes); }, [rfNodes]);
  useEffect(() => { setEdges(rfEdges); }, [rfEdges]);

  if (!graph?.nodes?.length) return null;

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">🕸️</div>
        <div>
          <h3 className="text-sm font-semibold text-white">Dependency Graph</h3>
          <p className="text-xs text-white/35">{graph.nodes.length} nodes · {graph.edges.length} edges</p>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/[0.06]" style={{ height: 500 }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.15} maxZoom={2.5}>
          <Background color="rgba(255,255,255,0.025)" gap={24} size={1} />
          <Controls />
          <MiniMap nodeColor={(n) => n.style?.color || "#334155"}
            style={{ background: "#0B0F1A", border: "1px solid rgba(255,255,255,0.06)" }} />
        </ReactFlow>
      </div>
    </div>
  );
}
