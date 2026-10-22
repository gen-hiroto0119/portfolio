import type { APIRoute } from "astro";
import { createBlogCacheInvalidationHandler } from "@/lib/publishing/cache-handler";
const handler = createBlogCacheInvalidationHandler();
export const POST: APIRoute = ({ request }) => handler(request);
