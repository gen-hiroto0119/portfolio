import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

import { POST as manualSync } from "../../app/api/notion/sync/route";
import { POST as notionWebhook } from "../../app/api/notion/webhook/[key]/route";
import { storeWebhookVerificationWith } from "./blob";
import { createNotionWebhookHandler } from "./webhook-handler";
import { syncNotionPageWorkflow } from "./workflows";

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

test("webhook bootstrap permits unsigned or candidate-signed requests only during setup", async () => {
  const pathSecret = "p".repeat(32);
  const candidate = "s".repeat(32);
  const body = JSON.stringify({ verification_token: candidate });
  const signature = `sha256=${createHmac("sha256", candidate).update(body).digest("hex")}`;
  await withEnv({
    BLOG_SYNC_ENABLED: "true",
    NOTION_WEBHOOK_PATH_SECRET: pathSecret,
    NOTION_WEBHOOK_SECRET: undefined,
    NOTION_WEBHOOK_SETUP_ENABLED: "true",
    BLOB_READ_WRITE_TOKEN: undefined,
    BLOB_STORE_ID: undefined,
    VERCEL_OIDC_TOKEN: undefined,
  }, async () => {
    const send = (value?: string, key = pathSecret) => notionWebhook(new Request("http://localhost", {
      method: "POST", body,
      headers: value === undefined ? {} : { "x-notion-signature": value },
    }), { params: Promise.resolve({ key }) });
    // Valid bootstrap reaches the storage configuration check without writing.
    assert.equal((await send()).status, 503);
    assert.equal((await send(signature)).status, 503);
    assert.equal((await send("sha256=bad")).status, 401);
    assert.equal((await send(signature, "wrong")).status, 401);
    const wrongSignature = `sha256=${createHmac("sha256", "wrong").update(body).digest("hex")}`;
    assert.equal((await send(wrongSignature)).status, 401);
    process.env.NOTION_WEBHOOK_SETUP_ENABLED = "false";
    assert.equal((await send(signature)).status, 401);
    assert.equal((await send()).status, 401);
    process.env.NOTION_WEBHOOK_SETUP_ENABLED = "true";
    process.env.NOTION_WEBHOOK_SECRET = candidate;
    assert.equal((await send(signature)).status, 401);
    assert.equal((await send()).status, 401);
  });
});

test("manual sync reports missing configuration without scheduling", async () => {
  await withEnv({ BLOG_SYNC_ENABLED: "false", BLOG_SYNC_SECRET: undefined }, async () => {
    const response = await manualSync(new Request("http://localhost/api/notion/sync", { method: "POST" }));
    assert.equal(response.status, 503);
  });
});

test("signed bootstrap saves privately before acknowledging, retries idempotently, and reports conflicts", async () => {
  const pathSecret = "p".repeat(32);
  const candidate = "s".repeat(32);
  await withEnv({
    BLOG_SYNC_ENABLED: "true",
    NOTION_WEBHOOK_PATH_SECRET: pathSecret,
    NOTION_WEBHOOK_SECRET: undefined,
    NOTION_WEBHOOK_SETUP_ENABLED: "true",
    BLOB_READ_WRITE_TOKEN: "mock",
  }, async () => {
    let saved: string | undefined;
    let writes = 0;
    const put = (async (path: string, body: string, options: unknown) => {
      assert.equal(path, "blog/setup/webhook-verification.json");
      assert.deepEqual(options, {
        access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json",
      });
      await Promise.resolve();
      saved = body;
      writes++;
    }) as never;
    const get = (async () => saved === undefined ? null : {
      statusCode: 200, blob: { size: Buffer.byteLength(saved) }, stream: new Blob([saved]).stream(),
    }) as never;
    const handler = createNotionWebhookHandler((token) => storeWebhookVerificationWith(token, put, undefined, get));
    const send = (token: string, valid = true) => {
      const body = JSON.stringify({ verification_token: token });
      const signature = createHmac("sha256", valid ? token : "wrong").update(body).digest("hex");
      return handler(new Request("http://localhost", {
        method: "POST", body, headers: { "x-notion-signature": `sha256=${signature}` },
      }), { params: Promise.resolve({ key: pathSecret }) });
    };
    assert.equal((await send(candidate, false)).status, 401);
    assert.equal(writes, 0);
    const response = await send(candidate);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(JSON.parse(saved!).token, candidate);
    assert.equal(writes, 1);
    assert.equal((await send(candidate)).status, 200);
    assert.equal((await send("t".repeat(32))).status, 409);
    assert.equal(writes, 1);
    process.env.NOTION_WEBHOOK_SETUP_ENABLED = "false";
    assert.equal((await send(candidate)).status, 401);
    assert.equal(writes, 1);
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

test("signed page events start the coalescing workflow with receipt time while invalid signatures do not", async () => {
  const pathSecret = "p".repeat(32);
  const signatureSecret = "s".repeat(32);
  const pageId = "00000000-0000-4000-8000-000000000002";
  const body = JSON.stringify({
    id: "00000000-0000-4000-8000-000000000001",
    type: "page.content_updated",
    entity: { id: pageId },
  });
  await withEnv({
    BLOG_SYNC_ENABLED: "true",
    NOTION_WEBHOOK_PATH_SECRET: pathSecret,
    NOTION_WEBHOOK_SECRET: signatureSecret,
    NOTION_API_KEY: "not-a-real-api-key",
    NOTION_DATA_SOURCE_ID: "00000000-0000-4000-8000-000000000003",
    BLOB_READ_WRITE_TOKEN: "mock",
  }, async () => {
    const started: Array<{ workflow: unknown; args: unknown[] }> = [];
    const startWorkflow = (async (workflow: unknown, args: unknown[]) => {
      started.push({ workflow, args });
      return { runId: "workflow-run" };
    }) as never;
    const handler = createNotionWebhookHandler(undefined, startWorkflow);
    const send = (signatureKey: string) => {
      const signature = createHmac("sha256", signatureKey).update(body).digest("hex");
      return handler(new Request("http://localhost", {
        method: "POST", body, headers: { "x-notion-signature": `sha256=${signature}` },
      }), { params: Promise.resolve({ key: pathSecret }) });
    };
    const before = Date.now();
    assert.equal((await send("wrong")).status, 401);
    assert.equal(started.length, 0);
    const response = await send(signatureSecret);
    const after = Date.now();
    assert.equal(response.status, 202);
    assert.deepEqual(await response.json(), { runId: "workflow-run" });
    assert.equal(started.length, 1);
    assert.equal(started[0].workflow, syncNotionPageWorkflow);
    assert.equal(started[0].args[0], pageId);
    assert.equal(started[0].args[1], "page.content_updated");
    assert.ok(typeof started[0].args[2] === "string");
    const receivedAt = Date.parse(started[0].args[2] as string);
    assert.ok(receivedAt >= before && receivedAt <= after);
  });
});
