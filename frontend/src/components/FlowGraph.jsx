import { useState, useMemo, useEffect } from "react";
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState, MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { GitBranch } from "lucide-react";
import { getExecutionFlow } from "../services/api";
import { useAnalysis } from "../context/AnalysisContext";

const TYPE_COLORS = {
  file:     { border: "#5B4BFF", bg: "rgba(91,75,255,0.08)",   text: "#5B4BFF",  label: "File"     },
  function: { border: "#059669", bg: "rgba(5,150,105,0.08)",   text: "#059669",  label: "Function" },
  class:    { border: "#D97706", bg: "rgba(215,119,6,0.08)",   text: "#D97706",  label: "Class"    },
};

const EDGE_COLORS = {
  import:  "#D1D5DB",
  call:    "#059669",
  inherit: "#D97706",
};

function buildLayout(rawNodes) {
  const byType = { file: [], function: [], class: [] };
  rawNodes.forEach((n) => (byType[n.data?.type] || byType.file).push(n));
  let y = 0;
  const positioned = [];
  for (const [, nodes] of Object.entries(byType)) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    nodes.forEach((n, i) => {
      positioned.push({
        ...n,
        position: { x: (i % cols) * 220, y: y + Math.floor(i / cols) * 88 },
      });
    });
    const rows = Math.ceil(nodes.length / Math.max(1, cols));
    if (nodes.length) y += rows * 88 + 60;
  }
  return positioned;
}

export default function FlowGraph() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, flowGraph } = state;

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("all");

  const load = async () => {
    if (flowGraph) return;
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

  const rfNodes = useMemo(() => {
    if (!flowGraph?.graph?.nodes) return [];
    const filtered = filter === "all"
      ? flowGraph.graph.nodes
      : flowGraph.graph.nodes.filter((n) => n.type === filter);

    return buildLayout(filtered.map((n) => {
      const c = TYPE_COLORS[n.type] || TYPE_COLORS.file;
      const isEntry = n.id === flowGraph.graph.entry_point;
      return {
        id: n.id,
        data: { label: n.label, type: n.type },
        style: {
          background: isEntry ? "var(--accent-bg)" : c.bg,
          border: `${isEntry ? 2 : 1.5}px solid ${isEntry ? "var(--accent)" : c.border}`,
          color: isEntry ? "var(--accent)" : c.text,
          borderRadius: 8, fontSize: 11, fontWeight: isEntry ? 600 : 500,
          padding: "6px 12px", maxWidth: 180,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          fontFamily: "JetBrains Mono, monospace",
        },
      };
    }));
  }, [flowGraph, filter]);

  const rfEdges = useMemo(() => {
    if (!flowGraph?.graph?.edges) return [];
    const visibleIds = new Set(rfNodes.map((n) => n.id));
    return flowGraph.graph.edges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e, i) => ({
        id: `e-${i}`,
        source: e.source, target: e.target,
        animated: e.type === "call",
        style: { stroke: EDGE_COLORS[e.type] || EDGE_COLORS.import, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLORS[e.type] || EDGE_COLORS.import },
        label: e.type !== "import" ? e.type : undefined,
        labelStyle: { fontSize: 9, fill: "var(--text-subtle)" },
        labelBgStyle: { fill: "var(--bg-card)", fillOpacity: 0.8 },
      }));
  }, [flowGraph, rfNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useEffect(() => { setNodes(rfNodes); }, [rfNodes]);
  useEffect(() => { setEdges(rfEdges); }, [rfEdges]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="animate-slide-up">

      {/* ── Controls card ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "14px 18px",
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <GitBranch size={15} style={{ color: "var(--accent)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 1px", letterSpacing: "-0.02em" }}>
            Execution Flow
          </p>
          <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: 0 }}>
            AST-extracted function and class call graph
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {flowGraph && (
            <>
              <span className="badge">{flowGraph.graph.nodes.length} nodes</span>
              <span className="badge">{flowGraph.graph.edges.length} edges</span>
              {flowGraph.graph.entry_point && (
                <span className="badge-purple" style={{ fontSize: 10 }}>
                  Entry: {flowGraph.graph.entry_point.split("::").pop()}
                </span>
              )}
            </>
          )}
          {/* Filter */}
          <div style={{ display: "flex", gap: 1, background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: 2 }}>
            {["all", "file", "function", "class"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={filter === t ? "tab-pill-active" : "tab-pill-inactive"}
                style={{ fontSize: 10, padding: "3px 8px" }}
              >
                {t}
              </button>
            ))}
          </div>
          {!flowGraph && (
            <button onClick={load} disabled={loading} className="btn-primary" style={{ fontSize: 12 }}>
              {loading ? <><SpinIcon /> Building…</> : <><GitBranch size={12} /> Build Flow</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: "12px 14px", borderRadius: 8, fontSize: 13,
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          color: "var(--danger)",
        }}>
          {error}
        </div>
      )}

      {/* ── Graph ── */}
      {flowGraph && (
        <>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", paddingLeft: 2 }}>
            {Object.entries(TYPE_COLORS).map(([type, c]) => (
              <span key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.border, display: "inline-block" }} />
                {c.label}
              </span>
            ))}
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
              <span style={{ width: 16, height: 1.5, background: EDGE_COLORS.call, display: "inline-block" }} />
              call
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
              <span style={{ width: 16, height: 1.5, background: EDGE_COLORS.inherit, display: "inline-block" }} />
              inherit
            </span>
          </div>

          {/* Flow canvas */}
          <div style={{
            borderRadius: 10, overflow: "hidden",
            border: "1px solid var(--border)", height: 560,
            background: "var(--bg-subtle)",
          }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={3}
            >
              <Background color="var(--border)" gap={28} size={1} />
              <Controls />
              <MiniMap
                nodeColor={(n) => n.style?.borderColor || "var(--accent)"}
                style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 8 }}
              />
            </ReactFlow>
          </div>
        </>
      )}

      {/* Empty prompt if not loaded */}
      {!flowGraph && !loading && !error && (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 10, color: "var(--text-subtle)",
        }}>
          <GitBranch size={28} style={{ margin: "0 auto 12px", color: "var(--border-strong)" }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", margin: "0 0 4px" }}>
            No flow graph loaded yet
          </p>
          <p style={{ fontSize: 12, color: "var(--text-subtle)", margin: 0 }}>
            Click "Build Flow" to extract the execution graph from source code
          </p>
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
