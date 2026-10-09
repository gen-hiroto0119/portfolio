import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { syncPage } from "./sync";
import { ConcurrentPublicationError, type NotionPage, type Snapshot } from "./model";
import { invalidateBlogCacheIfPending } from "./cache-invalidation";

test("publication commits only after complete content and an unchanged source", async () => {
  const id = randomUUID();
  const source = randomUUID();
  const text = (plain_text: string) => [{ type: "text", plain_text }];
  const page: NotionPage = {
    id, last_edited_time: "2026-01-01T00:00:00Z", parent: { type: "data_source_id", data_source_id: source },
    properties: {
      "公開状態": { type: "select", select: { name: "公開" } },
      "タイトル": { title: text("test") }, slug: { rich_text: text("test") },
      "公開日": { date: { start: "2026-01-01" } },
      "概要": { rich_text: [] }, "タグ": { multi_select: [] },
    },
  };
  let snapshot: Snapshot = { version: 1, generation: randomUUID(), posts: [], garbage: [] };
  let etag: string | null = null;
  let failBody = true;
  let conflict = false;
  const ports = {
    dataSourceId: source,
    read: async () => ({ snapshot: structuredClone(snapshot), etag }),
    write: async (next: Snapshot, expected: string | null) => {
      if (conflict || expected !== etag) throw new ConcurrentPublicationError();
      snapshot = next;
      etag = randomUUID();
    },
    page: async () => structuredClone(page),
    body: async () => {
      if (failBody) throw new Error("download failed");
      return { body: { type: "doc" as const, content: [{ type: "paragraph", content: [{ type: "text", text: "Article excerpt" }] }] }, assets: [] };
    },
    removeAssets: async () => {},
  };
  await assert.rejects(syncPage(id, ports));
  assert.equal(snapshot.posts.length, 0);
  failBody = false;
  await syncPage(id, ports);
  assert.equal(snapshot.posts.length, 1);
  assert.equal(snapshot.posts[0].description, "Article excerpt");
  const first = structuredClone(snapshot);
  conflict = true;
  await assert.rejects(syncPage(id, ports), ConcurrentPublicationError);
  assert.deepEqual(snapshot, first);
  conflict = false;
  page.properties["公開状態"] = { type: "select", select: { name: "非公開" } };
  failBody = true;
  await syncPage(id, ports);
  assert.equal(snapshot.posts.length, 0);
});

test("a clean unpublished draft is a no-op without reading its body or writing the snapshot", async () => {
  const id = randomUUID();
  const source = randomUUID();
  let bodyReads = 0;
  let writes = 0;
  const result = await syncPage(id, {
    dataSourceId: source,
    read: async () => ({
      snapshot: { version: 1, generation: randomUUID(), posts: [], garbage: [], cacheInvalidationPending: false },
      etag: "snapshot-etag",
    }),
    write: async () => { writes++; },
    page: async () => ({
      id, last_edited_time: "2026-01-01T00:00:00Z", parent: { type: "data_source_id", data_source_id: source },
      properties: { "公開状態": { type: "select", select: { name: "下書き" } } },
    }),
    body: async () => { bodyReads++; throw new Error("draft body must not be read"); },
    removeAssets: async () => {},
  });
  assert.deepEqual(result, { action: "unchanged", needsInvalidation: false });
  assert.equal(bodyReads, 0);
  assert.equal(writes, 0);
});

test("an unpublished no-op retains invalidation for an unacknowledged snapshot", async () => {
  const id = randomUUID();
  const source = randomUUID();
  const result = await syncPage(id, {
    dataSourceId: source,
    read: async () => ({
      snapshot: { version: 1, generation: randomUUID(), posts: [], garbage: [] },
      etag: "legacy-etag",
    }),
    write: async () => { assert.fail("a legacy no-op must not rewrite the snapshot"); },
    page: async () => ({
      id, last_edited_time: "2026-01-01T00:00:00Z", parent: { type: "data_source_id", data_source_id: source },
      properties: { "公開状態": { type: "select", select: { name: "下書き" } } },
    }),
    body: async () => { assert.fail("draft body must not be read"); },
    removeAssets: async () => {},
  });
  assert.deepEqual(result, { action: "unchanged", needsInvalidation: true });
});

test("a failed withdrawal invalidation is healed by the next unchanged draft sync", async () => {
  const id = randomUUID();
  const source = randomUUID();
  const text = (plain_text: string) => [{ type: "text", plain_text }];
  const page: NotionPage = {
    id, last_edited_time: "2026-01-01T00:00:00Z", parent: { type: "data_source_id", data_source_id: source },
    properties: {
      "公開状態": { type: "select", select: { name: "公開" } },
      "タイトル": { title: text("recovery") }, slug: { rich_text: text("recovery") },
      "公開日": { date: { start: "2026-01-01" } }, "概要": { rich_text: [] }, "タグ": { multi_select: [] },
    },
  };
  let snapshot: Snapshot = {
    version: 1, generation: randomUUID(), posts: [], garbage: [], cacheInvalidationPending: false,
  };
  let etag: string | null = "etag-0";
  let invalidationFails = false;
  let invalidationRequests = 0;
  const ports = {
    dataSourceId: source,
    read: async () => ({ snapshot: structuredClone(snapshot), etag }),
    write: async (next: Snapshot, expected: string | null) => {
      if (expected !== etag) throw new ConcurrentPublicationError();
      snapshot = structuredClone(next);
      etag = `etag-${Number(etag!.slice(5)) + 1}`;
    },
    page: async () => structuredClone(page),
    body: async () => ({
      body: { type: "doc" as const, content: [{ type: "paragraph", content: [{ type: "text", text: "Post body" }] }] },
      assets: [],
    }),
    removeAssets: async () => {},
  };
  const acknowledge = () => invalidateBlogCacheIfPending({
    read: ports.read,
    write: ports.write,
    invalidate: async () => {
      invalidationRequests++;
      if (invalidationFails) throw new Error("offline");
    },
  });

  assert.equal((await syncPage(id, ports)).action, "published");
  assert.equal(snapshot.cacheInvalidationPending, true);
  page.properties["公開状態"] = { type: "select", select: { name: "非公開" } };
  const withdrawal = await syncPage(id, ports);
  assert.deepEqual(withdrawal, { action: "withdrawn", needsInvalidation: true });
  assert.equal(snapshot.posts.length, 0);

  invalidationFails = true;
  await assert.rejects(acknowledge(), /offline/);
  assert.equal(snapshot.cacheInvalidationPending, true);
  const unchangedDraft = await syncPage(id, ports);
  assert.deepEqual(unchangedDraft, { action: "unchanged", needsInvalidation: true });

  invalidationFails = false;
  assert.deepEqual(await acknowledge(), { invalidated: true });
  assert.equal(snapshot.cacheInvalidationPending, false);
  assert.deepEqual(await syncPage(id, ports), { action: "unchanged", needsInvalidation: false });
  assert.equal(invalidationRequests, 2);
});
