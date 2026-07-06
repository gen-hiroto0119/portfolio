"use client";

import Link from "next/link";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import type { Work } from "@/lib/content/schema";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  maxWidth,
  motion,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  card: {
    gap: spacing.lg,
    alignItems: "start",
    paddingBlock: spacing.xl,
    paddingInline: spacing.lg,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
    transitionProperty: "background-color",
    transitionDuration: motion.durationBase,
    transitionTimingFunction: motion.easing,
    ":hover": {
      backgroundColor: colors.bgSubtle,
    },
    ":last-child": {
      borderBottomWidth: "1px",
      borderBottomStyle: "solid",
      borderBottomColor: colors.border,
    },
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      gap: spacing.md,
    },
  },
  listShell: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingBottom: spacing.section,
  },
  indexCol: {
    gap: spacing.xs,
  },
  index: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fgFaint,
  },
  year: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgMuted,
  },
  centerCol: {
    gap: spacing.sm,
  },
  titleRow: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.tight,
    color: colors.fg,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
  },
  titleAccent: {
    color: colors.accent,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    color: colors.fgMuted,
  },
  challengeOutcome: {
    gap: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.snug,
    color: colors.fg,
  },
  miniLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  arrow: {
    color: colors.accent,
    marginInline: spacing.xs,
  },
  metaCol: {
    gap: spacing.md,
    "@media (max-width: 768px)": {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.lg,
    },
  },
  metaGroup: {
    gap: spacing.xs,
  },
  metaLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  metaValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fg,
    lineHeight: lineHeight.snug,
  },
  badge: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.accent,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    paddingInline: spacing.xs,
    paddingBlock: spacing.xxs,
  },
});

type WorkCardProps = {
  work: Work;
  index: number;
};

export function WorkCard({ work, index }: WorkCardProps) {
  const [hovered, setHovered] = useState(false);
  const year = work.date.slice(0, 4);
  const indexStr = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={`/works/${work.slug}`}
      {...stylex.props(
        styles.card,
        x.display.grid,
        x.gridTemplateColumns["auto 1fr auto"],
        x.textDecoration.none,
        x.color.inherit,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        {...stylex.props(
          styles.indexCol,
          x.display.flex,
          x.flexDirection.column,
          x.minWidth["3.5rem"],
        )}
      >
        <span {...stylex.props(styles.index)}>{indexStr}</span>
        <span {...stylex.props(styles.year)}>{year}</span>
      </div>

      <div
        {...stylex.props(
          styles.centerCol,
          x.display.flex,
          x.flexDirection.column,
          x.minWidth._0,
        )}
      >
        <div
          {...stylex.props(
            styles.titleRow,
            x.display.flex,
            x.alignItems.center,
            x.flexWrap.wrap,
          )}
        >
          <h2
            {...stylex.props(styles.title, x.margin._0, hovered && styles.titleAccent)}
          >
            {work.title}
          </h2>
          {work.featured ? (
            <span
              {...stylex.props(
                styles.badge,
                x.textTransform.uppercase,
                x.flexShrink._0,
              )}
            >
              Featured
            </span>
          ) : null}
        </div>
        <p {...stylex.props(styles.description, x.margin._0)}>
          {work.description}
        </p>
        <div
          {...stylex.props(
            styles.challengeOutcome,
            x.display.flex,
            x.alignItems.baseline,
            x.flexWrap.wrap,
          )}
        >
          <span {...stylex.props(styles.miniLabel, x.textTransform.uppercase)}>
            課題
          </span>
          <span>{work.challenge}</span>
          <span {...stylex.props(styles.arrow)} aria-hidden="true">
            →
          </span>
          <span {...stylex.props(styles.miniLabel, x.textTransform.uppercase)}>
            成果
          </span>
          <span>{work.outcome}</span>
        </div>
      </div>

      <div
        {...stylex.props(
          styles.metaCol,
          x.display.flex,
          x.flexDirection.column,
          x.minWidth._10rem,
        )}
      >
        <div
          {...stylex.props(
            styles.metaGroup,
            x.display.flex,
            x.flexDirection.column,
          )}
        >
          <span {...stylex.props(styles.metaLabel, x.textTransform.uppercase)}>
            Role
          </span>
          <span {...stylex.props(styles.metaValue)}>{work.role}</span>
        </div>
        <div
          {...stylex.props(
            styles.metaGroup,
            x.display.flex,
            x.flexDirection.column,
          )}
        >
          <span {...stylex.props(styles.metaLabel, x.textTransform.uppercase)}>
            Stack
          </span>
          <span {...stylex.props(styles.metaValue)}>
            {work.stack.join(" / ")}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function WorkCardList({ works }: { works: Work[] }) {
  return (
    <div {...stylex.props(styles.listShell, x.width["100%"])}>
      {works.map((work, i) => (
        <WorkCard key={work.slug} work={work} index={i} />
      ))}
    </div>
  );
}
