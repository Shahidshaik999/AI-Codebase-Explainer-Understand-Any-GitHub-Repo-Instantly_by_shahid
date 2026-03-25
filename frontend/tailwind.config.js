/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    "#0B0F14",
          surface: "#111827",
          elevated:"#161D2B",
          hover:   "#1C2333",
          border:  "rgba(255,255,255,0.07)",
        },
        text: {
          primary:   "#E5E7EB",
          secondary: "#9CA3AF",
          muted:     "#4B5563",
          inverse:   "#0B0F14",
        },
        accent: {
          purple: "#7C3AED",
          "purple-hover": "#6D28D9",
          blue:   "#3B82F6",
          green:  "#10B981",
          yellow: "#F59E0B",
          red:    "#EF4444",
          cyan:   "#06B6D4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        card: "16px",
        btn:  "10px",
      },
      boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.10)",
        "purple-glow": "0 0 20px rgba(124,58,237,0.3)",
      },
      animation: {
        "fade-in":  "fadeIn 0.25s ease both",
        "slide-up": "slideUp 0.3s ease both",
        "spin-slow":"spin 2s linear infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                              to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
