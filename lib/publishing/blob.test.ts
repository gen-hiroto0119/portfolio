import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { BlobPreconditionFailedError } from "@vercel/blob";

import { ConcurrentPublicationError, type Snapshot } from "./model";
import { readSnapshotWith, storeWebhookVerificationWith, writeSnapshotWith } from "./blob";

const snapshot: Snapshot = { version: 1, generation: randomUUID(), posts: [], garbage: [] };

test("private snapshot reads bypass cache and return the SDK etag", async () => {
  process.env.BLOB_READ_WRITE_TOKEN = "mock";
  let received: unknown;
  const fakeGet = (async (_path: string, options: unknown) => {
    received = options;
    const serialized = JSON.stringify(snapshot);
    const stream = new Blob([serialized]).stream();
    return { statusCode: 200, stream, blob: { etag: "etag-1", size: Buffer.byteLength(serialized) } };
  }) as never;
  const result = await readSnapshotWith(fakeGet);
  assert.deepEqual(received, { access: "private", useCache: false });
  assert.equal(result.etag, "etag-1");
  assert.equal(result.snapshot.generation, snapshot.generation);
});

test("snapshot reads reject the provider size before parsing", async () => {
  process.env.BLOB_READ_WRITE_TOKEN = "mock";
  const fakeGet = (async () => ({
    statusCode: 200,
    stream: new Blob(["{}"]).stream(),
    blob: { etag: "etag-big", size: 8 * 1024 * 1024 + 1 },
  })) as never;
  await assert.rejects(readSnapshotWith(fakeGet), /公開スナップショットが大きすぎます/);
});

test("snapshot writes use CAS options and convert precondition conflicts", async () => {
  process.env.BLOB_READ_WRITE_TOKEN = "mock";
  let options: unknown;
  const fakePut = (async (_path: string, _body: unknown, received: unknown) => { options = received; }) as never;
  await writeSnapshotWith(fakePut, snapshot, "etag-2");
  assert.deepEqual(options, {
    access: "private", addRandomSuffix: false, allowOverwrite: true,
    ifMatch: "etag-2", contentType: "application/json; charset=utf-8", cacheControlMaxAge: 60,
  });
  const conflictPut = (async () => { throw new BlobPreconditionFailedError(); }) as never;
  await assert.rejects(writeSnapshotWith(conflictPut, snapshot, "etag-2"), ConcurrentPublicationError);
});

test("webhook verification candidate is written once to a private setup path", async () => {
  process.env.BLOB_READ_WRITE_TOKEN = "mock";
  let received: { path: string; body: unknown; options: unknown } | undefined;
  const fakePut = (async (path: string, body: unknown, options: unknown) => {
    received = { path, body, options };
  }) as never;
  const fakeGet = (async () => null) as never;
  await storeWebhookVerificationWith("mock-verification-token", fakePut, "2026-01-01T00:00:00.000Z", fakeGet);
  assert.equal(received?.path, "blog/setup/webhook-verification.json");
  assert.deepEqual(JSON.parse(String(received?.body)), {
    token: "mock-verification-token",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  assert.deepEqual(received?.options, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: "application/json",
  });
});

test("bootstrap acknowledges the same candidate on retry and rejects a different token", async () => {
  process.env.BLOB_READ_WRITE_TOKEN = "mock";
  let writes = 0;
  const fakePut = (async () => { writes++; }) as never;
  const candidate = JSON.stringify({ token: "same-token", createdAt: "2026-01-01T00:00:00.000Z" });
  const fakeGet = (async () => ({
    statusCode: 200,
    stream: new Blob([candidate]).stream(),
    blob: { etag: "candidate", size: Buffer.byteLength(candidate) },
  })) as never;
  await storeWebhookVerificationWith("same-token", fakePut, undefined, fakeGet);
  await assert.rejects(storeWebhookVerificationWith("different-token", fakePut, undefined, fakeGet), /different webhook verification token/);
  assert.equal(writes, 0);
});
