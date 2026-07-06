import * as stylex from "@stylexjs/stylex";

import { colors } from "./tokens.stylex";

/**
 * Light theme — applied via class on `<html>` when resolved theme is light.
 * Keep in sync with `lightThemeColors` in `./theme-colors.ts`.
 */
export const lightTheme = stylex.createTheme(colors, {
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
});
