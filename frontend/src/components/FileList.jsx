import { useState } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import { getFileContent } from "../services/api";
import ProjectTree from "./ProjectTree";
import FilePreview from "./FilePreview";

const LANG_META = {
  Python:      { color: "#facc15", short: "PY" },
  JavaScript:  { color: "#fde047", short: "JS" },
  TypeScript:  { color: "#60a5fa", short: "TS" },
  "React/JSX": { color: "#22d3ee", short: "RX" },
  "React/TSX": { color: "#67e8f9", short: "TX" },
  Java:        { color: "#fb923c", short: "JV" },
  Go:          { color: "#2dd4bf", short: "GO" },
  Rust:        { color: "#f97316", short: "RS" },
  default:     { color: "#94a3b8", short: "??" },
};

export default function FileList({ onNavigateToChat }) {
  const { state, dispatch } = useAnalysis();
  const { analysisData, repoUrl, explainMode, selectedFile, fileCache } = state;
  const importantFiles  = analysisData?.important_files;
  const folderSummaries = analysisData?.folder_summaries;
  const [explorerTab, setExplorerTab] = useState("important");
  const [loadingPath, setLoadingPath] = useState(null);

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

  return (
    <div className="animate-slide-up flex gap-4 h-[620px]">
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="flex gap-1 bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.06]">
          {importantFiles?.length > 0 && (
            <button onClick={() => setExplorerTab("important")}
              className={explorerTab === "important" ? "tab-pill-active text-[10px] flex-1" : "tab-pill-inactive text-[10px] flex-1"}>
              Key Files
            </button>
          )}
          {folderSummaries?.length > 0 && (
            <button onClick={() => setExplorerTab("folders")}
              className={explorerTab === "folders" ? "tab-pill-active text-[10px] flex-1" : "tab-pill-inactive text-[10px] flex-1"}>
              Folders
            </button>
          )}
          <button onClick={() => setExplorerTab("tree")}
            className={explorerTab === "tree" ? "tab-pill-active text-[10px] flex-1" : "tab-pill-inactive text-[10px] flex-1"}>
            Tree
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-2">
          {explorerTab === "important" && importantFiles?.length > 0 && (
            <ul className="space-y-0.5 overflow-y-auto h-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {importantFiles.map((file) => {
                const meta = LANG_META[file.language] || LANG_META.default;
                const isSelected = selectedPath === file.path;
                return (
                  <li key={file.path}>
                    <button onClick={() => handleFileClick(file.path)}
                      className={["w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all duration-150 group",
                        isSelected ? "bg-accent-blue/10 border border-accent-blue/20" : "hover:bg-white/[0.04] border border-transparent"].join(" ")}>
                      <span className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold font-mono"
                        style={{ background: meta.color + "18", color: meta.color, border: "1px solid " + meta.color + "30" }}>
                        {meta.short}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={["text-xs font-mono truncate transition-colors",
                          isSelected ? "text-accent-blue" : "text-white/70 group-hover:text-white/90"].join(" ")}>
                          {file.path.split("/").pop()}
                        </p>
                        <p className="text-[10px] text-white/30 truncate">{file.reason}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {explorerTab === "folders" && folderSummaries?.length > 0 && (
            <ul className="space-y-1 overflow-y-auto h-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {folderSummaries.map((folder) => (
                <li key={folder.path}
                  className="flex gap-3 p-2.5 rounded-xl border border-white/[0.06] hover:border-accent-blue/20 transition-all duration-150">
                  <div className="w-px bg-gradient-to-b from-accent-blue to-accent-purple rounded-full shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-accent-blue font-medium truncate">{folder.path}/</p>
                    <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed line-clamp-2">{folder.summary}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">{folder.file_count} files</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {explorerTab === "tree" && (
            <ProjectTree onFileClick={handleFileClick} selectedPath={selectedPath} compact />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 border border-white/[0.06] rounded-2xl overflow-hidden bg-[#0d1117]">
        <FilePreview loadingPath={loadingPath} onAskAboutFile={handleAskAboutFile} />
      </div>
    </div>
  );
}
