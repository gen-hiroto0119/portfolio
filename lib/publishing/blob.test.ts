import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { BlobPreconditionFailedError } from "@vercel/blob";

import { ConcurrentPublicationError, type Snapshot, type SyncMarker } from "./model";
import { readSnapshotWith, readSyncMarkerWith, storeWebhookVerificationWith, writeSnapshotWith, writeSyncMarkerWith } from "./blob";

const snapshot: Snapshot = { version: 1, generation: randomUUID(), posts: [], garbage: [] };

test("sync markers are private per-page records read without cache and written with CAS", async () => {
  process.env.BLOB_READ_WRITE_TOKEN = "mock";
  const marker: SyncMarker = {
    version: 1, pageId: randomUUID(), token: "run-a", requestedAt: "2026-01-01T00:00:00.000Z",
  };
  const path = `blog/sync/${marker.pageId}.json`;
  let read: { path: string; options: unknown } | undefined;
  const serialized = JSON.stringify(marker);
  const fakeGet = (async (received: string, options: unknown) => {
    read = { path: received, options };
    return { statusCode: 200, stream: new Blob([serialized]).stream(), blob: { etag: "etag-m", size: Buffer.byteLength(serialized) } };
  }) as never;
  assert.deepEqual(await readSyncMarkerWith(fakeGet, marker.pageId), { marker, etag: "etag-m" });
  assert.equal(read?.path, path);
  assert.deepEqual(read?.options, { access: "private", useCache: false, headers: { "Accept-Encoding": "identity" } });

  const oversized = (async () => ({
    statusCode: 200, stream: new Blob(["{}"]).stream(), blob: { etag: "etag-m", size: 4097 },
  })) as never;
  await assert.rejects(readSyncMarkerWith(oversized, marker.pageId), /同期マーカーが大きすぎます/);
  const lyingSize = (async () => ({
    statusCode: 200, stream: new Blob([" ".repeat(4097)]).stream(), blob: { etag: "etag-m", size: 1 },
  })) as never;
  await assert.rejects(readSyncMarkerWith(lyingSize, marker.pageId), /同期マーカーが大きすぎます/);
  const corrupt = (async () => ({
    statusCode: 200, stream: new Blob(["{\"version\":2}"]).stream(), blob: { etag: "etag-m", size: 13 },
  })) as never;
  await assert.rejects(readSyncMarkerWith(corrupt, marker.pageId), /同期マーカーの形式が不正です/);

  let written: { path: string; body: unknown; options: unknown } | undefined;
  const fakePut = (async (received: string, body: unknown, options: unknown) => {
    written = { path: received, body, options };
  }) as never;
  await writeSyncMarkerWith(fakePut, marker, null);
  assert.equal(written?.path, path);
  assert.deepEqual(JSON.parse(String(written?.body)), marker);
  assert.deepEqual(written?.options, {
    access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json; charset=utf-8",
  });
  await writeSyncMarkerWith(fakePut, marker, "etag-m");
  assert.deepEqual(written?.options, {
    access: "private", addRandomSuffix: false, allowOverwrite: true, ifMatch: "etag-m",
    contentType: "application/json; charset=utf-8",
  });
  const conflictPut = (async () => { throw new BlobPreconditionFailedError(); }) as never;
  await assert.rejects(writeSyncMarkerWith(conflictPut, marker, "etag-m"), ConcurrentPublicationError);
});

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
  assert.deepEqual(received, { access: "private", useCache: false, headers: { "Accept-Encoding": "identity" } });
  assert.equal(result.etag, "etag-1");
  assert.equal(result.snapshot.generation, snapshot.generation);
});

test("a missing snapshot starts with invalidation explicitly clear", async () => {
  process.env.BLOB_READ_WRITE_TOKEN = "mock";
  const result = await readSnapshotWith((async () => null) as never);
  assert.equal(result.etag, null);
  assert.equal(result.snapshot.cacheInvalidationPending, false);
});

for (const record of ["snapshot", "marker"] as const) {
  test(`${record} reads preserve the strong etag for conditional writes`, async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "mock";
    const marker: SyncMarker = {
      version: 1, pageId: randomUUID(), token: "run-a", requestedAt: "2026-01-01T00:00:00.000Z",
    };
    const strongEtag = '"object-version"';
    const serialized = JSON.stringify(record === "snapshot" ? snapshot : marker);
    const fakeGet = (async (_path: string, options: { headers?: Record<string, string> }) => ({
      statusCode: 200, stream: new Blob([serialized]).stream(),
      blob: {
        size: Buffer.byteLength(serialized),
        etag: options.headers?.["Accept-Encoding"] === "identity" ? strongEtag : `W/${strongEtag}`,
      },
    })) as never;
    let writes = 0;
    const fakePut = (async (_path: string, _body: unknown, options: { ifMatch?: string }) => {
      if (options.ifMatch !== strongEtag) throw new BlobPreconditionFailedError();
      writes++;
    }) as never;
    if (record === "snapshot") {
      const read = await readSnapshotWith(fakeGet);
      await writeSnapshotWith(fakePut, read.snapshot, read.etag);
    } else {
      const read = await readSyncMarkerWith(fakeGet, marker.pageId);
      assert.ok(read.marker);
      await writeSyncMarkerWith(fakePut, read.marker, read.etag);
    }
    assert.equal(writes, 1);
  });
}

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
