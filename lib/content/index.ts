import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { isBlobConfigured, readSnapshot } from "@/lib/publishing/blob";
import type { Snapshot } from "@/lib/publishing/model";
import { createContentReaders } from "./readers";
import { BLOG_CACHE_TAG } from "@/lib/content/cache-policy";

export { createContentReaders } from "./readers";

async function publicSnapshot(): Promise<{ snapshot: Snapshot } | null> {
  "use cache";
  cacheLife("blog");
  cacheTag(BLOG_CACHE_TAG);
  if (!isBlobConfigured()) return null;
  const { snapshot } = await readSnapshot();
  return { snapshot };
}

const readers = createContentReaders(publicSnapshot);
export const getAllPosts = readers.getAllPosts;
export const getPost = readers.getPost;
