import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { Snapshot } from "@/lib/publishing/model";
import { createContentReaders } from "./index";

function snapshot(title: string, sourceEditedAt = "2026-01-01T00:00:00.000Z"): Snapshot {
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
    sourceEditedAt,
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
  assert.deepEqual(list.map((post) => post.slug), ["published"]);
  assert.deepEqual(Object.keys(list[0]).sort(), ["category", "date", "description", "published", "publishedAt", "slug", "tags", "title", "updatedAt"]);
  assert.deepEqual(Object.keys(post ?? {}).sort(), ["body", "category", "date", "description", "published", "publishedAt", "slug", "tags", "title", "updatedAt"]);
  assert.equal(await readers.getPost("draft"), null);
  assert.equal(await readers.getPost("missing"), null);
});

test("public readers preserve publication time and expose the source edit time", async () => {
  const originalPublication = "2026-01-01T00:00:00+09:00";
  const sourceEditedAt = "2026-02-03T04:05:06.000Z";
  const current = snapshot("Edited title", sourceEditedAt);
  const readers = createContentReaders(async () => ({ snapshot: current }));

  const listPost = (await readers.getAllPosts())[0];
  const detailPost = await readers.getPost("published");

  assert.equal(listPost.publishedAt, originalPublication);
  assert.equal(detailPost?.publishedAt, originalPublication);
  assert.equal(listPost.updatedAt, sourceEditedAt);
  assert.equal(detailPost?.updatedAt, sourceEditedAt);
});

test("readers reflect edits, slug changes and withdrawals when the snapshot is refreshed", async () => {
  let current = snapshot("Before");
  const readers = createContentReaders(async () => ({ snapshot: current }));
  assert.equal((await readers.getPost("published"))?.title, "Before");
  current = snapshot("After");
  assert.equal((await readers.getPost("published"))?.title, "After");
  assert.equal((await readers.getAllPosts())[0].title, "After");
  current.posts[0].slug = "renamed";
  assert.equal(await readers.getPost("published"), null);
  assert.equal((await readers.getPost("renamed"))?.title, "After");
  assert.deepEqual((await readers.getAllPosts()).map((post) => post.slug), ["renamed"]);
  current.posts = [];
  assert.equal(await readers.getPost("renamed"), null);
  assert.deepEqual(await readers.getAllPosts(), []);
});
