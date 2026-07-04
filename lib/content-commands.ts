import "server-only";

import { getAllNotes, getAllPosts, getAllWorks } from "@/lib/content";

export type ContentCommandData = {
  id: string;
  group: "Works" | "Blog" | "Garden";
  label: string;
  href: string;
  keywords: string[];
  meta?: string;
};

function getYearFromDate(date: string): string {
  return date.slice(0, 4);
}

export async function getContentCommandData(): Promise<ContentCommandData[]> {
  const [works, posts, notes] = await Promise.all([
    getAllWorks(),
    getAllPosts(),
    getAllNotes(),
  ]);

  const workCommands: ContentCommandData[] = works.map((work) => ({
    id: `works:${work.slug}`,
    group: "Works",
    label: work.title,
    href: `/works/${work.slug}`,
    keywords: [work.slug, ...work.stack, work.role, "works", "作品"],
    meta: getYearFromDate(work.date),
  }));

  const blogCommands: ContentCommandData[] = posts.map((post) => ({
    id: `blog:${post.slug}`,
    group: "Blog",
    label: post.title,
    href: `/blog/${post.slug}`,
    keywords: [
      post.slug,
      ...post.tags,
      post.category,
      "blog",
      "記事",
      "ブログ",
    ],
    meta: post.date,
  }));

  const gardenCommands: ContentCommandData[] = notes.map((note) => ({
    id: `garden:${note.slug}`,
    group: "Garden",
    label: note.title,
    href: `/garden/${note.slug}`,
    keywords: [
      note.slug,
      ...note.tags,
      note.status,
      "garden",
      "メモ",
      "アイデア",
    ],
    meta: note.status,
  }));

  return [...workCommands, ...blogCommands, ...gardenCommands];
}
