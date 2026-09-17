import { useState } from "react";
import { Star, Folder, LayoutGrid } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { getFileContent } from "../services/api";
import ProjectTree from "./ProjectTree";
import FilePreview from "./FilePreview";

const LANG_META = {
  Python:      { color: "#D97706", short: "PY" },
  JavaScript:  { color: "#CA8A04", short: "JS" },
  TypeScript:  { color: "#2563EB", short: "TS" },
  "React/JSX": { color: "#0891B2", short: "RX" },
  "React/TSX": { color: "#0891B2", short: "TX" },
  Java:        { color: "#EA580C", short: "JV" },
  Go:          { color: "#0D9488", short: "GO" },
  Rust:        { color: "#C2410C", short: "RS" },
  default:     { color: "#6B7280", short: "??" },
};

const SIDEBAR_TABS = [
  { id: "important", label: "Key Files", icon: Star    },
  { id: "folders",   label: "Folders",   icon: Folder  },
  { id: "tree",      label: "Explorer",  icon: LayoutGrid },
];

export default function FileList({ onNavigateToChat }) {
  const { state, dispatch } = useAnalysis();
  const { analysisData, repoUrl, explainMode, selectedFile, fileCache } = state;
  const importantFiles  = analysisData?.important_files;
  const folderSummaries = analysisData?.folder_summaries;

  const [explorerTab,  setExplorerTab]  = useState("important");
  const [loadingPath,  setLoadingPath]  = useState(null);

  const handleFileClick = async (filePath) => {
    if (!filePath) return;
    if (fileCache?.[filePath]) {
      dispatch({ type: "SET_SELECTED_FILE", data: fileCache[filePath] });
      return;
    }
    setLoadingPath(filePath);
    dispatch({ type: "SET_SELECTED_FILE", data: null });
    try {
      const data = await getFileContent(repoUrl, filePath, explainMode);
      dispatch({ type: "CACHE_FILE", path: filePath, data });
      dispatch({ type: "SET_SELECTED_FILE", data });
    } catch (err) {
      console.error("File load error:", err);
    } finally {
      setLoadingPath(null);
    }
  };

  const handleAskAboutFile = (filePath) => {
    if (onNavigateToChat) onNavigateToChat(`Explain this file in detail: ${filePath}`);
  };

  const selectedPath = selectedFile?.file_path;

  // Determine which tabs are available
  const availableTabs = SIDEBAR_TABS.filter((t) => {
    if (t.id === "important") return importantFiles?.length > 0;
    if (t.id === "folders")   return folderSummaries?.length > 0;
    return true;
  });

  // Fallback to tree if current tab not available
  const activeTab = availableTabs.find((t) => t.id === explorerTab)
    ? explorerTab
    : availableTabs[0]?.id || "tree";

  return (
    <div
      className="animate-slide-up"
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 0,
        height: "clamp(520px, calc(100vh - 220px), 760px)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* ─────── LEFT: Explorer Panel ─────── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border)",
        background: "var(--bg-subtle)",
        overflow: "hidden",
      }}>
        {/* Panel header */}
        <div style={{
          padding: "10px 12px 6px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <p className="section-label" style={{ marginBottom: 8 }}>Project</p>
          {/* Sidebar sub-tabs */}
          {availableTabs.length > 1 && (
            <div style={{
              display: "flex",
              background: "var(--bg-muted)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 2,
              gap: 1,
            }}>
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setExplorerTab(tab.id)}
                    title={tab.label}
                    style={{
                      flex: 1, display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 4,
                      padding: "3px 6px", borderRadius: 4, fontSize: 10, fontWeight: 500,
                      border: "none", cursor: "pointer", transition: "all var(--t-fast)",
                      background: isActive ? "var(--accent)" : "transparent",
                      color: isActive ? "#fff" : "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Icon size={9} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflow: "hidden" }}>

          {/* Key Files */}
          {activeTab === "important" && importantFiles?.length > 0 && (
            <ul style={{
              listStyle: "none", margin: 0, padding: "4px 4px",
              overflowY: "auto", height: "100%",
            }}>
              {importantFiles.map((file) => {
                const meta = LANG_META[file.language] || LANG_META.default;
                const isSelected = selectedPath === file.path;
                return (
                  <li key={file.path}>
                    <button
                      onClick={() => handleFileClick(file.path)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 7,
                        padding: "6px 8px", borderRadius: 6, textAlign: "left",
                        cursor: "pointer", transition: "all var(--t-fast)",
                        background: isSelected ? "var(--accent-bg)" : "transparent",
                        border: isSelected ? "1px solid var(--accent-border)" : "1px solid transparent",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-muted)"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{
                        flexShrink: 0, width: 22, height: 22, borderRadius: 5,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 700,
                        background: meta.color + "15",
                        color: meta.color,
                        border: "1px solid " + meta.color + "25",
                      }}>
                        {meta.short}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                          color: isSelected ? "var(--accent)" : "var(--text)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          margin: "0 0 1px",
                        }}>
                          {file.path.split("/").pop()}
                        </p>
                        <p style={{
                          fontSize: 10, color: "var(--text-subtle)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          margin: 0, lineHeight: 1.4,
                        }}>
                          {file.reason}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Folders */}
          {activeTab === "folders" && folderSummaries?.length > 0 && (
            <ul style={{
              listStyle: "none", margin: 0, padding: "4px 4px",
              overflowY: "auto", height: "100%",
              display: "flex", flexDirection: "column", gap: 2,
            }}>
              {folderSummaries.map((folder) => (
                <li key={folder.path} style={{
                  display: "flex", gap: 8, padding: "8px 8px", borderRadius: 7,
                  border: "1px solid transparent",
                  transition: "all var(--t-fast)", cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-muted)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}>
                  <div style={{
                    width: 2, background: "var(--accent)",
                    borderRadius: 99, flexShrink: 0, opacity: 0.4,
                  }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{
                      fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                      color: "var(--text)", fontWeight: 500, margin: "0 0 2px",
                    }}>
                      {folder.path}/
                    </p>
                    <p style={{
                      fontSize: 10, color: "var(--text-muted)", lineHeight: 1.4,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      margin: 0,
                    }}>
                      {folder.summary}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--text-subtle)", margin: "2px 0 0" }}>
                      {folder.file_count} files
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Tree explorer */}
          {activeTab === "tree" && (
            <div style={{ height: "100%", padding: 0, overflow: "hidden" }}>
              <ProjectTree
                onFileClick={handleFileClick}
                selectedPath={selectedPath}
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* ─────── RIGHT: Code Viewer ─────── */}
      <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <FilePreview loadingPath={loadingPath} onAskAboutFile={handleAskAboutFile} />
      </div>
    </div>
  );
}
