import {
  getThemeColors,
  type ResolvedThemeName,
} from "@/lib/theme/theme-colors";

/** HSL components for BorderGlow edge light (derived from accent hue). */
const GLOW_HSL: Record<ResolvedThemeName, string> = {
  dark: "18 100 55",
  light: "18 90 48",
};

export type BorderGlowPalette = {
  backgroundColor: string;
  glowColor: string;
  colors: [string, string, string];
};

export function getBorderGlowPalette(
  theme: ResolvedThemeName,
): BorderGlowPalette {
  const palette = getThemeColors(theme);

  return {
    backgroundColor: palette.bg,
    glowColor: GLOW_HSL[theme],
    colors: [palette.accent, palette.borderStrong, palette.fgFaint],
  };
}
