import { useState, useEffect } from "react";
import { AnalysisProvider } from "./context/AnalysisContext";
import Home from "./pages/Home";

export default function App() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("cb_theme");
      if (saved) return saved === "dark";
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    // Trigger smooth theme transition
    root.classList.add("theme-transitioning");
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try { localStorage.setItem("cb_theme", dark ? "dark" : "light"); } catch {}
    const t = setTimeout(() => root.classList.remove("theme-transitioning"), 300);
    return () => clearTimeout(t);
  }, [dark]);

  // Update favicon
  useEffect(() => {
    const existing = document.querySelector("link[rel='icon']");
    if (existing) existing.href = "/favicon.svg";
  }, []);

  return (
    <AnalysisProvider>
      <Home dark={dark} setDark={setDark} />
    </AnalysisProvider>
  );
}
