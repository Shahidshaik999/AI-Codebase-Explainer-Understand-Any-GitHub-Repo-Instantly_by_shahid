/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        surface: {
          DEFAULT: "#0B0F1A",
          card:    "#111827",
          hover:   "#1F2937",
          border:  "rgba(255,255,255,0.08)",
        },
        accent: {
          blue:   "#3B82F6",
          cyan:   "#06B6D4",
          purple: "#8B5CF6",
          green:  "#22C55E",
          yellow: "#F59E0B",
          red:    "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #3B82F6, #8B5CF6)",
        "gradient-brand-r": "linear-gradient(135deg, #8B5CF6, #06B6D4)",
        "radial-glow": "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.12), transparent 70%)",
      },
      boxShadow: {
        "glow-blue":   "0 0 20px rgba(59,130,246,0.25)",
        "glow-purple": "0 0 20px rgba(139,92,246,0.25)",
        "card":        "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover":  "0 8px 32px rgba(59,130,246,0.15)",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease",
        "slide-up":   "slideUp 0.3s ease",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
