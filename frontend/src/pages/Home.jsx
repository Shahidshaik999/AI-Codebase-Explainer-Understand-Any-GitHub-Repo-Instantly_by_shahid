import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Files, GitBranch, MessageSquare,
  Zap, History, Network, Cpu, Sun, Moon,
  GitFork, RefreshCw, ChevronRight,
} from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { LogoHorizontal } from "../components/Logo";
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

const NAV = [
  { id: "overview",  label: "Overview",     icon: LayoutDashboard, requiresResult: true },
  { id: "files",     label: "Code",         icon: Files,           requiresResult: true },
  { id: "graph",     label: "Graph",        icon: Network,         requiresGraph:  true },
  { id: "chat",      label: "Ask AI",       icon: MessageSquare,   requiresResult: true },
  { id: "whatif",    label: "Impact",       icon: Zap,             requiresRepo:   true },
  { id: "history",   label: "History",      icon: History,         requiresRepo:   true },
  { id: "flow",      label: "Flow",         icon: GitBranch,       requiresRepo:   true },
  { id: "sysdesign", label: "Architecture", icon: Cpu,             requiresRepo:   true },
];

const STEPS = [
  "Connecting to repository",
  "Parsing source files",
  "Generating embeddings",
  "Running AI analysis",
  "Building insights",
];

const CAPABILITIES = [
  { label: "AI Analysis",    desc: "Project summary & insights"     },
  { label: "Architecture",   desc: "System design generation"       },
  { label: "Code Intel",     desc: "File explorer with AI explain"  },
  { label: "RAG Chat",       desc: "Ask anything about the repo"    },
  { label: "Impact Lab",     desc: "What-if impact analysis"        },
  { label: "Git History",    desc: "AI-explained commit timeline"   },
];

export default function Home({ dark, setDark }) {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, analysisData } = state;

  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [loadStep,    setLoadStep]    = useState(0);
  const [chatPrefill, setChatPrefill] = useState("");
  const headerRef = useRef(null);

  // Add shadow to header on scroll
  useEffect(() => {
    const onScroll = () => {
      if (headerRef.current) {
        headerRef.current.classList.toggle("scrolled", window.scrollY > 4);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const visibleTabs = NAV.filter((t) => {
    if (t.requiresGraph)  return !!analysisData?.dependency_graph?.nodes?.length;
    if (t.requiresResult) return !!analysisData;
    if (t.requiresRepo)   return !!repoUrl;
    return false;
  });

  // Parse repo display name from URL
  const repoDisplay = repoUrl
    ? repoUrl.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "")
    : "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ─────────── STICKY HEADER ─────────── */}
      <header
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          height: "var(--header-h)",
          background: "var(--header-bg)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          transition: "box-shadow var(--t-base)",
        }}
      >
        <div style={{
          maxWidth: 1260,
          margin: "0 auto",
          padding: "0 20px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          {/* Logo */}
          <LogoHorizontal />

          {/* Nav tabs — only shown when there's a repo / analysis */}
          {visibleTabs.length > 0 && !loading && (
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                marginLeft: 16,
                overflowX: "auto",
                flexShrink: 1,
              }}
              aria-label="Main navigation"
            >
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`nav-link${isActive ? " active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}>

            {/* Repo status pill */}
            {repoDisplay && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 6,
                background: "var(--bg-muted)",
                border: "1px solid var(--border)",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: loading ? "#F79009" : "#12B76A",
                  display: "inline-block",
                  animation: loading ? "pulse2 1.2s ease-in-out infinite" : "none",
                  flexShrink: 0,
                }} />
                <GitFork size={11} style={{ color: "var(--text-subtle)", flexShrink: 0 }} />
                <span style={{
                  fontSize: 11,
                  fontFamily: "JetBrains Mono, monospace",
                  color: "var(--text-muted)",
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {repoDisplay}
                </span>
                {analysisData && (
                  <span style={{ fontSize: 10, color: "var(--text-subtle)", flexShrink: 0 }}>
                    · {analysisData.total_files_analyzed} files
                  </span>
                )}
              </div>
            )}

            {/* Theme toggle */}
            <button
              className="btn-icon"
              onClick={() => setDark((d) => !d)}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark
                ? <Sun size={14} />
                : <Moon size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* ─────────── MAIN ─────────── */}
      <main style={{ maxWidth: 1260, margin: "0 auto", padding: "0 20px 48px" }}>

        {/* ── HERO / INPUT SECTION ── */}
        {!analysisData && !loading && (
          <section
            className="animate-fade-in"
            style={{
              paddingTop: 72,
              paddingBottom: 56,
              textAlign: "center",
            }}
          >
            {/* Eyebrow */}
            <div style={{ marginBottom: 20 }}>
              <span className="ai-label">AI Code Intelligence</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 44,
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              Understand any codebase.
              <br />
              <span style={{
                background: "linear-gradient(135deg, #5B4BFF 0%, #818CF8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Instantly.
              </span>
            </h1>

            <p style={{
              fontSize: 16,
              color: "var(--text-muted)",
              maxWidth: 460,
              margin: "0 auto 40px",
              lineHeight: 1.65,
              letterSpacing: "-0.01em",
            }}>
              Paste a public GitHub repository and get an AI-powered architectural
              breakdown in seconds.
            </p>

            {/* Input */}
            <div style={{ maxWidth: 620, margin: "0 auto 32px" }}>
              <RepoInput onAnalyze={handleAnalyze} loading={loading} />
            </div>

            {/* Capability pills */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
              maxWidth: 600,
              margin: "0 auto",
            }}>
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.label}
                  title={cap.desc}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 99,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontWeight: 500,
                    cursor: "default",
                    transition: "border-color var(--t-fast), color var(--t-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-border)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "var(--accent)", display: "inline-block", flexShrink: 0,
                  }} />
                  {cap.label}
                </div>
              ))}
            </div>

            {/* Hero visualization */}
            <HeroViz />
          </section>
        )}

        {/* ── COMPACT INPUT WHEN ANALYZED ── */}
        {(analysisData || loading) && (
          <div style={{
            paddingTop: 20,
            paddingBottom: 16,
          }}>
            <RepoInput onAnalyze={handleAnalyze} loading={loading} compact />
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div
            className="animate-slide-up"
            style={{
              margin: "0 0 16px",
              padding: "14px 16px",
              borderRadius: 9,
              background: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              background: "var(--danger)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>!</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", margin: "0 0 3px" }}>
                Unable to analyze repository
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                {error}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: "6px 0 0" }}>
                Possible causes: repository is private, URL is invalid, or the service is temporarily unavailable.
              </p>
            </div>
            <button
              className="btn-ghost"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              style={{ flexShrink: 0, padding: "4px 8px" }}
            >
              <RefreshCw size={12} />
              Try again
            </button>
          </div>
        )}

        {/* ── LOADING STEPPER ── */}
        {loading && (
          <div
            className="animate-slide-up"
            style={{
              margin: "8px auto 0",
              maxWidth: 460,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "24px 28px",
            }}
          >
            <p style={{
              fontSize: 13, fontWeight: 600, color: "var(--text)",
              marginBottom: 20, letterSpacing: "-0.01em",
            }}>
              Analyzing repository
              <span style={{ animation: "blink 1s step-end infinite" }}>…</span>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {STEPS.map((step, i) => {
                const done    = i < loadStep;
                const current = i === loadStep;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Step indicator */}
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      flexShrink: 0, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      transition: "all 0.3s ease",
                      background: done ? "var(--accent)" : current ? "var(--accent-bg)" : "var(--bg-muted)",
                      border: `1.5px solid ${done ? "var(--accent)" : current ? "var(--accent-border)" : "var(--border)"}`,
                    }}>
                      {done ? (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : current ? (
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "var(--accent)", display: "block",
                          animation: "pulse2 1.2s ease-in-out infinite",
                        }} />
                      ) : (
                        <span style={{
                          width: 4, height: 4, borderRadius: "50%",
                          background: "var(--border-strong)", display: "block",
                        }} />
                      )}
                    </div>
                    {/* Step label */}
                    <span style={{
                      fontSize: 13,
                      fontWeight: current ? 500 : 400,
                      color: done ? "var(--text-subtle)" : current ? "var(--text)" : "var(--border-strong)",
                      transition: "color 0.3s",
                      flex: 1,
                    }}>
                      {step}
                    </span>
                    {current && (
                      <span style={{
                        width: 14, height: 14, border: "2px solid var(--border)",
                        borderTopColor: "var(--accent)",
                        borderRadius: "50%", display: "inline-block",
                        animation: "spin 0.7s linear infinite", flexShrink: 0,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div style={{
              height: 2, background: "var(--bg-muted)",
              borderRadius: 2, overflow: "hidden", marginTop: 20,
            }}>
              <div style={{
                height: "100%", background: "var(--accent)", borderRadius: 2,
                width: `${((loadStep + 1) / STEPS.length) * 100}%`,
                transition: "width 6s linear",
              }} />
            </div>

            <p style={{
              fontSize: 11, color: "var(--text-subtle)",
              marginTop: 12, textAlign: "center",
            }}>
              This may take 30–90 seconds for large repositories
            </p>
          </div>
        )}

        {/* ── TAB CONTENT ── */}
        {visibleTabs.length > 0 && !loading && (
          <div className="animate-slide-up">
            {/* Tab bar */}
            <div style={{
              display: "flex",
              gap: 4,
              alignItems: "center",
              borderBottom: "1px solid var(--border)",
              marginBottom: 24,
              overflowX: "auto",
              paddingBottom: 0,
            }}>
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-underline${isActive ? " active" : ""}`}
                    style={{ gap: 6 }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={12} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Panel */}
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

/* ─────────────────────────────────────────────────────────────────────────────
   HERO VISUALIZATION — pure SVG/CSS, no external images
   ───────────────────────────────────────────────────────────────────────────── */
function HeroViz() {
  const nodes = [
    { x: 180, y: 60,  label: "Repository",   color: "#5B4BFF", r: 28, icon: "repo"  },
    { x: 180, y: 170, label: "AI Analysis",  color: "#818CF8", r: 22, icon: "ai"    },
    { x: 60,  y: 270, label: "Code Intel",   color: "#6D5DFB", r: 18, icon: "code"  },
    { x: 180, y: 270, label: "Architecture", color: "#6D5DFB", r: 18, icon: "arch"  },
    { x: 300, y: 270, label: "RAG Chat",     color: "#6D5DFB", r: 18, icon: "chat"  },
  ];

  const edges = [
    { x1: 180, y1: 88,  x2: 180, y2: 148 },
    { x1: 169, y1: 191, x2: 70,  y2: 252 },
    { x1: 180, y1: 192, x2: 180, y2: 252 },
    { x1: 191, y1: 191, x2: 290, y2: 252 },
  ];

  return (
    <div style={{
      marginTop: 56,
      display: "flex",
      justifyContent: "center",
      opacity: 0.85,
    }}>
      <svg
        width={360}
        height={340}
        viewBox="0 0 360 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        {/* Dot grid background */}
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.15" />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </radialGradient>
          <mask id="dot-mask">
            <rect width="360" height="340" fill="white" />
            <rect width="360" height="340" fill="url(#fade)" />
          </mask>
        </defs>
        <rect
          width="360" height="340"
          fill="url(#dots)"
          style={{ color: "var(--text-subtle)" }}
          mask="url(#dot-mask)"
        />

        {/* Edges */}
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            strokeDasharray="4 4"
          />
        ))}

        {/* Animated flow dots on edges */}
        {edges.map((e, i) => (
          <circle key={`dot-${i}`} r="2.5" fill="var(--accent)" opacity="0.7">
            <animateMotion
              dur={`${1.8 + i * 0.4}s`}
              repeatCount="indefinite"
              path={`M${e.x1},${e.y1} L${e.x2},${e.y2}`}
            />
          </circle>
        ))}

        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={i} style={{ animation: `float ${2.5 + i * 0.3}s ease-in-out ${i * 0.2}s infinite` }}>
            {/* Glow ring */}
            <circle
              cx={n.x} cy={n.y} r={n.r + 8}
              fill={n.color}
              fillOpacity="0.06"
            />
            {/* Node body */}
            <circle
              cx={n.x} cy={n.y} r={n.r}
              fill="var(--bg-card)"
              stroke={n.color}
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            {/* Label */}
            <text
              x={n.x} y={n.y + n.r + 14}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="10"
              fontFamily="Inter, sans-serif"
              fontWeight="500"
            >
              {n.label}
            </text>

            {/* Icons inside nodes */}
            {n.icon === "repo" && (
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="18" fill={n.color}>⌥</text>
            )}
            {n.icon === "ai" && (
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14" fill={n.color}>✦</text>
            )}
            {n.icon === "code" && (
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="12" fill={n.color}>{"{}"}</text>
            )}
            {n.icon === "arch" && (
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="12" fill={n.color}>⬡</text>
            )}
            {n.icon === "chat" && (
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="12" fill={n.color}>⬭</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
