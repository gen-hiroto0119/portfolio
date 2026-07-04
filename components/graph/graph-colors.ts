// Canvas palette — maps to lib/theme/tokens.stylex.ts semantic colors.
export const GRAPH_PALETTE = {
  dark: {
    bg: "#0A0A0B",
    bgSubtle: "#111113",
    fg: "#EDEBE8",
    fgMuted: "#8A8782",
    fgFaint: "#55534E",
    border: "#232326",
    accent: "#FF4D00",
  },
  light: {
    bg: "#F7F5F2",
    bgSubtle: "#EFECE7",
    fg: "#141414",
    fgMuted: "#6B6862",
    fgFaint: "#A8A49D",
    border: "#DDD9D2",
    accent: "#E64500",
  },
} as const;

export type GraphPalette =
  (typeof GRAPH_PALETTE)[keyof typeof GRAPH_PALETTE];
