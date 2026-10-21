import { getCache } from "@vercel/functions";

import { BLOG_CACHE_TAG } from "@/lib/content/cache-policy";
import { isBlobConfigured, readSnapshot } from "@/lib/publishing/blob";
import type { Snapshot } from "@/lib/publishing/model";

const REVALIDATE_SECONDS = 300;

type CachedSnapshot = { snapshot: Snapshot };

let generation = 0;
let pending: Promise<CachedSnapshot | null> | null = null;
let pendingGeneration = -1;

function cache() {
  return getCache({ namespace: "blog" });
}

export async function expireBlogCache(tag: string, options: { expire: number }) {
  if (tag !== BLOG_CACHE_TAG || options.expire !== 0) return;
  generation += 1;
  pending = null;
  await cache().expireTag(BLOG_CACHE_TAG);
}

export async function loadPublicSnapshot(): Promise<CachedSnapshot | null> {
  if (!isBlobConfigured()) return null;
  const current = generation;
  if (!pending || pendingGeneration !== current) {
    pendingGeneration = current;
    pending = readSharedSnapshot(current).finally(() => {
      if (pendingGeneration === current) pending = null;
    });
  }
  return pending;
}

function isCachedSnapshot(value: unknown): value is CachedSnapshot {
  return Boolean(value && typeof value === "object" && "snapshot" in value);
}

async function readSharedSnapshot(current: number): Promise<CachedSnapshot | null> {
  const stored = await cache().get("snapshot");
  if (isCachedSnapshot(stored) && current === generation) return stored;
  const { snapshot } = await readSnapshot();
  const value = { snapshot };
  if (current !== generation) return value;
  try {
    await cache().set("snapshot", value, {
      ttl: REVALIDATE_SECONDS,
      tags: [BLOG_CACHE_TAG],
      name: "blog-snapshot",
    });
  } catch (error) {
    console.error("blog snapshot cache write failed", error);
  }
  return value;
}
