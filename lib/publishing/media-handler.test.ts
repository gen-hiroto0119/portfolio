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
