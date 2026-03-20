import { useState, useRef, useEffect } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import { chatWithRepo } from "../services/api";

export default function ChatBox({ prefillMessage }) {
  const { state, dispatch } = useAnalysis();
  const { repoUrl, explainMode, chatHistory: messages } = state;

  // Seed the welcome message only if history is empty
  const displayMessages = messages.length === 0
    ? [{ role: "assistant", content: "Ask me anything about this repository — architecture, flows, specific files, or design decisions." }]
    : messages;

  const [input, setInput]     = useState(prefillMessage || "");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // When prefillMessage changes (e.g. from "Ask about this file"), update input
  useEffect(() => {
    if (prefillMessage) setInput(prefillMessage);
  }, [prefillMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    dispatch({ type: "APPEND_CHAT", message: userMsg });
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

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="card flex flex-col animate-slide-up" style={{ height: 560 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06] shrink-0">
        <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-base">💬</div>
        <div>
          <h3 className="text-sm font-bold text-white">Chat with Repository</h3>
          <p className="text-xs text-white/35 mt-0.5">RAG-powered · history persists across tab switches</p>
        </div>
        {messages.length > 0 && (
          <span className="ml-auto badge">{messages.length} messages</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 mb-4">
        {displayMessages.map((msg, i) => (
          <div key={i}
            className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            style={{ animationDelay: `${Math.min(i, 5) * 30}ms` }}>
            <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold
              ${msg.role === "user"
                ? "bg-gradient-to-br from-accent-blue to-accent-purple text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                : "bg-white/[0.06] text-white/50 border border-white/[0.08]"}`}>
              {msg.role === "user" ? "U" : "AI"}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-200 hover:scale-[1.01]
              ${msg.role === "user"
                ? "bg-gradient-to-br from-accent-blue to-accent-purple text-white rounded-tr-sm shadow-[0_4px_16px_rgba(59,130,246,0.25)]"
                : "bg-white/[0.04] border border-white/[0.08] text-white/80 rounded-tl-sm hover:border-white/[0.14]"}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.sources?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.12]">
                  <p className="text-xs text-white/40 mb-1.5">Sources:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((s) => (
                      <span key={s} className="text-xs font-mono text-accent-blue bg-accent-blue/10
                                               border border-accent-blue/20 px-2 py-0.5 rounded-md
                                               hover:bg-accent-blue/15 transition-colors duration-150">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs text-white/50">AI</div>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 shrink-0 pt-4 border-t border-white/[0.06]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about authentication, data flow, architecture…"
          rows={2}
          className="input flex-1 resize-none font-sans"
        />
        <button onClick={send} disabled={loading || !input.trim()} className="btn-primary self-end px-5">
          Send
        </button>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center h-5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
      ))}
    </div>
  );
}
