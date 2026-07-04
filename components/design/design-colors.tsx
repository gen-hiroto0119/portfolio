import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  spacing,
} from "@/lib/theme/tokens.stylex";

const COLOR_TOKENS = [
  { name: "bg", dark: "#0A0A0B", light: "#F7F5F2" },
  { name: "bgSubtle", dark: "#111113", light: "#EFECE7" },
  { name: "bgElevated", dark: "#17171A", light: "#FFFFFF" },
  { name: "fg", dark: "#EDEBE8", light: "#141414" },
  { name: "fgMuted", dark: "#8A8782", light: "#6B6862" },
  { name: "fgFaint", dark: "#55534E", light: "#A8A49D" },
  { name: "border", dark: "#232326", light: "#DDD9D2" },
  { name: "borderStrong", dark: "#3A3A3F", light: "#C2BDB4" },
  { name: "accent", dark: "#FF4D00", light: "#E64500" },
  { name: "accentFg", dark: "#0A0A0B", light: "#FFFFFF" },
  { name: "accentMuted", dark: "rgba(255,77,0,0.15)", light: "rgba(230,69,0,0.12)" },
  { name: "selection", dark: "rgba(255,77,0,0.30)", light: "rgba(230,69,0,0.25)" },
] as const;

const sectionStyles = stylex.create({
  section: {
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    color: colors.fgMuted,
    marginBottom: spacing.lg,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(2, 1fr)",
      "@media (min-width: 640px)": "repeat(3, 1fr)",
      "@media (min-width: 1024px)": "repeat(4, 1fr)",
    },
    gap: spacing.md,
  },
  swatch: {
    gap: spacing.xs,
  },
  color: {
    aspectRatio: "4 / 3",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
  },
  tokenName: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fg,
  },
  values: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgMuted,
    lineHeight: lineHeight.snug,
  },
});

const swatchStyles = stylex.create({
  bg: { backgroundColor: colors.bg },
  bgSubtle: { backgroundColor: colors.bgSubtle },
  bgElevated: { backgroundColor: colors.bgElevated },
  fg: { backgroundColor: colors.fg },
  fgMuted: { backgroundColor: colors.fgMuted },
  fgFaint: { backgroundColor: colors.fgFaint },
  border: { backgroundColor: colors.border },
  borderStrong: { backgroundColor: colors.borderStrong },
  accent: { backgroundColor: colors.accent },
  accentFg: { backgroundColor: colors.accentFg },
  accentMuted: { backgroundColor: colors.accentMuted },
  selection: { backgroundColor: colors.selection },
});

export function DesignColorsSection() {
  return (
    <section aria-labelledby="design-colors" {...stylex.props(sectionStyles.section)}>
      <h2
        id="design-colors"
        {...stylex.props(sectionStyles.sectionLabel, x.textTransform.uppercase)}
      >
        01 — Colors
      </h2>
      <p {...stylex.props(sectionStyles.hint, x.maxWidth["40rem"])}>
        スウォッチはトークンを参照しているため、ヘッダーのテーマ切り替えで色面も変わります。
      </p>
      <div {...stylex.props(sectionStyles.grid)}>
        {COLOR_TOKENS.map((token) => (
          <div
            key={token.name}
            {...stylex.props(
              sectionStyles.swatch,
              x.display.flex,
              x.flexDirection.column,
            )}
          >
            <div {...stylex.props(sectionStyles.color, swatchStyles[token.name])} />
            <p {...stylex.props(sectionStyles.tokenName, x.margin._0)}>
              {token.name}
            </p>
            <p {...stylex.props(sectionStyles.values, x.margin._0)}>
              dark {token.dark}
              <br />
              light {token.light}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
