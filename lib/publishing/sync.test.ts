import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { syncPage } from "./sync";
import { ConcurrentPublicationError, type NotionPage, type Snapshot } from "./model";

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
