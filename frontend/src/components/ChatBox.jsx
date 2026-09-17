import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, File, ChevronRight } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { chatWithRepo } from "../services/api";
import { AISparkIcon } from "./Logo";

const SUGGESTED = [
  "How does this application start?",
  "What are the main dependencies?",
  "How does data flow through the application?",
  "Which files should I read first?",
  "Where is error handling implemented?",
];

export default function ChatBox({ prefillMessage }) {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, explainMode, chatHistory: messages } = state;

  const welcome = {
    role: "assistant",
    content: "Ask me anything about this repository — architecture, flows, specific files, or design decisions.",
  };
  const display = messages.length === 0 ? [welcome] : messages;

  const [input,   setInput]   = useState(prefillMessage || "");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { if (prefillMessage) setInput(prefillMessage); }, [prefillMessage]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    dispatch({ type: "APPEND_CHAT", message: { role: "user", content: text } });
    setInput("");
    setLoading(true);
    try {
      const { answer, sources } = await chatWithRepo(repoUrl, text, messages, explainMode);
      dispatch({ type: "APPEND_CHAT", message: { role: "assistant", content: answer, sources } });
    } catch (err) {
      dispatch({
        type: "APPEND_CHAT",
        message: {
          role: "assistant",
          content: `Error: ${err.response?.data?.detail || err.message}`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const useSuggested = (q) => {
    setInput(q);
    inputRef.current?.focus();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "clamp(520px, calc(100vh - 220px), 720px)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
      className="animate-slide-up"
    >
      {/* ── Header ── */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        background: "var(--bg-card)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MessageSquare size={14} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              Ask your codebase
            </p>
            <p style={{ fontSize: 11, color: "var(--text-subtle)", margin: 0 }}>
              RAG-powered · answers grounded in your repository
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <span className="badge">{messages.length} messages</span>
        )}
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: "var(--bg-subtle)",
      }}>
        {/* Suggested prompts (shown when empty) */}
        {messages.length === 0 && (
          <div className="animate-fade-in" style={{ marginBottom: 4 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Suggested</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => useSuggested(q)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 7,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all var(--t-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-border)";
                    e.currentTarget.style.background = "var(--accent-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg-card)";
                  }}
                >
                  <ChevronRight size={11} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {display.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="animate-fade-in" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AIAvatar />
            <div style={{
              padding: "10px 14px",
              borderRadius: "4px 10px 10px 10px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}>
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        gap: 8,
        flexShrink: 0,
        background: "var(--bg-card)",
        alignItems: "flex-end",
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask anything about this repository…"
          rows={2}
          className="input"
          style={{ flex: 1, resize: "none", fontFamily: "inherit", fontSize: 13 }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-primary"
          style={{ alignSelf: "flex-end", padding: "8px 14px" }}
          aria-label="Send message"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Message bubble ── */
function ChatMessage({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        gap: 10,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
      }}
    >
      {isUser ? <UserAvatar /> : <AIAvatar />}

      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          padding: "10px 13px",
          borderRadius: isUser ? "10px 3px 10px 10px" : "3px 10px 10px 10px",
          background: isUser ? "var(--accent)" : "var(--bg-card)",
          border: isUser ? "none" : "1px solid var(--border)",
          fontSize: 13,
          color: isUser ? "#fff" : "var(--text)",
          lineHeight: 1.7,
          boxShadow: isUser ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>
        </div>

        {/* Sources */}
        {msg.sources?.length > 0 && !isUser && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 4 }}>
            <span style={{ fontSize: 10, color: "var(--text-subtle)", alignSelf: "center", marginRight: 2 }}>
              Sources:
            </span>
            {msg.sources.map((s) => (
              <span
                key={s}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                  padding: "2px 7px", borderRadius: 4,
                  background: "var(--bg-muted)", border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                <File size={8} />
                {s.split("/").slice(-2).join("/")}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AIAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <AISparkIcon size={13} color="var(--accent)" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: "var(--accent)", border: "1px solid var(--accent-hover)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 600, color: "#fff",
    }}>
      U
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", height: 18 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%",
          background: "var(--text-subtle)", display: "inline-block",
          animation: `pulse2 1.3s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}
