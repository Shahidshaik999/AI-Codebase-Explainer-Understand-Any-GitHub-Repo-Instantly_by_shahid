/**
 * Codebase AI brand assets — pure SVG/CSS, no external images.
 */

/** Square icon mark — works at any size ≥ 16px */
export function LogoIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0, display: "block" }}
    >
      <rect width="32" height="32" rx="7" fill="#0A0A14" />
      {/* Left bracket */}
      <path d="M12 9L8.5 16L12 23" stroke="#5B4BFF" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Right bracket */}
      <path d="M20 9L23.5 16L20 23" stroke="#5B4BFF" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Code slash */}
      <path d="M18.5 9.5L13.5 22.5" stroke="#818CF8" strokeWidth="1.8"
        strokeLinecap="round" />
      {/* Intelligence node */}
      <circle cx="16" cy="16" r="2" fill="#5B4BFF" />
      {/* Pulse ring */}
      <circle cx="16" cy="16" r="4" stroke="#5B4BFF" strokeWidth="0.6" strokeOpacity="0.4" />
    </svg>
  );
}

/** Horizontal lockup: icon + wordmark */
export function LogoHorizontal() {
  return (
    <a
      href="/"
      onClick={(e) => { e.preventDefault(); window.location.reload(); }}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        textDecoration: "none", cursor: "pointer",
      }}
      aria-label="Codebase AI — home"
    >
      <LogoIcon size={28} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 2 }}>
        <span style={{
          fontSize: 14, fontWeight: 700,
          color: "var(--text)",
          letterSpacing: "-0.03em",
          fontFamily: "Inter, sans-serif",
        }}>
          Codebase{" "}
          <span style={{
            background: "linear-gradient(135deg, #5B4BFF, #818CF8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            AI
          </span>
        </span>
        <span style={{
          fontSize: 9, fontWeight: 600,
          letterSpacing: "0.10em", textTransform: "uppercase",
          color: "var(--text-subtle)",
          fontFamily: "Inter, sans-serif",
        }}>
          AI Code Intelligence
        </span>
      </div>
    </a>
  );
}

/** Small spark icon — used in chat AI avatar */
export function AISparkIcon({ size = 14, color = "var(--accent)" }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: "block" }}
      aria-hidden="true"
    >
      <path
        d="M8 2L9.2 6.8L14 8L9.2 9.2L8 14L6.8 9.2L2 8L6.8 6.8L8 2Z"
        fill={color}
      />
    </svg>
  );
}
