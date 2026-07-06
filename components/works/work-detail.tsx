import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { MdxContent } from "@/components/mdx/mdx-content";
import type { WorkWithContent } from "@/app/works/_lib/schema";
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
  article: {
    paddingBottom: spacing.section,
  },
  hero: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingBlock: spacing.section,
    paddingInline: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.tight,
    color: colors.fg,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    color: colors.fgMuted,
  },
  metaShell: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    marginBottom: spacing.xl,
  },
  metaGrid: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    "@media (max-width: 640px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
  },
  metaCell: {
    padding: spacing.lg,
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderRightColor: colors.border,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
    ":nth-child(4n)": {
      borderRightWidth: 0,
    },
    "@media (max-width: 640px)": {
      ":nth-child(2n)": {
        borderRightWidth: 0,
      },
      ":nth-child(4n)": {
        borderRightWidth: "1px",
      },
      ":nth-child(even)": {
        borderRightWidth: 0,
      },
    },
  },
  metaLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.xs,
  },
  metaValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fg,
    lineHeight: lineHeight.snug,
  },
  summaryGrid: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    marginBottom: spacing.xl,
    paddingInline: spacing.lg,
    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  summaryCell: {
    padding: spacing.lg,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    "@media (min-width: 641px)": {
      ":first-child": {
        borderRightWidth: 0,
      },
    },
    "@media (max-width: 640px)": {
      ":first-child": {
        borderBottomWidth: 0,
      },
    },
  },
  summaryLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    color: colors.fg,
  },
  metricsRow: {
    gap: spacing.xl,
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    marginBottom: spacing.xl,
    paddingInline: spacing.lg,
  },
  metric: {
    gap: spacing.xs,
  },
  metricValue: {
    fontFamily: fonts.display,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.tight,
    color: colors.fg,
  },
  metricLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  bodyShell: {
    maxWidth: maxWidth.content,
    marginInline: "auto",
    paddingInline: spacing.lg,
    marginBottom: spacing.xl,
  },
  linksShell: {
    maxWidth: maxWidth.content,
    marginInline: "auto",
    paddingInline: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  externalLink: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.accent,
    transitionProperty: "opacity",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      opacity: 0.8,
    },
  },
  navShell: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
  },
  navGrid: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
  },
  navLink: {
    gap: spacing.xs,
    padding: spacing.lg,
    transitionProperty: "background-color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      backgroundColor: colors.bgSubtle,
    },
  },
  navDirection: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  navTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.base,
    lineHeight: lineHeight.snug,
    color: colors.fg,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
  },
  navPrev: {
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderRightColor: colors.border,
  },
  navEmpty: {
    padding: spacing.lg,
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderRightColor: colors.border,
  },
});

type WorkDetailProps = {
  work: WorkWithContent;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export function WorkDetail({ work, prev, next }: WorkDetailProps) {
  const metaItems: Array<{ label: string; value: string }> = [
    { label: "Role", value: work.role },
    ...(work.client ? [{ label: "Client", value: work.client }] : []),
    { label: "Date", value: work.date },
    { label: "Stack", value: work.stack.join(" / ") },
  ];

  return (
    <article {...stylex.props(styles.article)}>
      <header
        {...stylex.props(styles.hero, x.width["100%"])}
      >
        <p {...stylex.props(styles.label, x.textTransform.uppercase)}>
          Case Study
        </p>
        <h1 {...stylex.props(styles.title)}>{work.title}</h1>
        <p {...stylex.props(styles.description, x.maxWidth["48rem"])}>
          {work.description}
        </p>
      </header>

      <div
        {...stylex.props(styles.metaShell, x.width["100%"])}
      >
        <div
          {...stylex.props(
            styles.metaGrid,
            x.display.grid,
            x.gridTemplateColumns["repeat(4, 1fr)"],
          )}
        >
          {metaItems.map((item) => (
            <div key={item.label} {...stylex.props(styles.metaCell)}>
              <span
                {...stylex.props(
                  styles.metaLabel,
                  x.textTransform.uppercase,
                  x.display.block,
                )}
              >
                {item.label}
              </span>
              <span {...stylex.props(styles.metaValue)}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        {...stylex.props(
          styles.summaryGrid,
          x.display.grid,
          x.gridTemplateColumns["1fr 1fr"],
          x.gap._0,
          x.width["100%"],
        )}
      >
        <div {...stylex.props(styles.summaryCell)}>
          <span
            {...stylex.props(
              styles.summaryLabel,
              x.textTransform.uppercase,
              x.display.block,
            )}
          >
            Challenge
          </span>
          <p {...stylex.props(styles.summaryText, x.margin._0)}>
            {work.challenge}
          </p>
        </div>
        <div {...stylex.props(styles.summaryCell)}>
          <span
            {...stylex.props(
              styles.summaryLabel,
              x.textTransform.uppercase,
              x.display.block,
            )}
          >
            Outcome
          </span>
          <p {...stylex.props(styles.summaryText, x.margin._0)}>
            {work.outcome}
          </p>
        </div>
      </div>

      {work.metrics && work.metrics.length > 0 ? (
        <div
          {...stylex.props(
            styles.metricsRow,
            x.display.flex,
            x.flexWrap.wrap,
            x.width["100%"],
          )}
        >
          {work.metrics.map((metric) => (
            <div
              key={metric.label}
              {...stylex.props(
                styles.metric,
                x.display.flex,
                x.flexDirection.column,
              )}
            >
              <span {...stylex.props(styles.metricValue)}>{metric.value}</span>
              <span
                {...stylex.props(styles.metricLabel, x.textTransform.uppercase)}
              >
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div {...stylex.props(styles.bodyShell, x.width["100%"])}>
        <MdxContent source={work.content} />
      </div>

      {work.links && work.links.length > 0 ? (
        <div
          {...stylex.props(
            styles.linksShell,
            x.width["100%"],
            x.display.flex,
            x.flexDirection.column,
          )}
        >
          {work.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              {...stylex.props(styles.externalLink, x.textDecoration.none)}
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      ) : null}

      <nav
        aria-label="Work navigation"
        {...stylex.props(styles.navShell, x.width["100%"])}
      >
        <div
          {...stylex.props(
            styles.navGrid,
            x.display.grid,
            x.gridTemplateColumns["1fr 1fr"],
          )}
        >
        {prev ? (
          <Link
            href={`/works/${prev.slug}`}
            {...stylex.props(
              styles.navLink,
              styles.navPrev,
              x.display.flex,
              x.flexDirection.column,
              x.textDecoration.none,
              x.alignItems["flex-start"],
            )}
          >
            <span
              {...stylex.props(styles.navDirection, x.textTransform.uppercase)}
            >
              ← Prev
            </span>
            <span {...stylex.props(styles.navTitle)}>{prev.title}</span>
          </Link>
        ) : (
          <div {...stylex.props(styles.navEmpty)} aria-hidden="true" />
        )}
        {next ? (
          <Link
            href={`/works/${next.slug}`}
            {...stylex.props(
              styles.navLink,
              x.display.flex,
              x.flexDirection.column,
              x.textDecoration.none,
              x.alignItems["flex-end"],
              x.textAlign.right,
            )}
          >
            <span
              {...stylex.props(styles.navDirection, x.textTransform.uppercase)}
            >
              Next →
            </span>
            <span {...stylex.props(styles.navTitle)}>{next.title}</span>
          </Link>
        ) : (
          <div aria-hidden="true" />
        )}
        </div>
      </nav>
    </article>
  );
}
