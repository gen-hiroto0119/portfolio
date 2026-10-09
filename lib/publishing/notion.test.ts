import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchBody, queryPages } from "./notion";

const page = (id: string) => ({
  id, last_edited_time: "2026-01-01T00:00:00.000Z",
  parent: { type: "data_source_id", data_source_id: "00000000-0000-4000-8000-000000000000" }, properties: {},
});

test("data-source query is authenticated and follows all cursors without filters", async () => {
  process.env.NOTION_API_KEY = "notion-mock";
  process.env.NOTION_DATA_SOURCE_ID = "00000000-0000-4000-8000-000000000000";
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; headers: Headers; body: unknown }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    requests.push({ url: String(input), headers, body: init?.body ? JSON.parse(String(init.body)) : null });
    return requests.length === 1
      ? Response.json({ results: [page("00000000-0000-4000-8000-000000000001")], has_more: true, next_cursor: "cursor-1" })
      : Response.json({ results: [page("00000000-0000-4000-8000-000000000002")], has_more: false, next_cursor: null });
  }) as typeof fetch;
  try {
    const pages = await queryPages();
    assert.equal(pages.length, 2);
    assert.equal(requests[0].headers.get("authorization"), "Bearer notion-mock");
    assert.equal(requests[0].headers.get("notion-version"), "2026-03-11");
    assert.equal(requests[0].url, "https://api.notion.com/v1/data_sources/00000000-0000-4000-8000-000000000000/query");
    assert.deepEqual(requests[0].body, { page_size: 100 });
    assert.deepEqual(requests[1].body, { page_size: 100, start_cursor: "cursor-1" });
    assert.equal(requests[1].url, requests[0].url);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("incomplete Notion query fails rather than reconciling partial IDs", async () => {
  process.env.NOTION_API_KEY = "notion-mock";
  process.env.NOTION_DATA_SOURCE_ID = "00000000-0000-4000-8000-000000000000";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => Response.json({
    results: [], has_more: false, next_cursor: null, request_status: { type: "incomplete" },
  })) as typeof fetch;
  try {
    await assert.rejects(queryPages(), /取得できませんでした/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("unsupported child blocks are rejected without recursively fetching their children", async () => {
  process.env.NOTION_API_KEY = "notion-mock";
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = (async () => {
    requests++;
    return Response.json({
      results: [{
        id: "00000000-0000-4000-8000-000000000011",
        type: "child_page",
        has_children: true,
        child_page: { title: "unsupported" },
      }],
      has_more: false,
      next_cursor: null,
    });
  }) as typeof fetch;
  try {
    await assert.rejects(fetchBody("00000000-0000-4000-8000-000000000010", async () => {
      throw new Error("unexpected upload");
    }), /未対応の Notion ブロック/);
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Notion 401 is a publication failure rather than an empty page query", async () => {
  process.env.NOTION_API_KEY = "notion-mock";
  process.env.NOTION_DATA_SOURCE_ID = "00000000-0000-4000-8000-000000000000";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(null, { status: 401 })) as typeof fetch;
  try {
    await assert.rejects(queryPages(), /Notion API の応答を確認/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("paragraph and heading children are fetched in source order", async () => {
  process.env.NOTION_API_KEY = "notion-mock";
  const originalFetch = globalThis.fetch;
  const pageId = "00000000-0000-4000-8000-000000000050";
  const paragraphId = "00000000-0000-4000-8000-000000000051";
  const headingId = "00000000-0000-4000-8000-000000000052";
  const replies = [
    [
      { id: paragraphId, type: "paragraph", has_children: true, paragraph: { rich_text: [] } },
      { id: headingId, type: "heading_2", has_children: true, heading_2: { rich_text: [] } },
    ],
    [{ id: "00000000-0000-4000-8000-000000000053", type: "paragraph", has_children: false, paragraph: { rich_text: [] } }],
    [{ id: "00000000-0000-4000-8000-000000000054", type: "paragraph", has_children: false, paragraph: { rich_text: [] } }],
  ];
  let index = 0;
  globalThis.fetch = (async () => Response.json({ results: replies[index++], has_more: false, next_cursor: null })) as typeof fetch;
  try {
    const result = await fetchBody(pageId, async () => { throw new Error("unexpected upload"); });
    assert.deepEqual(result.body.content.map((node) => node.type), ["paragraph", "paragraph", "heading", "paragraph"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("Notion 408 and 409 responses remain retryable ordinary errors", async () => {
  process.env.NOTION_API_KEY = "notion-mock";
  process.env.NOTION_DATA_SOURCE_ID = "00000000-0000-4000-8000-000000000000";
  const originalFetch = globalThis.fetch;
  try {
    for (const status of [408, 409]) {
      globalThis.fetch = (async () => new Response(null, { status })) as typeof fetch;
      await assert.rejects(queryPages(), (error: unknown) =>
        error instanceof Error && error.name !== "PublicationError" && error.message.includes(String(status)));
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
