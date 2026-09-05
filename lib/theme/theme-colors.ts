export const darkThemeColors = {
  bg: "#141414",
  bgSubtle: "#1e1e20",
  bgElevated: "#242426",
  fg: "#eeeeef",
  fgMuted: "#a1a1aa",
  fgFaint: "#71717a",
  border: "#303033",
  borderStrong: "#454549",
  accent: "#eeeeef",
  accentFg: "#141414",
  accentMuted: "rgba(238,238,239,0.10)",
  selection: "rgba(238,238,239,0.20)",
};

export const lightThemeColors = {
  bg: "#ffffff",
  bgSubtle: "#f7f7f8",
  bgElevated: "#FFFFFF",
  fg: "#202124",
  fgMuted: "#71717a",
  fgFaint: "#a1a1aa",
  border: "#e8e8eb",
  borderStrong: "#d4d4d8",
  accent: "#202124",
  accentFg: "#FFFFFF",
  accentMuted: "rgba(32,33,36,0.06)",
  selection: "rgba(32,33,36,0.16)",
};

export type ThemeColorName = keyof typeof darkThemeColors;

export type ResolvedThemeName = "dark" | "light";

export function getThemeColors(theme: ResolvedThemeName) {
  return theme === "light" ? lightThemeColors : darkThemeColors;
}
