/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light mode surface
        surface: {
          DEFAULT: "#F8F9FC",
          card:    "#FFFFFF",
          muted:   "#F3F4F6",
        },
        // Dark mode surface
        dark: {
          bg:     "#08090B",
          card:   "#111318",
          muted:  "#1A1D24",
          border: "#24272E",
        },
        // Brand
        accent: {
          DEFAULT: "#5B4BFF",
          hover:   "#4C3FE6",
          dark:    "#6D5DFB",
          subtle:  "#EEF2FF",
          border:  "#C7D2FE",
        },
        // Text
        ink: {
          DEFAULT: "#111827",
          muted:   "#667085",
          subtle:  "#98A2B3",
        },
        // Semantic
        success: "#12B76A",
        warning: "#F79009",
        danger:  "#F04438",
        border:  "#E5E7EB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        xs:    ["11px", "16px"],
        sm:    ["12px", "18px"],
        base:  ["13px", "20px"],
        md:    ["14px", "22px"],
        lg:    ["15px", "24px"],
        xl:    ["17px", "26px"],
        "2xl": ["20px", "28px"],
        "3xl": ["24px", "32px"],
        "4xl": ["30px", "36px"],
        "5xl": ["36px", "42px"],
      },
      spacing: {
        18: "72px",
        22: "88px",
        26: "104px",
      },
      borderRadius: {
        sm:   "5px",
        DEFAULT: "7px",
        md:   "8px",
        lg:   "10px",
        xl:   "12px",
        "2xl":"16px",
      },
      boxShadow: {
        xs:  "0 1px 2px rgba(0,0,0,0.05)",
        sm:  "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        md:  "0 4px 12px rgba(0,0,0,0.08)",
        lg:  "0 8px 24px rgba(0,0,0,0.10)",
        xl:  "0 20px 50px rgba(0,0,0,0.12)",
        glow:"0 0 0 3px rgba(91,75,255,0.12)",
        "glow-md": "0 4px 16px rgba(91,75,255,0.25)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "300ms",
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideIn:  { from: { opacity: 0, transform: "translateX(-6px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        pulse2:   { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
        spin2:    { to: { transform: "rotate(360deg)" } },
        shimmer:  { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        blink:    { "0%,100%": { opacity: 1 }, "50%": { opacity: 0 } },
        nodeFloat:{ "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-4px)" } },
      },
      animation: {
        "fade-in":   "fadeIn 0.2s ease both",
        "slide-up":  "slideUp 0.25s ease both",
        "slide-in":  "slideIn 0.2s ease both",
        "pulse-dot": "pulse2 1.4s ease-in-out infinite",
        spin:        "spin2 0.8s linear infinite",
        shimmer:     "shimmer 2s linear infinite",
        blink:       "blink 1s step-end infinite",
        float:       "nodeFloat 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
