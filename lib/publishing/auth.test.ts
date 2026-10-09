import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { readBoundedBody, signatureMatches, webhookSetupEnabled } from "./auth";

test("accepts only an exact HMAC signature", () => {
  const body = new TextEncoder().encode('{"id":"event"}');
  assert.equal(signatureMatches(body, "sha256=bad", "secret"), false);
  assert.equal(signatureMatches(body, null, "secret"), false);
  const valid = createHmac("sha256", "secret").update(body).digest("hex");
  assert.equal(signatureMatches(body, `sha256=${valid}`, "secret"), true);
});

test("bounded request reader stops before retaining an oversized body", async () => {
  const request = new Request("http://localhost", {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(3));
        controller.enqueue(new Uint8Array(3));
        controller.close();
      },
    }),
    duplex: "half",
  } as RequestInit);
  assert.equal(await readBoundedBody(request, 5), null);
});

test("webhook bootstrap treats a blank secret as unset but rejects any configured value", () => {
  const oldSetup = process.env.NOTION_WEBHOOK_SETUP_ENABLED;
  const oldSecret = process.env.NOTION_WEBHOOK_SECRET;
  try {
    process.env.NOTION_WEBHOOK_SETUP_ENABLED = "true";
    process.env.NOTION_WEBHOOK_SECRET = "";
    assert.equal(webhookSetupEnabled(), true);
    process.env.NOTION_WEBHOOK_SECRET = "configured";
    assert.equal(webhookSetupEnabled(), false);
  } finally {
    if (oldSetup === undefined) delete process.env.NOTION_WEBHOOK_SETUP_ENABLED;
    else process.env.NOTION_WEBHOOK_SETUP_ENABLED = oldSetup;
    if (oldSecret === undefined) delete process.env.NOTION_WEBHOOK_SECRET;
    else process.env.NOTION_WEBHOOK_SECRET = oldSecret;
  }
});
