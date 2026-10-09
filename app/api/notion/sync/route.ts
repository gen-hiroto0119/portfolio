import { start } from "workflow/api";
import { z } from "zod";

import { bearerMatches, configuredSecret, errorResponse, publishingConfigured, readBoundedBody } from "@/lib/publishing/auth";
import { reconcileBlogWorkflow } from "@/lib/publishing/workflows";

const uuid = z.uuid();

export async function POST(request: Request) {
  if (process.env.BLOG_SYNC_ENABLED !== "true") return errorResponse(503);
  const secret = configuredSecret("BLOG_SYNC_SECRET");
  if (!secret) return errorResponse(503);
  if (!bearerMatches(request, secret)) return errorResponse(401);
  if (!publishingConfigured()) return errorResponse(503);
  const bytes = await readBoundedBody(request, 256 * 1024);
  if (!bytes) return Response.json({ error: "Invalid request." }, { status: 400 });
  const raw = new TextDecoder().decode(bytes);
  let pageId: string | undefined;
  if (raw.trim()) {
    try {
      const parsed = z.object({ pageId: uuid.optional() }).strict().parse(JSON.parse(raw));
      pageId = parsed.pageId;
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }
  }
  try {
    const run = await start(reconcileBlogWorkflow, pageId ? [pageId] : []);
    return Response.json({ runId: run.runId }, { status: 202 });
  } catch {
    return errorResponse(503);
  }
}
