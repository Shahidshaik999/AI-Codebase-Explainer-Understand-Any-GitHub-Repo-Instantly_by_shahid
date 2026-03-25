import { useState, useEffect } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import { getRepoStructure } from "../services/api";

// ── File extension → color ────────────────────────────────────────────────────
const EXT_COLOR = {
  ".js":   "#fde047", ".jsx":  "#22d3ee", ".ts":   "#60a5fa", ".tsx":  "#67e8f9",
  ".py":   "#facc15", ".go":   "#2dd4bf", ".rs":   "#f97316", ".java": "#fb923c",
  ".css":  "#a78bfa", ".scss": "#c084fc", ".html": "#f87171", ".json": "#86efac",
  ".md":   "#94a3b8", ".yml":  "#fbbf24", ".yaml": "#fbbf24", ".env":  "#6ee7b7",
  ".sh":   "#34d399", ".toml": "#fb923c", ".lock": "#64748b", ".txt":  "#94a3b8",
};

function extColor(name) {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "#94a3b8";
  return EXT_COLOR[name.slice(dot).toLowerCase()] || "#94a3b8";
}

// ── Recursive tree node ───────────────────────────────────────────────────────
function TreeNode({ node, depth = 0, onFileClick, selectedPath, searchQuery }) {
  const [open, setOpen] = useState(depth < 2);
  const indent = depth * 14;

  // When searching, auto-expand folders that contain matches
  useEffect(() => {
    if (searchQuery && node.type === "folder") setOpen(true);
  }, [searchQuery]);

  if (node.type === "folder") {
    // Filter children when searching
    const children = searchQuery
      ? node.children?.filter((c) => nodeMatchesSearch(c, searchQuery))
      : node.children;

    if (searchQuery && !children?.length) return null;

    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-1.5 px-2 py-[3px] rounded-lg
                     hover:bg-white/[0.05] transition-colors duration-150 group text-left"
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          <span className="text-white/30 text-[10px] w-3 shrink-0 transition-transform duration-150"
                style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
          <span className="text-sm shrink-0">{open ? "📂" : "📁"}</span>
          <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors font-medium truncate">
            {node.name}
          </span>
          {!searchQuery && node.children && (
            <span className="ml-auto text-[10px] text-white/20 shrink-0 pr-1">
              {node.children.length}
            </span>
          )}
        </button>

        {open && children?.length > 0 && (
          <div className="relative">
            <div className="absolute top-0 bottom-0 w-px bg-white/[0.05]"
                 style={{ left: `${indent + 16}px` }} />
            {children.map((child, i) => (
              <TreeNode key={`${child.name}-${i}`} node={child} depth={depth + 1}
                onFileClick={onFileClick} selectedPath={selectedPath}
                searchQuery={searchQuery} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const color = extColor(node.name);
  const isSelected = selectedPath === node.fullPath;

  return (
    <button
      onClick={() => onFileClick?.(node.fullPath, node.name)}
      className="w-full flex items-center gap-1.5 px-2 py-[3px] rounded-lg transition-all duration-150 group text-left border"
      style={{
        paddingLeft: `${indent + 22}px`,
        background: isSelected ? "rgba(124,58,237,0.08)" : "transparent",
        borderColor: isSelected ? "rgba(124,58,237,0.25)" : "transparent",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      <span className="text-[11px] shrink-0" style={{ color }}>●</span>
      <span className="text-xs font-mono transition-colors truncate"
            style={{ color: isSelected ? "#C4B5FD" : "rgba(255,255,255,0.55)" }}>
        {node.name}
      </span>
    </button>
  );
}

// Check if a node or any of its descendants match the search query
function nodeMatchesSearch(node, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  if (node.name.toLowerCase().includes(lower)) return true;
  if (node.type === "folder" && node.children) {
    return node.children.some((c) => nodeMatchesSearch(c, q));
  }
  return false;
}

// Attach full paths to all nodes (mutates in place, called once on load)
function attachPaths(node, parentPath = "") {
  const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
  node.fullPath = fullPath;
  if (node.type === "folder" && node.children) {
    node.children.forEach((c) => attachPaths(c, fullPath));
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectTree({ onFileClick, selectedPath, compact = false }) {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, projectStructure } = state;

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    if (projectStructure) return;
    setLoading(true); setError(null);
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

  // Always re-attach paths in case tree was restored from localStorage
  // (attachPaths is idempotent — safe to call every render)
  if (projectStructure) {
    if (projectStructure.children) {
      projectStructure.children.forEach((c) => attachPaths(c, ""));
    } else {
      attachPaths(projectStructure, "");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-6 justify-center text-white/40 text-sm">
        <span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        Building tree…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs p-3" style={{ color: "#EF4444" }}>
        {error}
        <button onClick={() => { setError(null); load(); }}
          className="ml-2 underline opacity-70 hover:opacity-100">Retry</button>
      </div>
    );
  }

  if (!projectStructure) return null;

  // Count stats
  let fileCount = 0, folderCount = 0;
  const countNodes = (node) => {
    if (node.type === "file") fileCount++;
    else { folderCount++; node.children?.forEach(countNodes); }
  };
  countNodes(projectStructure);

  const rootChildren = projectStructure.children || [projectStructure];

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files…"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                     pl-8 pr-3 py-2 text-xs text-white/70 placeholder-white/25
                     focus:outline-none transition-colors"
          style={{ outline: "none" }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.18)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30
                       hover:text-white/60 transition-colors text-xs">✕</button>
        )}
      </div>

      {/* Stats row */}
      {!compact && (
        <div className="flex gap-2 text-[10px] text-white/25">
          <span>📁 {folderCount}</span>
          <span>📄 {fileCount}</span>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto
                      scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 pr-1">
        {rootChildren.map((child, i) => (
          <TreeNode key={`${child.name}-${i}`} node={child} depth={0}
            onFileClick={onFileClick} selectedPath={selectedPath}
            searchQuery={searchQuery} />
        ))}
      </div>
    </div>
  );
}
