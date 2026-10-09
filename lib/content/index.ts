import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { isBlobConfigured, readSnapshot } from "@/lib/publishing/blob";
import type { Snapshot } from "@/lib/publishing/model";
import type { BlogPost, BlogPostWithContent } from "@/lib/content/schema";
import { BLOG_CACHE_TAG } from "@/lib/content/cache-policy";

async function publicSnapshot(): Promise<{ snapshot: Snapshot } | null> {
  "use cache";
  cacheLife("blog");
  cacheTag(BLOG_CACHE_TAG);
  if (!isBlobConfigured()) return null;
  const { snapshot } = await readSnapshot();
  return { snapshot };
}

export function createContentReaders(loadSnapshot: () => Promise<{ snapshot: Snapshot } | null>) {
  return {
    async getAllPosts(): Promise<BlogPost[]> {
      const result = await loadSnapshot();
      if (!result) return [];
      return [...result.snapshot.posts]
        .filter((post) => post.published)
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((post) => ({
          slug: post.slug, title: post.title, description: post.description,
          date: post.date, category: post.category, tags: post.tags, published: post.published,
          publishedAt: post.publishedAt, updatedAt: post.sourceEditedAt,
        }));
    },
    async getPost(slug: string): Promise<BlogPostWithContent | null> {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
      const result = await loadSnapshot();
      const post = result?.snapshot.posts.find((item) => item.slug === slug && item.published);
      if (!post) return null;
      return {
        slug: post.slug, title: post.title, description: post.description,
        date: post.date, category: post.category, tags: post.tags, published: post.published,
        publishedAt: post.publishedAt, updatedAt: post.sourceEditedAt, body: post.body,
      };
    },
  };
}

const readers = createContentReaders(publicSnapshot);
export const getAllPosts = readers.getAllPosts;
export const getPost = readers.getPost;
