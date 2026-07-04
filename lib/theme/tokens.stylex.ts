import * as stylex from "@stylexjs/stylex";

/** Semantic color tokens — dark theme values are defaults. */
export const colors = stylex.defineVars({
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
});

/** Font family stacks. */
export const fonts = stylex.defineVars({
  display: "'Space Grotesk Variable', 'Noto Sans JP Variable', sans-serif",
  body: "'Inter Variable', 'Noto Sans JP Variable', sans-serif",
  mono: "'JetBrains Mono Variable', monospace",
});

/** Font size scale. */
export const fontSize = stylex.defineVars({
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.25rem",
  xl: "1.75rem",
  xxl: "clamp(2rem, 5vw, 3rem)",
  display: "clamp(2.5rem, 8vw, 4.5rem)",
});

/** Line height scale. */
export const lineHeight = stylex.defineVars({
  tight: "1.1",
  snug: "1.3",
  normal: "1.7",
});

/** Letter spacing scale. */
export const letterSpacing = stylex.defineVars({
  tight: "-0.02em",
  normal: "0",
  wide: "0.08em",
});

/** Spacing scale. */
export const spacing = stylex.defineVars({
  xxs: "0.25rem",
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2.5rem",
  xxl: "4rem",
  section: "7rem",
});

/** Border radius tokens. */
export const radius = stylex.defineVars({
  sm: "2px",
  md: "4px",
});

/** Motion / transition tokens. */
export const motion = stylex.defineVars({
  durationFast: "150ms",
  durationBase: "200ms",
  durationSlow: "250ms",
  easing: "cubic-bezier(0.2, 0, 0, 1)",
});

/** Layout max-width tokens. */
export const maxWidth = stylex.defineVars({
  content: "42rem",
  wide: "72rem",
});
