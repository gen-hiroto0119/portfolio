import assert from "node:assert/strict";
import { test } from "node:test";

import { rssLastBuildDate } from "./rss";

test("RSS lastBuildDate advances when a post is edited without changing its publication time", () => {
  const publishedAt = "2026-01-01T00:00:00+09:00";
  const beforeEdit = rssLastBuildDate([{ publishedAt, updatedAt: publishedAt }]);
  const afterEdit = rssLastBuildDate([{ publishedAt, updatedAt: "2026-02-03T04:05:06.000Z" }]);

  assert.equal(beforeEdit, new Date(publishedAt).toUTCString());
  assert.equal(afterEdit, new Date("2026-02-03T04:05:06.000Z").toUTCString());
  assert.notEqual(afterEdit, beforeEdit);
});

test("RSS lastBuildDate falls back to finite publication timestamps", () => {
  const publishedAt = "2026-03-04T00:00:00+09:00";

  assert.equal(rssLastBuildDate([{ publishedAt }]), new Date(publishedAt).toUTCString());
  assert.equal(rssLastBuildDate([{ publishedAt, updatedAt: "not-a-date" }]), new Date(publishedAt).toUTCString());
  assert.equal(rssLastBuildDate([
    { publishedAt, updatedAt: "not-a-date" },
    { publishedAt: "2026-01-01T00:00:00+09:00", updatedAt: "2026-02-01T00:00:00Z" },
  ]), new Date(publishedAt).toUTCString());
});

test("RSS lastBuildDate is omitted when there are no finite candidate dates", () => {
  assert.equal(rssLastBuildDate([]), null);
  assert.equal(rssLastBuildDate([{ publishedAt: "not-a-date", updatedAt: "also-not-a-date" }]), null);
});
