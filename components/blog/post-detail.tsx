import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { CategoryLabel } from "@/components/blog/category-label";
import { MdxContent } from "@/components/mdx/mdx-content";
import { DecryptedTextView } from "@/components/visuals/decrypted-text";
import type { BlogPostWithContent } from "@/lib/content/schema";
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
    maxWidth: maxWidth.content,
    marginInline: "auto",
    paddingBlock: spacing.section,
    paddingInline: spacing.lg,
    paddingBottom: spacing.section,
  },
  meta: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fgMuted,
  },
  tags: {
    gap: spacing.sm,
  },
  tag: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.tight,
    color: colors.fg,
    marginBottom: spacing.xl,
  },
  body: {
    marginBottom: spacing.xl,
  },
  backLink: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.accent,
    },
  },
});

type PostDetailProps = {
  post: BlogPostWithContent;
};

export function PostDetail({ post }: PostDetailProps) {
  return (
    <article {...stylex.props(styles.article, x.width["100%"])}>
      <header>
        <div
          {...stylex.props(
            styles.meta,
            x.display.flex,
            x.flexWrap.wrap,
            x.alignItems.center,
          )}
        >
          <time dateTime={post.date} {...stylex.props(styles.date)}>
            {post.date}
          </time>
          <CategoryLabel category={post.category} />
          <div
            {...stylex.props(
              styles.tags,
              x.display.flex,
              x.flexWrap.wrap,
            )}
          >
            {post.tags.map((tag) => (
              <span key={tag} {...stylex.props(styles.tag)}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <h1 {...stylex.props(styles.title)}>
          <DecryptedTextView text={post.title} speed={35} />
        </h1>
      </header>
      <div {...stylex.props(styles.body, x.width["100%"])}>
        <MdxContent source={post.content} />
      </div>
      <Link
        href="/blog"
        {...stylex.props(styles.backLink, x.textDecoration.none)}
      >
        ← Blog 一覧へ
      </Link>
    </article>
  );
}
