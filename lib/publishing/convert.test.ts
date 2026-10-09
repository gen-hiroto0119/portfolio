import assert from "node:assert/strict";
import { test } from "node:test";
import { convertNotionBlocks } from "./convert";
import { parseTiptapDocument } from "@/lib/cms/document";
import { PublicationError } from "./model";

test("groups contiguous Notion list items and preserves nested lists", async () => {
  const result = await convertNotionBlocks([
    { id: "1", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", plain_text: "one" }] } },
    { id: "2", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", plain_text: "two" }] } },
    { id: "3", type: "paragraph", paragraph: { rich_text: [{ type: "text", plain_text: "after" }] } },
  ], async () => {
    throw new Error("unexpected upload");
  });
  assert.equal(result.body.content[0].type, "bulletList");
  assert.equal(result.body.content[0].content?.length, 2);
  assert.equal(result.body.content[1].type, "paragraph");
});

test("rejects non-Notion image hosts before downloading", async () => {
  await assert.rejects(
    convertNotionBlocks([{ id: "1", type: "image", image: { type: "external", external: { url: "https://example.com/a.png" } } }], async () => {
      throw new Error("unexpected upload");
    }),
    /Notion にアップロード/,
  );
});

test("downloads allowlisted Notion images without forwarding authorization and writes private asset references", async () => {
  const originalFetch = globalThis.fetch;
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(png, { headers: { "content-type": "image/png" } });
  }) as typeof fetch;
  try {
    const result = await convertNotionBlocks([{
      id: "image",
      type: "image",
      image: {
        type: "file",
        file: { url: "https://prod-files-secure.s3.us-west-2.amazonaws.com/image.png" },
        caption: [{ type: "text", plain_text: "caption" }],
      },
    }], async (_data, contentType) => ({
      id: "00000000-0000-4000-8000-000000000001",
      pathname: "blog/assets/00000000-0000-4000-8000-000000000001",
      contentType,
    }));
    assert.equal(requestUrl, "https://prod-files-secure.s3.us-west-2.amazonaws.com/image.png");
    assert.equal(requestInit?.redirect, "manual");
    assert.equal(new Headers(requestInit?.headers).has("authorization"), false);
    assert.equal(result.body.content[0].type, "image");
    assert.equal(result.body.content[1].type, "paragraph");
    assert.equal(result.assets.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects oversized image streams before staging a Blob asset", async () => {
  const originalFetch = globalThis.fetch;
  let uploads = 0;
  globalThis.fetch = (async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 1));
      controller.close();
    },
  }), { headers: { "content-type": "image/png" } })) as typeof fetch;
  try {
    await assert.rejects(convertNotionBlocks([{
      id: "image",
      type: "image",
      image: { type: "file", file: { url: "https://secure.notion-static.com/oversized.png" } },
    }], async () => {
      uploads++;
      throw new Error("unexpected upload");
    }), /画像が大きすぎます/);
    assert.equal(uploads, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserves quote text and table column/row header flags in valid Tiptap", async () => {
  const text = (plain_text: string) => [{ type: "text", plain_text }];
  const result = await convertNotionBlocks([
    {
      id: "quote",
      type: "quote",
      quote: { rich_text: text("quoted") },
      children: [{ id: "quote-child", type: "paragraph", paragraph: { rich_text: text("detail") } }],
    },
    {
      id: "table",
      type: "table",
      table: { has_column_header: true, has_row_header: true },
      children: [{
        id: "row",
        type: "table_row",
        table_row: { cells: [text("header"), text("cell")] },
      }],
    },
  ], async () => { throw new Error("unexpected upload"); });
  const document = parseTiptapDocument(result.body);
  assert.equal(document.content[0].type, "blockquote");
  assert.equal(document.content[0].content?.[0].content?.[0].text, "quoted");
  assert.equal(document.content[1].type, "table");
  assert.equal(document.content[1].content?.[0].content?.[0].type, "tableHeader");
  assert.equal(document.content[1].content?.[0].content?.[1].type, "tableHeader");
});

test("preserves nested paragraphs, headings, and rich-text newlines in validated Tiptap", async () => {
  const rich = (plain_text: string) => [{ type: "text", plain_text }];
  const result = await convertNotionBlocks([
    {
      id: "parent-paragraph",
      type: "paragraph",
      paragraph: { rich_text: rich("parent") },
      children: [
        { id: "nested-paragraph", type: "paragraph", paragraph: { rich_text: rich("first\nsecond") } },
        {
          id: "nested-heading",
          type: "heading_2",
          heading_2: { rich_text: rich("heading") },
          children: [{ id: "heading-child", type: "paragraph", paragraph: { rich_text: rich("after heading") } }],
        },
      ],
    },
  ], async () => { throw new Error("unexpected upload"); });
  const document = parseTiptapDocument(result.body);
  assert.deepEqual(document.content.map((node) => node.type), ["paragraph", "paragraph", "heading", "paragraph"]);
  assert.deepEqual(document.content[1].content?.map((node) => node.type), ["text", "hardBreak", "text"]);
  assert.equal(document.content[1].content?.[0].text, "first");
});

test("preserves empty code blocks without inventing source text", async () => {
  const result = await convertNotionBlocks([
    { id: "empty-code", type: "code", code: { language: "plain text", rich_text: [] } },
  ], async () => { throw new Error("unexpected upload"); });
  assert.deepEqual(parseTiptapDocument(result.body).content[0].content, []);
});

test("retries transient image statuses but rejects unsupported image hosts permanently", async () => {
  const originalFetch = globalThis.fetch;
  const imageBlock = { id: "image", type: "image", image: { type: "file", file: { url: "https://secure.notion-static.com/a.png" } } };
  try {
    globalThis.fetch = (async () => new Response(null, { status: 503 })) as typeof fetch;
    await assert.rejects(convertNotionBlocks([imageBlock], async () => { throw new Error("unexpected upload"); }), (error: unknown) =>
      error instanceof Error && !(error instanceof PublicationError) && !error.message.includes("https://"));
    await assert.rejects(convertNotionBlocks([
      { ...imageBlock, image: { type: "external", external: { url: "https://example.com/a.png" } } },
    ], async () => { throw new Error("unexpected upload"); }), PublicationError);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
