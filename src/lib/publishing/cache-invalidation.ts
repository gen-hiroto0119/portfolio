import "server-only";

import { configuredSecret } from "./auth";
import type { Snapshot, SnapshotRead } from "./model";

export class CacheInvalidationConfigurationError extends Error {}

export function cacheInvalidationConfig() {
  const secret = configuredSecret("BLOG_SYNC_SECRET");
  let url: URL;
  try {
    url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  } catch {
    throw new CacheInvalidationConfigurationError("公開URLを設定してください。");
  }
  const local = !process.env.VERCEL && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!secret || (url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new CacheInvalidationConfigurationError("公開URLと同期用認証の設定を確認してください。");
  }
  return { url: new URL("/api/notion/revalidate", url), secret };
}

export async function requestBlogCacheInvalidation(fetcher: typeof fetch = fetch) {
  const { url, secret } = cacheInvalidationConfig();
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok || (await response.json()).ok !== true) throw new Error();
  } catch {
    throw new Error("記事キャッシュの失効要求に失敗しました。");
  }
}

export type CacheAcknowledgementPorts = {
  read: () => Promise<SnapshotRead>;
  write: (snapshot: Snapshot, etag: string | null) => Promise<void>;
  invalidate: () => Promise<void>;
};

// The acknowledgement writes back the snapshot it read, so a newer publication
// committed while the request was in flight keeps its own pending flag.
export async function invalidateBlogCacheIfPending(ports: CacheAcknowledgementPorts, force = false) {
  const { snapshot, etag } = await ports.read();
  if (!force && snapshot.cacheInvalidationPending === false) return { invalidated: false as const };
  await ports.invalidate();
  if (snapshot.cacheInvalidationPending !== false) {
    await ports.write({ ...snapshot, cacheInvalidationPending: false }, etag);
  }
  return { invalidated: true as const };
}
