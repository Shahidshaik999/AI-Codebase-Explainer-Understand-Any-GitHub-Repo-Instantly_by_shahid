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
  { id: "overview",  label: "Overview",      requiresResult: true },
  { id: "files",     label: "Files",         requiresResult: true },
  { id: "graph",     label: "Dep Graph",     requiresGraph: true  },
  { id: "chat",      label: "Chat",          requiresResult: true },
  { id: "whatif",    label: "What-If",       requiresRepo: true   },
  { id: "history",   label: "Time Machine",  requiresRepo: true   },
  { id: "flow",      label: "Flow",          requiresRepo: true   },
  { id: "sysdesign", label: "System Design", requiresRepo: true   },
];

const STEPS = [
  "Cloning repository",
  "Parsing source files",
  "Generating embeddings",
  "Running AI analysis",
  "Building insights",
];

export default function Home() {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, analysisData } = state;

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadStep, setLoadStep] = useState(0);
  const [chatPrefill, setChatPrefill] = useState("");

  const handleNavigateToChat = (msg) => {
    setChatPrefill(msg);
    setActiveTab("chat");
  };

  const handleAnalyze = async (url, mode, phase) => {
    dispatch({ type: "START_ANALYSIS", repoUrl: url, explainMode: mode });
    setLoading(true);
    setError(null);
    setActiveTab("overview");
    setLoadStep(0);

    const iv = setInterval(() =>
      setLoadStep((s) => Math.min(s + 1, STEPS.length - 1)), 7000);

    try {
      const data = await analyzeRepo(url, mode, phase);
      dispatch({ type: "SET_ANALYSIS_DATA", data });
      if (phase >= 3 && data.dependency_graph?.nodes?.length) setActiveTab("graph");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Analysis failed.");
    } finally {
      clearInterval(iv);
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
    <div className="min-h-screen" style={{ background: "#0B0F14" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(11,15,20,0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px",
                      height: 54, display: "flex", alignItems: "center", gap: 12 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, boxShadow: "0 0 12px rgba(124,58,237,0.4)",
            }}>✦</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#E5E7EB", letterSpacing: "-0.02em" }}>
              Codebase AI
            </span>
          </div>

          {/* Active repo pill */}
          {repoUrl && (
            <div style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, padding: "4px 12px",
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: "#10B981",
                display: "inline-block", boxShadow: "0 0 6px rgba(16,185,129,0.6)",
              }} />
              <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "JetBrains Mono, monospace",
                             maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {repoUrl.replace("https://github.com/", "")}
              </span>
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>

        {/* ── Hero / Input ── */}
        <div className="animate-slide-up" style={{
          textAlign: "center",
          paddingTop: analysisData ? 0 : 64,
          paddingBottom: analysisData ? 24 : 48,
          transition: "padding 0.4s ease",
        }}>
          {!analysisData && !loading && (
            <>
              <div style={{ marginBottom: 16 }}>
                <span className="ai-label">✦ AI-Powered</span>
              </div>
              <h1 style={{
                fontSize: 38, fontWeight: 700, color: "#F3F4F6",
                letterSpacing: "-0.04em", marginBottom: 12, lineHeight: 1.15,
              }}>
                Understand any GitHub repo
              </h1>
              <p style={{ fontSize: 15, color: "#6B7280", marginBottom: 40, maxWidth: 440, margin: "0 auto 40px" }}>
                Paste a URL. Get AI-powered architecture, chat, and insights in seconds.
              </p>
            </>
          )}
          <RepoInput onAnalyze={handleAnalyze} loading={loading} />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="animate-fade-in" style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 10,
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ color: "#EF4444", fontSize: 14 }}>⚠</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#EF4444" }}>Analysis failed</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{error}</p>
            </div>
          </div>
        )}

        {/* ── Step Loader ── */}
        {loading && (
          <div className="animate-fade-in card" style={{ marginTop: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {STEPS.map((step, i) => {
                  const done    = i < loadStep;
                  const current = i === loadStep;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Icon */}
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: done ? "#7C3AED" : current ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${done ? "#7C3AED" : current ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}`,
                        transition: "all 0.4s",
                      }}>
                        {done
                          ? <span style={{ fontSize: 11, color: "#fff" }}>✓</span>
                          : current
                            ? <span style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: "#7C3AED", display: "block",
                                animation: "pulse 1.2s ease-in-out infinite",
                              }} />
                            : <span style={{ width: 6, height: 6, borderRadius: "50%",
                                             background: "rgba(255,255,255,0.1)", display: "block" }} />
                        }
                      </div>
                      <span style={{
                        fontSize: 13,
                        color: done ? "#6B7280" : current ? "#E5E7EB" : "#374151",
                        fontWeight: current ? 500 : 400,
                        transition: "color 0.3s",
                      }}>
                        {step}
                        {current && <span style={{ color: "#7C3AED" }}>…</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Progress bar */}
              <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: "#7C3AED", borderRadius: 2,
                  width: `${((loadStep + 1) / STEPS.length) * 100}%`,
                  transition: "width 6s linear",
                }} />
              </div>
              <p style={{ fontSize: 12, color: "#4B5563" }}>This may take 30–90 seconds for large repos.</p>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        {visibleTabs.length > 0 && !loading && (
          <div className="animate-slide-up" style={{ marginTop: 28 }}>
            {/* Tab bar */}
            <div style={{
              display: "flex", gap: 24, alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              marginBottom: 24, overflowX: "auto",
            }}>
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-underline${activeTab === tab.id ? " active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
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
