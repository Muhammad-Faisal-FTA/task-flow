"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { THEME_LABELS, THEME_NAMES, THEMES, type ThemeName } from "@/lib/themes";

const STORAGE_KEY = "taskflow-theme";
const DEFAULT_THEME: ThemeName = "premium";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  labels: typeof THEME_LABELS;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  for (const [property, value] of Object.entries(THEMES[theme])) {
    root.style.setProperty(property, value);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    const nextTheme = saved && THEME_NAMES.includes(saved) ? saved : DEFAULT_THEME;
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const setTheme = (nextTheme: ThemeName) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, labels: THEME_LABELS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
