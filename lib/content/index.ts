import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { BlogPost, BlogPostWithContent } from "@/lib/content/schema";

export async function getAllPosts(): Promise<BlogPost[]> {
  "use cache";
  cacheLife("blog");
  cacheTag("cms-blog");
  // 新CMSの接続までは公開記事なし。ローカルの記事ファイルは読み込まない。
  return [];
}

export async function getPost(slug: string): Promise<BlogPostWithContent | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return getCachedPost(slug);
}

async function getCachedPost(slug: string): Promise<BlogPostWithContent | null> {
  "use cache";
  cacheLife("blog");
  cacheTag("cms-blog");
  void slug;
  return null;
}
