/**
 * Raw theme color values for JS-driven visuals (BorderGlow, etc.).
 *
 * StyleX Babel requires static literals inside `defineVars` / `createTheme`,
 * so the same values are duplicated in `tokens.stylex.ts` and `themes.stylex.ts`.
 * Update all three when changing palette colors.
 */

export const darkThemeColors = {
  bg: "#0A0A0B",
  bgSubtle: "#111113",
  bgElevated: "#17171A",
  fg: "#EDEBE8",
  fgMuted: "#8A8782",
  fgFaint: "#55534E",
  border: "#232326",
  borderStrong: "#3A3A3F",
  accent: "#FF4D00",
  accentFg: "#0A0A0B",
  accentMuted: "rgba(255,77,0,0.15)",
  selection: "rgba(255,77,0,0.30)",
};

export const lightThemeColors = {
  bg: "#F7F5F2",
  bgSubtle: "#EFECE7",
  bgElevated: "#FFFFFF",
  fg: "#141414",
  fgMuted: "#6B6862",
  fgFaint: "#A8A49D",
  border: "#DDD9D2",
  borderStrong: "#C2BDB4",
  accent: "#E64500",
  accentFg: "#FFFFFF",
  accentMuted: "rgba(230,69,0,0.12)",
  selection: "rgba(230,69,0,0.25)",
};

export type ThemeColorName = keyof typeof darkThemeColors;

export type ResolvedThemeName = "dark" | "light";

export function getThemeColors(theme: ResolvedThemeName) {
  return theme === "light" ? lightThemeColors : darkThemeColors;
}
