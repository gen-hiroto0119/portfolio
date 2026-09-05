"use client";

import { useMemo, useState } from "react";

import type { BlogPost } from "@/lib/content/schema";

import {
  CategoryFilterTabs,
  countPostsByCategory,
} from "./category-filter";
import type { CategoryFilter } from "./category-utils";
import { PostList } from "./post-row";


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
    <section className="mx-auto w-full max-w-4xl px-6 pb-24 sm:px-10">
      <CategoryFilterTabs
        selected={selected}
        counts={counts}
        onChange={setSelected}
      />
      {filteredPosts.length > 0 ? (
        <PostList posts={filteredPosts} embedded />
      ) : (
        <p className="py-12 text-sm text-muted-foreground">
          このカテゴリの記事はまだありません
        </p>
      )}
    </section>
  );
}
