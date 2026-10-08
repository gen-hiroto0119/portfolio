import "server-only";

import { getAllWorks } from "@/app/(legacy)/works/_lib/get-works";
import { getAllPosts } from "@/lib/content";

export type ContentCommandData = {
  id: string;
  group: "Works" | "Blog";
  label: string;
  href: string;
  keywords: string[];
  meta?: string;
};

function getYearFromDate(date: string): string {
  return date.slice(0, 4);
}

export async function getContentCommandData(): Promise<ContentCommandData[]> {
  const [works, posts] = await Promise.all([
    getAllWorks(),
    getAllPosts(),
  ]);

  const workCommands: ContentCommandData[] = works.map((work) => ({
    id: `works:${work.slug}`,
    group: "Works",
    label: work.title,
    href: `/works/${work.slug}`,
    keywords: [work.slug, ...work.stack, work.role, "works", "作品"],
    meta: work.date ? getYearFromDate(work.date) : undefined,
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

  return [...workCommands, ...blogCommands];
}
