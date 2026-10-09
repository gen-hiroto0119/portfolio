import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { mediaPath } from "@/lib/cms/document";
import type { PublishedAsset, SnapshotRead } from "./model";
import { createMediaHandler } from "./media-handler";

const asset: PublishedAsset = {
  id: "00000000-0000-4000-8000-000000000020",
  pathname: "blog/assets/00000000-0000-4000-8000-000000000020",
  contentType: "image/png",
};

function snapshot(assets: PublishedAsset[]): SnapshotRead {
  return {
    snapshot: {
      version: 1,
      generation: randomUUID(),
      posts: assets.length ? [{
        id: "00000000-0000-4000-8000-000000000021",
        slug: "published",
        title: "Published",
        description: "",
        date: "2026-01-01",
        category: "tech",
        tags: [],
        published: true,
        publishedAt: "2026-01-01T00:00:00+09:00",
        revision: 1,
        body: { type: "doc", content: [{ type: "paragraph" }] },
        assets,
        sourceEditedAt: "2026-01-01T00:00:00.000Z",
      }] : [],
      garbage: [],
    },
    etag: "mock-etag",
  } as SnapshotRead;
}

function request() {
  return new Request(`https://portfolio.test${mediaPath(asset.id)}`);
}

test("serves a published asset at mediaPath without redirecting to Blob", async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const handler = createMediaHandler(async () => snapshot([asset]), async () => ({
    statusCode: 200,
    blob: { size: bytes.byteLength },
    stream: new Blob([bytes]).stream(),
  }));
  const response = await handler(request(), { params: Promise.resolve({ assetId: asset.id }) });
  assert.equal(request().url, `https://portfolio.test/media/${asset.id}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
});

test("returns 404 if an asset is withdrawn before the response is returned", async () => {
  let reads = 0;
  let mediaReads = 0;
  const handler = createMediaHandler(async () => snapshot(reads++ === 0 ? [asset] : []), async () => {
    mediaReads++;
    return { statusCode: 200, blob: { size: 0 }, stream: new Blob([]).stream() };
  });
  const response = await handler(request(), { params: Promise.resolve({ assetId: asset.id }) });
  assert.equal(response.status, 404);
  assert.equal(mediaReads, 1);
  assert.equal(response.headers.get("location"), null);
});

for (const failure of ["withdrawal", "snapshot failure"]) {
  test(`interrupts an active transfer on ${failure}, even within one large Blob chunk`, async () => {
    let unavailable = false;
    let cancelled = false;
    const source = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(128 * 1024).fill(1)); },
      cancel() { cancelled = true; },
    });
    const handler = createMediaHandler(async () => {
      if (unavailable && failure === "snapshot failure") throw new Error("Snapshot unavailable");
      return snapshot(unavailable ? [] : [asset]);
    }, async () => ({ statusCode: 200, blob: { size: 128 * 1024 }, stream: source }));
    const response = await handler(request(), { params: Promise.resolve({ assetId: asset.id }) });
    const reader = response.body!.getReader();
    assert.equal((await reader.read()).value?.byteLength, 64 * 1024);
    unavailable = true;
    await assert.rejects(reader.read(), /Media unavailable/);
    assert.equal(cancelled, true);
  });
}

test("does not send the first chunk after withdrawal between response creation and consumption", async () => {
  let published = true;
  let cancelled = false;
  const source = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array([1])); },
    cancel() { cancelled = true; },
  });
  const handler = createMediaHandler(async () => snapshot(published ? [asset] : []), async () => ({
    statusCode: 200, blob: { size: 1 }, stream: source,
  }));
  const response = await handler(request(), { params: Promise.resolve({ assetId: asset.id }) });
  published = false;
  await assert.rejects(response.arrayBuffer(), /Media unavailable/);
  assert.equal(cancelled, true);
});

for (const method of ["cancel", "abort"]) {
  test(`cancels the Blob reader when the consumer uses ${method}`, async () => {
    let cancelled = false;
    const source = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
    const abort = new AbortController();
    const handler = createMediaHandler(async () => snapshot([asset]), async () => ({
      statusCode: 200, blob: { size: 1 }, stream: source,
    }));
    const response = await handler(new Request(request(), { signal: abort.signal }), { params: Promise.resolve({ assetId: asset.id }) });
    const reader = response.body!.getReader();
    const reading = reader.read();
    if (method === "cancel") {
      await reader.cancel();
      assert.equal((await reading).done, true);
    } else {
      abort.abort();
      await assert.rejects(reading, /aborted/);
    }
    assert.equal(cancelled, true);
  });
}

test("limits actual streamed bytes when Blob size metadata is incorrect", async () => {
  let cancelled = false;
  const source = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 1)); },
    cancel() { cancelled = true; },
  });
  const handler = createMediaHandler(async () => snapshot([asset]), async () => ({
    statusCode: 200, blob: { size: 1 }, stream: source,
  }));
  const response = await handler(request(), { params: Promise.resolve({ assetId: asset.id }) });
  await assert.rejects(response.arrayBuffer(), /Media unavailable/);
  assert.equal(cancelled, true);
});
