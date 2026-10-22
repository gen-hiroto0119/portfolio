import { Hono } from "hono";
import { timingSafeEqual, createHmac } from "node:crypto";
import { start } from "workflow/api";
import { uuid } from "@/feature/media/schema";
import {
  syncRequestSchema,
  webhookEventSchema,
  webhookEnvelopeSchema,
  webhookVerificationSchema,
} from "./schema";

import { isBlobConfigured, storeWebhookVerificationWith } from "./repository";
import { WebhookVerificationConflictError } from "./domain";
import { reconcileBlogWorkflow, syncNotionPageWorkflow } from "./workflows";

const MIN_SECRET_LENGTH = 32;

async function readBoundedBody(
  request: Request,
  limit: number,
): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function configuredSecret(name: string) {
  const value = process.env[name];
  return value && value.length >= MIN_SECRET_LENGTH ? value : null;
}

function webhookSetupEnabled() {
  return (
    process.env.NOTION_WEBHOOK_SETUP_ENABLED === "true" &&
    !process.env.NOTION_WEBHOOK_SECRET
  );
}

function bearerMatches(request: Request, secret: string) {
  const value = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!value || Buffer.byteLength(value) !== Buffer.byteLength(secret))
    return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(secret));
}

function constantTimeTextEqual(value: string, expected: string) {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function signatureMatches(
  body: Uint8Array,
  header: string | null,
  secret: string,
) {
  if (!header || !/^sha256=[0-9a-f]{64}$/.test(header)) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return timingSafeEqual(
    Buffer.from(header.slice(7), "hex"),
    Buffer.from(expected, "hex"),
  );
}

function errorResponse(status: number) {
  return Response.json(
    { error: status === 401 ? "Unauthorized" : "Sync is unavailable." },
    { status },
  );
}

function publishingConfigured() {
  return Boolean(
    process.env.NOTION_API_KEY &&
    uuid.safeParse(process.env.NOTION_DATA_SOURCE_ID).success &&
    (process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)),
  );
}

async function handleSync(request: Request) {
  if (process.env.BLOG_SYNC_ENABLED !== "true") return errorResponse(503);
  const secret = configuredSecret("BLOG_SYNC_SECRET");
  if (!secret) return errorResponse(503);
  if (!bearerMatches(request, secret)) return errorResponse(401);
  if (!publishingConfigured()) return errorResponse(503);
  const bytes = await readBoundedBody(request, 256 * 1024);
  if (!bytes)
    return Response.json({ error: "Invalid request." }, { status: 400 });
  const raw = new TextDecoder().decode(bytes);
  let pageId: string | undefined;
  if (raw.trim()) {
    try {
      const parsed = syncRequestSchema.parse(JSON.parse(raw));
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

const supportedPageEvents = new Set([
  "page.created",
  "page.content_updated",
  "page.properties_updated",
  "page.deleted",
  "page.undeleted",
  "page.moved",
]);

async function handleWebhook(request: Request, key: string) {
  const receivedAt = new Date().toISOString();
  if (process.env.BLOG_SYNC_ENABLED !== "true") return errorResponse(503);
  const expectedKey = process.env.NOTION_WEBHOOK_PATH_SECRET;
  if (
    !expectedKey ||
    expectedKey.length < 32 ||
    !constantTimeTextEqual(key, expectedKey)
  )
    return errorResponse(401);
  const raw = await readBoundedBody(request, 256 * 1024);
  if (!raw)
    return Response.json({ error: "Invalid request." }, { status: 400 });
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body && typeof body === "object" && "verification_token" in body) {
    const bootstrap = webhookVerificationSchema.safeParse(body);
    if (!bootstrap.success)
      return Response.json({ error: "Invalid request." }, { status: 400 });
    if (!webhookSetupEnabled()) return errorResponse(401);
    const signature = request.headers.get("x-notion-signature");
    if (
      signature !== null &&
      !signatureMatches(raw, signature, bootstrap.data.verification_token)
    )
      return errorResponse(401);
    if (!isBlobConfigured()) return errorResponse(503);
    try {
      await storeWebhookVerificationWith(bootstrap.data.verification_token);
    } catch (error) {
      return errorResponse(
        error instanceof WebhookVerificationConflictError ? 409 : 503,
      );
    }
    return Response.json({ ok: true });
  }
  const secret = configuredSecret("NOTION_WEBHOOK_SECRET");
  if (
    !secret ||
    !signatureMatches(raw, request.headers.get("x-notion-signature"), secret)
  )
    return errorResponse(401);
  const envelope = webhookEnvelopeSchema.safeParse(body);
  if (!envelope.success)
    return Response.json({ error: "Invalid request." }, { status: 400 });
  const parsed = webhookEventSchema.safeParse(body);
  if (!parsed.success) {
    if (supportedPageEvents.has(envelope.data.type)) {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }
    if (
      envelope.data.type.startsWith("data_source") &&
      envelope.data.entity.id.replaceAll("-", "").toLowerCase() ===
        process.env.NOTION_DATA_SOURCE_ID?.replaceAll("-", "").toLowerCase()
    ) {
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
    const run = await start(syncNotionPageWorkflow, [
      parsed.data.entity.id,
      parsed.data.type,
      receivedAt,
    ]);
    return Response.json({ runId: run.runId }, { status: 202 });
  } catch {
    return errorResponse(503);
  }
}

const publishing = new Hono()
  .post("/sync", (c) => handleSync(c.req.raw))
  .post("/webhook/:key", (c) => handleWebhook(c.req.raw, c.req.param("key")));

export default publishing;
