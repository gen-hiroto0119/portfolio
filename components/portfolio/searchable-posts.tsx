"use client";

import { useState } from "react";
import { getFilterLabel, type CategoryFilter } from "@/components/blog/category-utils";
import type { BlogPost } from "@/lib/content/schema";
import { PostList } from "./post-list";
import styles from "./portfolio.module.css";

const categories: CategoryFilter[] = ["all", "tech", "photo", "daily"];

export function SearchablePosts({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const term = query.trim().toLocaleLowerCase();
  const filtered = posts.filter((post) =>
    (category === "all" || post.category === category) &&
    [post.title, post.description, ...post.tags].join(" ").toLocaleLowerCase().includes(term),
  );

  if (!posts.length) return <PostList posts={posts} />;
  return <>
    <details className={styles.search}>
      <summary>検索・絞り込み{term || category !== "all" ? `（${filtered.length}件）` : ""}</summary>
      <div className={styles.searchFields}>
        <label>キーワード<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="タイトル・タグなど" /></label>
        <label>カテゴリ<select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)}>{categories.map((item) => <option key={item} value={item}>{getFilterLabel(item)}</option>)}</select></label>
        <button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>クリア</button>
      </div>
    </details>
    <p className={styles.srOnly} role="status" aria-live="polite">{filtered.length}件の記事</p>
    {filtered.length ? <PostList posts={filtered} /> : <p className={styles.empty}>条件に一致する記事はありません。</p>}
  </>;
}
