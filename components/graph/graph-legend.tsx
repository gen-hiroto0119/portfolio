import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  legend: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingInline: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
  },
  item: {
    gap: spacing.xs,
  },
  dotIdea: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: colors.fg,
    flexShrink: 0,
  },
  dotBlog: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: colors.fgMuted,
    flexShrink: 0,
  },
  ringWorks: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.accent,
    backgroundColor: colors.bgSubtle,
    flexShrink: 0,
  },
  lineRelated: {
    width: "14px",
    height: "1px",
    backgroundColor: colors.border,
    flexShrink: 0,
  },
  lineTag: {
    width: "14px",
    height: "1px",
    borderTopWidth: "1px",
    borderTopStyle: "dashed",
    borderTopColor: colors.fgFaint,
    flexShrink: 0,
  },
  divider: {
    width: "1px",
    height: "10px",
    backgroundColor: colors.border,
    flexShrink: 0,
  },
});

export function GraphLegend() {
  return (
    <div
      {...stylex.props(
        styles.legend,
        x.display.flex,
        x.flexWrap.wrap,
        x.alignItems.center,
      )}
      aria-label="Graph legend"
    >
      <span
        {...stylex.props(styles.item, x.display.flex, x.alignItems.center)}
      >
        <span {...stylex.props(styles.dotIdea)} aria-hidden />
        IDEA
      </span>
      <span
        {...stylex.props(styles.item, x.display.flex, x.alignItems.center)}
      >
        <span {...stylex.props(styles.dotBlog)} aria-hidden />
        BLOG
      </span>
      <span
        {...stylex.props(styles.item, x.display.flex, x.alignItems.center)}
      >
        <span {...stylex.props(styles.ringWorks)} aria-hidden />
        WORKS
      </span>
      <span {...stylex.props(styles.divider)} aria-hidden />
      <span
        {...stylex.props(styles.item, x.display.flex, x.alignItems.center)}
      >
        <span {...stylex.props(styles.lineRelated)} aria-hidden />
        RELATED
      </span>
      <span
        {...stylex.props(styles.item, x.display.flex, x.alignItems.center)}
      >
        <span {...stylex.props(styles.lineTag)} aria-hidden />
        TAG
      </span>
    </div>
  );
}
