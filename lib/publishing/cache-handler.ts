import "server-only";

import { revalidateTag } from "next/cache";

import { BLOG_CACHE_TAG } from "@/lib/content/cache-policy";
import { bearerMatches, configuredSecret, errorResponse } from "./auth";

export function createBlogCacheInvalidationHandler(
  invalidate: typeof revalidateTag = revalidateTag,
) {
  return async function POST(request: Request) {
    if (process.env.BLOG_SYNC_ENABLED !== "true") return errorResponse(503);
    const secret = configuredSecret("BLOG_SYNC_SECRET");
    if (!secret) return errorResponse(503);
    if (!bearerMatches(request, secret)) return errorResponse(401);
    try {
      invalidate(BLOG_CACHE_TAG, { expire: 0 });
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return errorResponse(503);
    }
  };
}
