import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { SectionLabel } from "@/components/home/section-label";
import type { BlogPost } from "@/lib/content/schema";
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
    gap: spacing.lg,
    paddingBlock: spacing.md,
    // Bleed hover background outward so text stays aligned with labels.
    paddingInline: spacing.sm,
    marginInline: `calc(${spacing.sm} * -1)`,
    color: colors.fg,
    transitionProperty: "color, background-color",
    transitionDuration: motion.durationBase,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.accent,
      backgroundColor: colors.bgSubtle,
    },
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgFaint,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.snug,
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

type WritingSectionProps = {
  posts: BlogPost[];
};

export function WritingSection({ posts }: WritingSectionProps) {
  const latest = posts.slice(0, 3);

  return (
    <section {...stylex.props(styles.section)}>
      <SectionLabel>03 — WRITING</SectionLabel>
      <ul
        {...stylex.props(
          x.listStyle.none,
          x.margin._0,
          x.padding._0,
          x.display.flex,
          x.flexDirection.column,
        )}
      >
        {latest.map((post) => (
          <li key={post.slug} {...stylex.props(styles.item)}>
            <Link
              href={`/blog/${post.slug}`}
              {...stylex.props(
                x.display.flex,
                x.alignItems.baseline,
                x.textDecoration.none,
                styles.link,
              )}
            >
              <time
                dateTime={post.date}
                {...stylex.props(
                  x.flexShrink._0,
                  x.minWidth["6.5rem"],
                  styles.date,
                )}
              >
                {post.date.replace(/-/g, ".")}
              </time>
              <p {...stylex.props(x.margin._0, styles.title)}>{post.title}</p>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/blog"
        {...stylex.props(
          x.display["inline-block"],
          x.textDecoration.none,
          styles.footerLink,
        )}
      >
        すべての記事 →
      </Link>
    </section>
  );
}
