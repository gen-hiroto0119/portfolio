"use client";

import { useMemo, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import type { BlogPost } from "@/lib/content/schema";
import {
  colors,
  fontSize,
  fonts,
  maxWidth,
  spacing,
} from "@/lib/theme/tokens.stylex";

import {
  CategoryFilterTabs,
  countPostsByCategory,
} from "./category-filter";
import type { CategoryFilter } from "./category-utils";
import { PostList } from "./post-row";

const styles = stylex.create({
  shell: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    paddingBottom: spacing.section,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.fgMuted,
    paddingBlock: spacing.xl,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
  },
});

type PostListFilteredProps = {
  posts: BlogPost[];
};

export function PostListFiltered({ posts }: PostListFilteredProps) {
  const [selected, setSelected] = useState<CategoryFilter>("all");

  const counts = useMemo(() => countPostsByCategory(posts), [posts]);

  const filteredPosts = useMemo(() => {
    if (selected === "all") {
      return posts;
    }
    return posts.filter((post) => post.category === selected);
  }, [posts, selected]);

  return (
    <section {...stylex.props(styles.shell, x.width["100%"])}>
      <CategoryFilterTabs
        selected={selected}
        counts={counts}
        onChange={setSelected}
      />
      {filteredPosts.length > 0 ? (
        <PostList posts={filteredPosts} embedded />
      ) : (
        <p {...stylex.props(styles.empty)}>
          このカテゴリの記事はまだありません
        </p>
      )}
    </section>
  );
}
