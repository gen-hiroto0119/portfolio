"use client";

import Link from "next/link";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { CategoryLabel } from "@/components/blog/category-label";
import type { BlogPost } from "@/lib/content/schema";
import {
  colors,
  fontSize,
  fonts,
  lineHeight,
  maxWidth,
  motion,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  listShell: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    paddingBottom: spacing.section,
  },
  row: {
    gridTemplateColumns: {
      default: "10rem minmax(0, 42rem)",
      "@media (max-width: 640px)": "1fr",
    },
    columnGap: spacing.xl,
    paddingBlock: spacing.xl,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
    ":last-child": {
      borderBottomWidth: "1px",
      borderBottomStyle: "solid",
      borderBottomColor: colors.border,
    },
  },
  dateColumn: {
    gap: spacing.xs,
    paddingTop: spacing.xxs,
    marginBottom: {
      default: 0,
      "@media (max-width: 640px)": spacing.sm,
    },
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fgMuted,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.tight,
    color: colors.fg,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.sm,
  },
  tags: {
    gap: spacing.sm,
  },
  tag: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgFaint,
  },
});

type PostRowProps = {
  post: BlogPost;
};

function PostRow({ post }: PostRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/blog/${post.slug}`}
      {...stylex.props(
        styles.row,
        x.display.grid,
        x.textDecoration.none,
        x.color.inherit,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        {...stylex.props(
          styles.dateColumn,
          x.display.flex,
          x.flexDirection.column,
        )}
      >
        <time dateTime={post.date} {...stylex.props(styles.date)}>
          {post.date}
        </time>
        <CategoryLabel category={post.category} />
      </div>
      <div>
        <h2 {...stylex.props(styles.title, hovered && styles.titleAccent)}>
          {post.title}
        </h2>
        <p {...stylex.props(styles.description)}>{post.description}</p>
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
    </Link>
  );
}

type PostListProps = {
  posts: BlogPost[];
  embedded?: boolean;
};

export function PostList({ posts, embedded = false }: PostListProps) {
  return (
    <nav
      aria-label="Blog posts"
      {...stylex.props(
        !embedded && styles.listShell,
        x.width["100%"],
      )}
    >
      {posts.map((post) => (
        <PostRow key={post.slug} post={post} />
      ))}
    </nav>
  );
}
