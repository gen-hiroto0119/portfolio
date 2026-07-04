import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { SectionLabel } from "@/components/home/section-label";
import type { Work } from "@/lib/content/schema";
import {
  colors,
  fontSize,
  fonts,
  lineHeight,
  motion,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  section: {
    paddingBottom: spacing.xl,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  item: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
    ":last-child": {
      borderBottomWidth: "1px",
      borderBottomStyle: "solid",
      borderBottomColor: colors.border,
    },
  },
  link: {
    gridTemplateColumns: {
      default: "auto minmax(0, 1fr) minmax(14rem, 18rem)",
      "@media (max-width: 640px)": "auto 1fr",
    },
    gridTemplateRows: {
      "@media (max-width: 640px)": "auto auto",
    },
    gap: spacing.lg,
    paddingBlock: spacing.lg,
    // Bleed hover background outward so text stays aligned with labels.
    paddingInline: spacing.sm,
    marginInline: `calc(${spacing.sm} * -1)`,
    color: colors.fg,
    transitionProperty: "background-color, color",
    transitionDuration: motion.durationBase,
    transitionTimingFunction: motion.easing,
    ":hover": {
      backgroundColor: colors.bgSubtle,
      color: colors.accent,
    },
  },
  index: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgFaint,
  },
  main: {
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.tight,
    color: "inherit",
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.snug,
    color: colors.fgMuted,
  },
  meta: {
    gap: spacing.xxs,
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgFaint,
    "@media (max-width: 640px)": {
      gridColumn: "2",
      alignItems: "flex-start",
      textAlign: "left",
    },
  },
  footerLink: {
    marginTop: spacing.lg,
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.accent,
    transitionProperty: "transform",
    transitionDuration: motion.durationBase,
    transitionTimingFunction: motion.easing,
    ":hover": {
      transform: "translateX(4px)",
    },
  },
});

type FeaturedWorksProps = {
  works: Work[];
};

export function FeaturedWorks({ works }: FeaturedWorksProps) {
  const featured = works.slice(0, 3);

  return (
    <section {...stylex.props(styles.section)}>
      <SectionLabel>02 — WORKS</SectionLabel>
      <ul
        {...stylex.props(
          x.listStyle.none,
          x.margin._0,
          x.padding._0,
          x.display.flex,
          x.flexDirection.column,
        )}
      >
        {featured.map((work, index) => (
          <li key={work.slug} {...stylex.props(styles.item)}>
            <Link
              href={`/works/${work.slug}`}
              {...stylex.props(
                x.display.grid,
                x.alignItems.baseline,
                x.textDecoration.none,
                styles.link,
              )}
            >
              <span {...stylex.props(x.minWidth["2ch"], styles.index)}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div
                {...stylex.props(
                  x.display.flex,
                  x.flexDirection.column,
                  x.minWidth._0,
                  styles.main,
                )}
              >
                <p {...stylex.props(x.margin._0, styles.title)}>{work.title}</p>
                <p {...stylex.props(x.margin._0, styles.description)}>
                  {work.description}
                </p>
              </div>
              <div
                {...stylex.props(
                  x.display.flex,
                  x.flexDirection.column,
                  x.alignItems["flex-end"],
                  x.textAlign.right,
                  styles.meta,
                )}
              >
                <span>{work.role}</span>
                <span>{work.stack.join(" · ")}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/works"
        {...stylex.props(
          x.display["inline-block"],
          x.textDecoration.none,
          styles.footerLink,
        )}
      >
        すべての Works →
      </Link>
    </section>
  );
}
