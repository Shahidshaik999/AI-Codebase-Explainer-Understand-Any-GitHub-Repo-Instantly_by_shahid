import { useState } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import RepoInput from "../components/RepoInput";
import SummaryCard from "../components/SummaryCard";
import FileList from "../components/FileList";
import GraphView from "../components/GraphView";
import ChatBox from "../components/ChatBox";
import WhatIfPanel from "../components/WhatIfPanel";
import HistoryTimeline from "../components/HistoryTimeline";
import FlowGraph from "../components/FlowGraph";
import SystemDesign from "../components/SystemDesign";
import { analyzeRepo } from "../services/api";

const TABS = [
  { id: "overview",  label: "Overview",      emoji: "📋", requiresResult: true },
  { id: "files",     label: "Files",         emoji: "📁", requiresResult: true },
  { id: "graph",     label: "Dep Graph",     emoji: "🕸️", requiresGraph: true  },
  { id: "chat",      label: "Chat",          emoji: "💬", requiresResult: true },
  { id: "whatif",    label: "What-If Lab",   emoji: "⚡", requiresRepo: true   },
  { id: "history",   label: "Time Machine",  emoji: "🕰️", requiresRepo: true   },
  { id: "flow",      label: "Flow",          emoji: "🔀", requiresRepo: true   },
  { id: "sysdesign", label: "System Design", emoji: "🏗️", requiresRepo: true   },
];

const LOADING_STEPS = [
  { label: "Cloning repository…",   icon: "📦" },
  { label: "Reading source files…", icon: "📂" },
  { label: "Chunking code…",        icon: "✂️"  },
  { label: "Running AI analysis…",  icon: "🤖" },
  { label: "Generating insights…",  icon: "✨" },
];

export default function Home() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, analysisData } = state;

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadStep, setLoadStep]   = useState(0);
  const [chatPrefill, setChatPrefill] = useState("");

  const handleNavigateToChat = (message) => {
    setChatPrefill(message);
    setActiveTab("chat");
  };

  const handleAnalyze = async (url, mode, phase) => {
    // Reset everything for the new repo
    dispatch({ type: "START_ANALYSIS", repoUrl: url, explainMode: mode });
    setLoading(true);
    setError(null);
    setActiveTab("overview");
    setLoadStep(0);

    const interval = setInterval(() =>
      setLoadStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 7000);

    try {
      const data = await analyzeRepo(url, mode, phase);
      dispatch({ type: "SET_ANALYSIS_DATA", data });
      if (phase >= 3 && data.dependency_graph?.nodes?.length) setActiveTab("graph");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Analysis failed.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const visibleTabs = TABS.filter((t) => {
    if (t.requiresGraph)  return !!analysisData?.dependency_graph?.nodes?.length;
    if (t.requiresResult) return !!analysisData;
    if (t.requiresRepo)   return !!repoUrl;
    return false;
  });

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple
                          flex items-center justify-center text-sm
                          shadow-[0_0_16px_rgba(59,130,246,0.4)] animate-glow">
            🔍
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none tracking-tight">
              AI Codebase Explainer
            </h1>
            <p className="text-xs text-white/40 mt-0.5">Understand any GitHub repo instantly</p>
          </div>
          {repoUrl && (
            <div className="ml-auto hidden md:flex items-center gap-2 bg-white/[0.04]
                            border border-white/[0.08] rounded-lg px-3 py-1.5
                            hover:border-white/[0.14] transition-all duration-200">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span className="text-xs text-white/50 font-mono truncate max-w-xs">
                {repoUrl.replace("https://github.com/", "")}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="animate-slide-up">
          <RepoInput onAnalyze={handleAnalyze} loading={loading} currentUrl={repoUrl} />
        </div>

        {/* Error */}
        {error && (
          <div className="card border-accent-red/25 bg-accent-red/5 flex items-start gap-3 animate-slide-up">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-accent-red">Analysis failed</p>
              <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card animate-slide-up space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-10 h-10 shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-accent-blue/15" />
                <div className="absolute inset-0 rounded-full border-2 border-t-accent-blue border-r-accent-purple animate-spin" />
                <div className="absolute inset-1 rounded-full border border-accent-purple/20 animate-spin"
                     style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white animate-shimmer">
                  {LOADING_STEPS[loadStep].icon} {LOADING_STEPS[loadStep].label}
                </p>
                <div className="mt-2.5 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full
                               transition-all duration-[6s] ease-linear shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{ width: `${((loadStep + 1) / LOADING_STEPS.length) * 100}%` }}
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {LOADING_STEPS.map((_, i) => (
                    <div key={i}
                      className={`h-0.5 flex-1 rounded-full transition-all duration-500
                        ${i <= loadStep ? "bg-accent-blue" : "bg-white/[0.06]"}`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-white/30">This may take 30–90 seconds for large repos.</p>
          </div>
        )}

        {/* Tabs */}
        {visibleTabs.length > 0 && !loading && (
          <div className="animate-slide-up space-y-6">
            <div className="flex gap-1 flex-wrap p-1 bg-white/[0.03] border border-white/[0.06]
                            rounded-2xl w-fit shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? "tab-pill-active" : "tab-pill-inactive"}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="animate-fade-in" key={activeTab}>
              {activeTab === "overview"  && <SummaryCard />}
              {activeTab === "files"     && <FileList onNavigateToChat={handleNavigateToChat} />}
              {activeTab === "graph"     && <GraphView />}
              {activeTab === "chat"      && <ChatBox prefillMessage={chatPrefill} />}
              {activeTab === "whatif"    && <WhatIfPanel />}
              {activeTab === "history"   && <HistoryTimeline />}
              {activeTab === "flow"      && <FlowGraph />}
              {activeTab === "sysdesign" && <SystemDesign />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
