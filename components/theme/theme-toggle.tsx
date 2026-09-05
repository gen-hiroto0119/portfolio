"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { iconSize, iconStroke } from "@/lib/icons";

import { useTheme, type Theme } from "./theme-provider";

const THEME_CYCLE: Theme[] = ["dark", "light", "system"];


const THEME_LABELS: Record<Theme, string> = {
  dark: "Dark theme",
  light: "Light theme",
  system: "System theme",
};

function nextTheme(current: Theme): Theme {
  const index = THEME_CYCLE.indexOf(current);
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length];
}

function ThemeIcon({ theme }: { theme: Theme }) {
  const props = {
    size: iconSize,
    strokeWidth: iconStroke,
    "aria-hidden": true as const,
  };

  if (theme === "dark") {
    return <Moon {...props} />;
  }

  if (theme === "light") {
    return <Sun {...props} />;
  }

  return <Monitor {...props} />;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={`Theme: ${THEME_LABELS[theme]}. Activate to switch theme.`}
      onClick={() => setTheme(nextTheme(theme))}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
