import "server-only";

import { start } from "workflow/api";
import { z } from "zod";

import { configuredSecret, constantTimeTextEqual, errorResponse, publishingConfigured, readBoundedBody, signatureMatches, webhookSetupEnabled } from "@/lib/publishing/auth";
import { isBlobConfigured, storeWebhookVerificationWith, WebhookVerificationConflictError } from "@/lib/publishing/blob";
import { reconcileBlogWorkflow } from "@/lib/publishing/workflows";

const eventSchema = z.object({
  id: z.uuid(),
  type: z.enum(["page.created", "page.content_updated", "page.properties_updated", "page.deleted", "page.undeleted", "page.moved"]),
  entity: z.object({ id: z.uuid() }),
});
const eventEnvelope = z.object({ id: z.uuid(), type: z.string().min(1), entity: z.object({ id: z.uuid() }) });
const supportedPageEvents = new Set(["page.created", "page.content_updated", "page.properties_updated", "page.deleted", "page.undeleted", "page.moved"]);

export function createNotionWebhookHandler(storeVerification: (token: string) => Promise<void> = storeWebhookVerificationWith) {
  return async function POST(request: Request, context: { params: Promise<{ key: string }> }) {
    if (process.env.BLOG_SYNC_ENABLED !== "true") return errorResponse(503);
    const { key } = await context.params;
    const expectedKey = process.env.NOTION_WEBHOOK_PATH_SECRET;
    if (!expectedKey || expectedKey.length < 32 || !constantTimeTextEqual(key, expectedKey)) return errorResponse(401);
    const raw = await readBoundedBody(request, 256 * 1024);
    if (!raw) return Response.json({ error: "Invalid request." }, { status: 400 });
    let body: unknown;
    try { body = JSON.parse(new TextDecoder().decode(raw)); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

    if (body && typeof body === "object" && "verification_token" in body) {
      const bootstrap = z.object({ verification_token: z.string().min(1) }).strict().safeParse(body);
      if (!bootstrap.success) return Response.json({ error: "Invalid request." }, { status: 400 });
      if (!webhookSetupEnabled()) return errorResponse(401);
      const signature = request.headers.get("x-notion-signature");
      if (signature !== null && !signatureMatches(raw, signature, bootstrap.data.verification_token)) return errorResponse(401);
      if (!isBlobConfigured()) return errorResponse(503);
      try {
        await storeVerification(bootstrap.data.verification_token);
      } catch (error) {
        return errorResponse(error instanceof WebhookVerificationConflictError ? 409 : 503);
      }
      return Response.json({ ok: true });
    }
    const secret = configuredSecret("NOTION_WEBHOOK_SECRET");
    if (!secret || !signatureMatches(raw, request.headers.get("x-notion-signature"), secret)) return errorResponse(401);
    const envelope = eventEnvelope.safeParse(body);
    if (!envelope.success) return Response.json({ error: "Invalid request." }, { status: 400 });
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      if (supportedPageEvents.has(envelope.data.type)) {
        return Response.json({ error: "Invalid request." }, { status: 400 });
      }
      if (envelope.data.type.startsWith("data_source") && envelope.data.entity.id.replaceAll("-", "").toLowerCase() === process.env.NOTION_DATA_SOURCE_ID?.replaceAll("-", "").toLowerCase()) {
        if (!publishingConfigured()) return errorResponse(503);
        try {
          const run = await start(reconcileBlogWorkflow, []);
          return Response.json({ runId: run.runId }, { status: 202 });
        } catch {
          return errorResponse(503);
        }
      }
      return Response.json({ ok: true });
    }
    if (!publishingConfigured()) return errorResponse(503);
    try {
      const run = await start(reconcileBlogWorkflow, [parsed.data.entity.id]);
      return Response.json({ runId: run.runId }, { status: 202 });
    } catch {
      return errorResponse(503);
    }
  };
}
