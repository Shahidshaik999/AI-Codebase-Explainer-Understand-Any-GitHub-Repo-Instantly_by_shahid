import { useState, useEffect } from "react";
import {
  ChevronRight, ChevronDown, Search, X,
  Folder, FolderOpen, File,
} from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { getRepoStructure } from "../services/api";

const EXT_COLOR = {
  ".js":   "#CA8A04", ".jsx":  "#0891B2", ".ts":   "#2563EB", ".tsx":  "#0891B2",
  ".py":   "#D97706", ".go":   "#0D9488", ".rs":   "#C2410C", ".java": "#EA580C",
  ".css":  "#7C3AED", ".scss": "#A855F7", ".html": "#DC2626", ".json": "#16A34A",
  ".md":   "#6B7280", ".yml":  "#D97706", ".yaml": "#D97706", ".env":  "#059669",
  ".sh":   "#059669", ".toml": "#EA580C", ".lock": "#9CA3AF", ".txt":  "#6B7280",
};

function extColor(name) {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "#9CA3AF";
  return EXT_COLOR[name.slice(dot).toLowerCase()] || "#9CA3AF";
}

function nodeMatchesSearch(node, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  if (node.name.toLowerCase().includes(lower)) return true;
  if (node.type === "folder" && node.children)
    return node.children.some((c) => nodeMatchesSearch(c, q));
  return false;
}

function attachPaths(node, parentPath = "") {
  const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
  node.fullPath = fullPath;
  if (node.type === "folder" && node.children)
    node.children.forEach((c) => attachPaths(c, fullPath));
}

function TreeNode({ node, depth = 0, onFileClick, selectedPath, searchQuery }) {
  const [open, setOpen] = useState(depth < 2);
  const indent = depth * 12;

  useEffect(() => {
    if (searchQuery && node.type === "folder") setOpen(true);
  }, [searchQuery, node.type]);

  if (node.type === "folder") {
    const children = searchQuery
      ? node.children?.filter((c) => nodeMatchesSearch(c, searchQuery))
      : node.children;
    if (searchQuery && !children?.length) return null;

    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: `3px 8px 3px ${indent + 8}px`,
            borderRadius: 5,
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
          className="tree-node-folder"
        >
          <span style={{ color: "var(--text-subtle)", flexShrink: 0, width: 12 }}>
            {open
              ? <ChevronDown size={10} />
              : <ChevronRight size={10} />}
          </span>
          <span style={{ color: "#F59E0B", flexShrink: 0 }}>
            {open ? <FolderOpen size={12} /> : <Folder size={12} />}
          </span>
          <span style={{
            fontSize: 12, color: "var(--text)", fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            flex: 1,
          }}>
            {node.name}
          </span>
          {!searchQuery && node.children && (
            <span style={{ fontSize: 9, color: "var(--text-subtle)", flexShrink: 0 }}>
              {node.children.length}
            </span>
          )}
        </button>

        {open && children?.length > 0 && (
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute",
              top: 4, bottom: 4, width: 1,
              background: "var(--border-muted)",
              left: `${indent + 17}px`,
            }} />
            {children.map((child, i) => (
              <TreeNode
                key={`${child.name}-${i}`}
                node={child}
                depth={depth + 1}
                onFileClick={onFileClick}
                selectedPath={selectedPath}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const color = extColor(node.name);
  const isSelected = selectedPath === node.fullPath;

  return (
    <button
      onClick={() => onFileClick?.(node.fullPath, node.name)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: `3px 8px 3px ${indent + 22}px`,
        borderRadius: 5,
        background: isSelected ? "var(--accent-bg)" : "none",
        border: isSelected ? "1px solid var(--accent-border)" : "1px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background var(--t-fast)",
      }}
      className={`tree-node-file${isSelected ? " selected" : ""}`}
    >
      <span style={{ color, flexShrink: 0 }}>
        <File size={10} />
      </span>
      <span style={{
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
        color: isSelected ? "var(--accent)" : "var(--text)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        flex: 1,
      }}>
        {node.name}
      </span>
    </button>
  );
}

export default function ProjectTree({ onFileClick, selectedPath, compact = false }) {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, projectStructure } = state;

  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    if (projectStructure) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRepoStructure(repoUrl);
      if (data.children) data.children.forEach((c) => attachPaths(c, ""));
      else attachPaths(data, "");
      dispatch({ type: "SET_PROJECT_STRUCTURE", data });
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (projectStructure) {
    if (projectStructure.children) projectStructure.children.forEach((c) => attachPaths(c, ""));
    else attachPaths(projectStructure, "");
  }

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "20px", justifyContent: "center",
        color: "var(--text-subtle)", fontSize: 12,
      }}>
        <span style={{
          width: 14, height: 14, border: "2px solid var(--border)",
          borderTopColor: "var(--accent)", borderRadius: "50%",
          display: "inline-block", animation: "spin 0.8s linear infinite",
        }} />
        Building tree…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontSize: 11, padding: 12, color: "var(--danger)" }}>
        {error}
        <button
          onClick={() => { setError(null); load(); }}
          style={{
            marginLeft: 8, textDecoration: "underline",
            background: "none", border: "none",
            color: "var(--danger)", cursor: "pointer", fontSize: 11,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!projectStructure) return null;

  const rootChildren = projectStructure.children || [projectStructure];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 6 }}>
      {/* Search */}
      <div style={{
        position: "relative",
        padding: "6px 8px 0",
        flexShrink: 0,
      }}>
        <Search
          size={11}
          style={{
            position: "absolute",
            left: 17, top: "50%", transform: "translateY(-20%)",
            color: "var(--text-subtle)", pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter files…"
          style={{
            width: "100%",
            background: "var(--bg-muted)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            paddingLeft: 26,
            paddingRight: searchQuery ? 26 : 8,
            paddingTop: 5, paddingBottom: 5,
            fontSize: 11,
            color: "var(--text)",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color var(--t-fast)",
          }}
          onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "var(--border)"; }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-20%)",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-subtle)", display: "flex",
            }}
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2px 4px" }}>
        {rootChildren.map((child, i) => (
          <TreeNode
            key={`${child.name}-${i}`}
            node={child}
            depth={0}
            onFileClick={onFileClick}
            selectedPath={selectedPath}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  );
}
