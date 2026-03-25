import { useState, useRef, useEffect } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import { chatWithRepo } from "../services/api";

export default function ChatBox({ prefillMessage }) {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, explainMode, chatHistory: messages } = state;

  const welcome = { role: "assistant", content: "Ask me anything about this repository — architecture, flows, specific files, or design decisions." };
  const display = messages.length === 0 ? [welcome] : messages;

  const [input,   setInput]   = useState(prefillMessage || "");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { if (prefillMessage) setInput(prefillMessage); }, [prefillMessage]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

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
      dispatch({ type: "APPEND_CHAT", message: {
        role: "assistant",
        content: `Error: ${err.response?.data?.detail || err.message}`,
      }});
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: 580,
      background: "#111827", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB" }}>Chat</p>
          <p style={{ fontSize: 11, color: "#4B5563", marginTop: 1 }}>RAG-powered · context from codebase</p>
        </div>
        {messages.length > 0 && (
          <span className="badge">{messages.length} messages</span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
        {display.map((msg, i) => (
          <div key={i} className="animate-fade-in" style={{
            display: "flex", gap: 10,
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-start",
          }}>
            {/* Avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600,
              background: msg.role === "user" ? "#7C3AED" : "rgba(255,255,255,0.05)",
              border: "1px solid " + (msg.role === "user" ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"),
              color: msg.role === "user" ? "#fff" : "#6B7280",
            }}>
              {msg.role === "user" ? "U" : "AI"}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: "78%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
              background: msg.role === "user" ? "#7C3AED" : "rgba(255,255,255,0.04)",
              border: "1px solid " + (msg.role === "user" ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"),
              fontSize: 13, color: msg.role === "user" ? "#fff" : "#D1D5DB",
              lineHeight: 1.65,
            }}>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>
              {msg.sources?.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>Sources</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {msg.sources.map((s) => (
                      <span key={s} style={{
                        fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                        padding: "2px 8px", borderRadius: 6,
                        background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)",
                        color: "#A78BFA",
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="animate-fade-in" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 11, color: "#6B7280",
            }}>AI</div>
            <div style={{
              padding: "12px 16px", borderRadius: "4px 12px 12px 12px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <Dots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 10, flexShrink: 0,
        background: "rgba(255,255,255,0.01)",
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about architecture, files, patterns…"
          rows={2}
          className="input"
          style={{ flex: 1, resize: "none", fontFamily: "inherit" }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-primary"
          style={{ alignSelf: "flex-end", padding: "9px 18px" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", height: 18 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%", background: "#4B5563",
          display: "inline-block",
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}
