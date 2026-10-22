import "server-only";

import { timingSafeEqual, createHmac } from "node:crypto";
import { z } from "zod";

export const MIN_SECRET_LENGTH = 32;

export async function readBoundedBody(request: Request, limit: number): Promise<Uint8Array | null> {
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

export function configuredSecret(name: string) {
  const value = process.env[name];
  return value && value.length >= MIN_SECRET_LENGTH ? value : null;
}

export function webhookSetupEnabled() {
  return process.env.NOTION_WEBHOOK_SETUP_ENABLED === "true" && !process.env.NOTION_WEBHOOK_SECRET;
}

export function bearerMatches(request: Request, secret: string) {
  const value = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!value || Buffer.byteLength(value) !== Buffer.byteLength(secret)) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(secret));
}

export function constantTimeTextEqual(value: string, expected: string) {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function signatureMatches(body: Uint8Array, header: string | null, secret: string) {
  if (!header || !/^sha256=[0-9a-f]{64}$/.test(header)) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return timingSafeEqual(Buffer.from(header.slice(7), "hex"), Buffer.from(expected, "hex"));
}

export function errorResponse(status: number) {
  return Response.json({ error: status === 401 ? "Unauthorized" : "Sync is unavailable." }, { status });
}

export function publishingConfigured() {
  return Boolean(
    process.env.NOTION_API_KEY &&
    z.uuid().safeParse(process.env.NOTION_DATA_SOURCE_ID).success &&
    (process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)),
  );
}
