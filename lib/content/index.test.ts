import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { Snapshot } from "@/lib/publishing/model";
import { createContentReaders } from "./index";

function snapshot(title: string): Snapshot {
  const post = {
    id: "00000000-0000-4000-8000-000000000031",
    slug: "published",
    title,
    description: "Summary",
    date: "2026-01-01",
    category: "tech",
    tags: ["test"],
    published: true,
    publishedAt: "2026-01-01T00:00:00+09:00",
    revision: 3,
    sourceEditedAt: "2026-01-01T00:00:00.000Z",
    body: { type: "doc", content: [{ type: "paragraph" }] },
    assets: [{
      id: "00000000-0000-4000-8000-000000000032",
      pathname: "blog/assets/00000000-0000-4000-8000-000000000032",
      contentType: "image/png",
    }],
  };
  return { version: 1, generation: randomUUID(), posts: [post], garbage: [] } as unknown as Snapshot;
}

test("public post and list readers omit internal snapshot fields and unpublished posts", async () => {
  const current = snapshot("Public title");
  (current.posts as unknown as Array<Record<string, unknown>>).push({
    ...current.posts[0], slug: "draft", published: false,
  });
  const readers = createContentReaders(async () => ({ snapshot: current }));
  const list = await readers.getAllPosts();
  const post = await readers.getPost("published");
  assert.deepEqual(Object.keys(list[0]).sort(), ["category", "date", "description", "published", "publishedAt", "slug", "tags", "title"]);
  assert.deepEqual(Object.keys(post ?? {}).sort(), ["body", "category", "date", "description", "published", "publishedAt", "slug", "tags", "title"]);
  assert.equal(await readers.getPost("draft"), null);
  assert.equal(await readers.getPost("missing"), null);
});

test("a new request reader sees publication changes without persistent state", async () => {
  let current = snapshot("Before");
  const firstRequest = createContentReaders(async () => ({ snapshot: current }));
  assert.equal((await firstRequest.getPost("published"))?.title, "Before");
  current = snapshot("After");
  const nextRequest = createContentReaders(async () => ({ snapshot: current }));
  assert.equal((await nextRequest.getPost("published"))?.title, "After");
});
