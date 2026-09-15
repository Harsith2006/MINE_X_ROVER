/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0e1626",
        panel2: "#111c31",
        edge: "#1e2a44",
        ink: "#dbe4f3",
        dim: "#8b98b3",
        // ── Neumorphism dark-mode tokens (same-surface illusion on dark) ──
        neu: {
          bg: "#070c16",      // page base — everything is molded from this
          surface: "#0e1626", // raised element fill (matches panel)
          well: "#0a1120",    // pressed/inset element fill (slightly darker)
          ink: "#dbe4f3",     // primary text (≈10:1 on surface)
          muted: "#93a0bb",   // secondary text (AA on surface)
          accent: "#8b84ff",  // interactive highlights / focus rings
          teal: "#38b2ac",    // success / positive states
        },
      },
      boxShadow: {
        // Dark-adapted dual shadows: faint cool light top-left, deep black bottom-right
        "neu-raised": "9px 9px 18px rgba(0,0,0,0.55), -9px -9px 18px rgba(148,178,255,0.08)",
        "neu-hover": "12px 12px 24px rgba(0,0,0,0.6), -12px -12px 24px rgba(148,178,255,0.10)",
        "neu-small": "5px 5px 10px rgba(0,0,0,0.55), -5px -5px 10px rgba(148,178,255,0.08)",
        "neu-inset": "inset 6px 6px 12px rgba(0,0,0,0.55), inset -6px -6px 12px rgba(148,178,255,0.07)",
        "neu-deep": "inset 10px 10px 22px rgba(0,0,0,0.6), inset -10px -10px 22px rgba(148,178,255,0.08)",
        "neu-track": "inset 3px 3px 6px rgba(0,0,0,0.55), inset -3px -3px 6px rgba(148,178,255,0.07)",
      },
      borderRadius: {
        "neu-card": "20px", // dense control-room adaptation of the 32px system radius
        "neu-btn": "16px",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
        body: ['"DM Sans"', "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

