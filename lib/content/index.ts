import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { getPublishedPost, listPublishedPosts } from "@/lib/cms/posts";
import type { BlogPost, BlogPostWithContent } from "@/lib/content/schema";

export async function getAllPosts(): Promise<BlogPost[]> {
  "use cache";
  cacheLife("blog");
  cacheTag("cms-blog");
  return listPublishedPosts();
}

export async function getPost(slug: string): Promise<BlogPostWithContent | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return getCachedPost(slug);
}

async function getCachedPost(slug: string): Promise<BlogPostWithContent | null> {
  "use cache";
  cacheLife("blog");
  // The shared tag also expires old slugs and cached misses after publication.
  cacheTag("cms-blog");
  return getPublishedPost(slug);
}
