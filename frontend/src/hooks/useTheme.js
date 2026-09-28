import { useCallback, useEffect, useState } from "react";

// Minimal theme plumbing for the light/dark theme mode.
// Default is "dark" (current control-room look, untouched).
// Sets body[data-theme] so the base backdrop color lives on <body> —
// the AuraBackground multiply layers composite against it.
// Persists to localStorage; full light-panel restyle lands in a later pass.
const KEY = "mrr-theme";

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* private mode — theme just won't persist */
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);

  return { theme, toggle, isLight: theme === "light" };
}
