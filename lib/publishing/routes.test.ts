import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

import { POST as manualSync } from "../../app/api/notion/sync/route";
import { POST as notionWebhook } from "../../app/api/notion/webhook/[key]/route";

async function withEnv(values: Record<string, string | undefined>, run: () => Promise<void>) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { await run(); }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("manual sync denies invalid credentials before starting work", async () => {
  await withEnv({
    BLOG_SYNC_ENABLED: "true",
    BLOG_SYNC_SECRET: "m".repeat(32),
    NOTION_API_KEY: undefined,
    NOTION_DATA_SOURCE_ID: undefined,
    BLOB_READ_WRITE_TOKEN: undefined,
    BLOB_STORE_ID: undefined,
    VERCEL_OIDC_TOKEN: undefined,
  }, async () => {
    const response = await manualSync(new Request("http://localhost/api/notion/sync", { method: "POST", headers: { authorization: "Bearer wrong" } }));
    assert.equal(response.status, 401);
  });
});

test("manual sync reports missing configuration without scheduling", async () => {
  await withEnv({ BLOG_SYNC_ENABLED: "false", BLOG_SYNC_SECRET: undefined }, async () => {
    const response = await manualSync(new Request("http://localhost/api/notion/sync", { method: "POST" }));
    assert.equal(response.status, 503);
  });
});

test("webhook rejects invalid signatures and acknowledges unsupported signed events", async () => {
  const pathSecret = "p".repeat(32);
  const signatureSecret = "s".repeat(32);
  await withEnv({
    BLOG_SYNC_ENABLED: "true",
    NOTION_WEBHOOK_PATH_SECRET: pathSecret,
    NOTION_WEBHOOK_SECRET: signatureSecret,
    NOTION_API_KEY: undefined,
    NOTION_DATA_SOURCE_ID: undefined,
    BLOB_READ_WRITE_TOKEN: undefined,
    BLOB_STORE_ID: undefined,
    VERCEL_OIDC_TOKEN: undefined,
  }, async () => {
    const body = JSON.stringify({ id: "00000000-0000-4000-8000-000000000001", type: "comment.created", entity: { id: "00000000-0000-4000-8000-000000000002" } });
    const invalid = await notionWebhook(new Request("http://localhost", { method: "POST", body }), { params: Promise.resolve({ key: pathSecret }) });
    assert.equal(invalid.status, 401);
    const digest = createHmac("sha256", signatureSecret).update(body).digest("hex");
    const ignored = await notionWebhook(new Request("http://localhost", {
      method: "POST",
      body,
      headers: { "x-notion-signature": `sha256=${digest}` },
    }), { params: Promise.resolve({ key: pathSecret }) });
    assert.equal(ignored.status, 200);
  });
});
