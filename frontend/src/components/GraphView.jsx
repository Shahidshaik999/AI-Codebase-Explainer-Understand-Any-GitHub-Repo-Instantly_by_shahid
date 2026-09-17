import { useMemo, useEffect } from "react";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { Network } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";

const NODE_COLORS = {
  Python:       "#D97706",
  JavaScript:   "#CA8A04",
  TypeScript:   "#2563EB",
  "React/JSX":  "#0891B2",
  "React/TSX":  "#0891B2",
  Java:         "#EA580C",
  Go:           "#0D9488",
  Rust:         "#C2410C",
  default:      "#6B7280",
};

function buildLayout(rawNodes) {
  const cols = Math.max(3, Math.ceil(Math.sqrt(rawNodes.length)));
  return rawNodes.map((n, i) => ({
    ...n,
    position: { x: (i % cols) * 230, y: Math.floor(i / cols) * 90 },
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
        id: n.id,
        data: { label: n.label },
        style: {
          background: color + "14",
          border: `1.5px solid ${color}50`,
          color,
          borderRadius: 8,
          fontSize: 11,
          padding: "6px 12px",
          maxWidth: 190,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontFamily: "JetBrains Mono, monospace",
          fontWeight: 500,
        },
      };
    }));
  }, [graph]);

  const rfEdges = useMemo(() => {
    if (!graph?.edges?.length) return [];
    return graph.edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--border-strong)" },
    }));
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useEffect(() => { setNodes(rfNodes); }, [rfNodes]);
  useEffect(() => { setEdges(rfEdges); }, [rfEdges]);

  if (!graph?.nodes?.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="animate-slide-up">
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 18px",
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Network size={15} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 1px", letterSpacing: "-0.02em" }}>
            Dependency Graph
          </p>
          <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: 0 }}>
            {graph.nodes.length} nodes · {graph.edges.length} edges
          </p>
        </div>
        {/* Language legend */}
        <div style={{ display: "flex", gap: 10, marginLeft: "auto", flexWrap: "wrap" }}>
          {Object.entries(NODE_COLORS).filter(([k]) => k !== "default").slice(0, 5).map(([lang, color]) => (
            <span key={lang} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-muted)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div style={{
        borderRadius: 10, overflow: "hidden",
        border: "1px solid var(--border)", height: 540,
        background: "var(--bg-subtle)",
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.15}
          maxZoom={2.5}
        >
          <Background color="var(--border)" gap={24} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(n) => n.style?.color || "var(--accent)"}
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 8 }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
