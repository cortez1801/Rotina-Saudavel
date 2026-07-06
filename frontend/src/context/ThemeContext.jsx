import { createContext, useContext, useEffect, useState, useCallback } from "react";

export const THEMES = [
  {
    id: "lavender-mint",
    label: "Lavanda & Menta",
    swatch: ["#C4B5FD", "#A7F3D0", "#FDA4AF"],
  },
  {
    id: "sunset-peach",
    label: "Pôr do Sol",
    swatch: ["#FDBA74", "#FDA4AF", "#F9A8D4"],
  },
  {
    id: "ocean-turquoise",
    label: "Oceano",
    swatch: ["#67E8F9", "#C4B5FD", "#A5F3FC"],
  },
  {
    id: "forest-amber",
    label: "Floresta",
    swatch: ["#86EFAC", "#FCD34D", "#FDBA74"],
  },
  {
    id: "rose-gold",
    label: "Rosé",
    swatch: ["#F9A8D4", "#FDE68A", "#FCA5A5"],
  },
];

const STORAGE_KEY = "rotina.theme";
const DEFAULT_THEME = "lavender-mint";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_e) { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback((id) => {
    if (THEMES.find((t) => t.id === id)) setThemeState(id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
