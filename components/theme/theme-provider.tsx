"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light" | "system";

type ResolvedTheme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";
const THEME_CHANGE_EVENT = "portfolio-theme-change";

function notifyThemeChange(): void {
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyResolvedTheme(
  resolved: ResolvedTheme,
  lightThemeClassName: string,
): void {
  const classes = lightThemeClassName.split(" ").filter(Boolean);
  document.documentElement.dataset.theme = resolved;

  if (resolved === "light") {
    classes.forEach((cls) => document.documentElement.classList.add(cls));
  } else {
    classes.forEach((cls) => document.documentElement.classList.remove(cls));
  }
}

function subscribeTheme(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
  const handleChange = () => onStoreChange();

  window.addEventListener(THEME_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  mediaQuery.addEventListener("change", handleChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
    mediaQuery.removeEventListener("change", handleChange);
  };
}

function getThemeSnapshot(): Theme {
  return readStoredTheme();
}

function getServerThemeSnapshot(): Theme {
  return "system";
}

function getResolvedThemeSnapshot(): ResolvedTheme {
  return resolveTheme(readStoredTheme());
}

function getServerResolvedThemeSnapshot(): ResolvedTheme {
  return "dark";
}

type ThemeProviderProps = {
  children: ReactNode;
  lightThemeClassName: string;
};

export function ThemeProvider({
  children,
  lightThemeClassName,
}: ThemeProviderProps) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const resolvedTheme = useSyncExternalStore(
    subscribeTheme,
    getResolvedThemeSnapshot,
    getServerResolvedThemeSnapshot,
  );

  // Keep <html> classes in sync when resolvedTheme changes without setTheme
  // (OS preference change while on "system", or storage events from other tabs).
  useEffect(() => {
    applyResolvedTheme(resolvedTheme, lightThemeClassName);
  }, [resolvedTheme, lightThemeClassName]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      localStorage.setItem(STORAGE_KEY, nextTheme);
      applyResolvedTheme(resolveTheme(nextTheme), lightThemeClassName);
      notifyThemeChange();
    },
    [lightThemeClassName],
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
