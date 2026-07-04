"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import {
  colors,
  fontSize,
  motion,
  radius,
} from "@/lib/theme/tokens.stylex";

import { useTheme, type Theme } from "./theme-provider";

const THEME_CYCLE: Theme[] = ["dark", "light", "system"];

const styles = stylex.create({
  button: {
    backgroundColor: "transparent",
    color: colors.fgMuted,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.md,
    transitionProperty: "color, border-color, background-color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.fg,
      borderColor: colors.borderStrong,
      backgroundColor: colors.bgSubtle,
    },
    ":focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: colors.accent,
      outlineOffset: "2px",
    },
  },
  icon: {
    width: fontSize.sm,
    height: fontSize.sm,
  },
});

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
  if (theme === "dark") {
    return (
      <svg
        {...stylex.props(styles.icon)}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path
          d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5A5.25 5.25 0 0 1 8 1.5Z"
          stroke="currentColor"
          strokeWidth="1.25"
        />
      </svg>
    );
  }

  if (theme === "light") {
    return (
      <svg
        {...stylex.props(styles.icon)}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M8 1.25v1.5M8 13.25v1.5M1.25 8h1.5M13.25 8h1.5M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      {...stylex.props(styles.icon)}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="8.5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M5.5 13h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      {...stylex.props(
        styles.button,
        x.display["inline-flex"],
        x.alignItems.center,
        x.justifyContent.center,
        x.width["2rem"],
        x.height["2rem"],
        x.padding._0,
        x.cursor.pointer,
      )}
      aria-label={`Theme: ${THEME_LABELS[theme]}. Activate to switch theme.`}
      onClick={() => setTheme(nextTheme(theme))}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
