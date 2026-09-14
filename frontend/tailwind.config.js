/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f172a",
        surface: "#1e293b",
        "surface-dark": "#0f172a",
        "surface-elevated": "#1e293b",
        "surface-card": "#131c2e",
        "surface-border": "rgba(255, 255, 255, 0.08)",
        "surface-border-subtle": "rgba(255, 255, 255, 0.05)",
        accent: "#10b981",
        "accent-hover": "#059669",
        "accent-glow": "rgba(16, 185, 129, 0.25)",
        "risk-critical": "#f43f5e",
        "risk-high": "#fb923c",
        "risk-medium": "#facc15",
        "risk-low": "#10b981",
        "soc-cyan": "#38bdf8",
        "soc-purple": "#818cf8",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'Geist Sans'",
          "'Plus Jakarta Sans'",
          "'Inter'",
          "sans-serif",
        ],
        mono: [
          "'SF Mono'",
          "'Geist Mono'",
          "ui-monospace",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.035em",
        snug: "-0.015em",
        normal: "-0.01em",
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 30px -4px rgba(0, 0, 0, 0.45)",
        "glow-emerald": "0 0 20px -3px rgba(16, 185, 129, 0.35)",
        "glow-cyan": "0 0 20px -3px rgba(56, 189, 248, 0.35)",
      },
    },
  },
  plugins: [],
};

