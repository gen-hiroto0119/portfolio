import type { APIRoute } from 'astro';
import { bearerMatches, configuredSecret, errorResponse } from '@/lib/publishing/auth';

// All Astro readers fetch the current snapshot. There is no cross-request cache to purge.
export const POST: APIRoute = ({ request }) => {
  if (process.env.BLOG_SYNC_ENABLED !== 'true') return errorResponse(503);
  const secret = configuredSecret('BLOG_SYNC_SECRET');
  if (!secret) return errorResponse(503);
  if (!bearerMatches(request, secret)) return errorResponse(401);
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
};
