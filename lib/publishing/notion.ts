import "server-only";

import { z } from "zod";

import { PublicationError, type NotionPage } from "./model";
import { convertNotionBlocks, type NotionBlock, type UploadImage } from "./convert";

const API_ROOT = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";
const PAGE_LIMIT = 1000;
const BLOCK_LIMIT = 5000;
const REQUEST_TIMEOUT_MS = 20_000;

const pageShape = z.object({
  id: z.uuid(),
  last_edited_time: z.iso.datetime({ offset: true }),
  archived: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  in_trash: z.boolean().optional(),
  parent: z.object({ type: z.string(), data_source_id: z.uuid().optional() })
    .refine((parent) => parent.type !== "data_source_id" || parent.data_source_id !== undefined),
  properties: z.record(z.string(), z.unknown()),
});
const pageResultShape = z.object({
  results: z.array(z.unknown()),
  has_more: z.boolean(),
  next_cursor: z.string().nullable(),
  request_status: z.object({ type: z.string() }).optional(),
}).passthrough();
const blockShape = z.object({
  id: z.uuid(),
  type: z.string().min(1),
  has_children: z.boolean(),
}).passthrough();
const childBearingBlockTypes = new Set(["bulleted_list_item", "numbered_list_item", "quote", "table", "paragraph", "heading_1", "heading_2", "heading_3"]);

export function notionConfigured() {
  return Boolean(process.env.NOTION_API_KEY && process.env.NOTION_DATA_SOURCE_ID);
}

function dataSourceId() {
  const id = process.env.NOTION_DATA_SOURCE_ID;
  if (!id) throw new PublicationError("Notion のデータソースが設定されていません。");
  try { return z.uuid().parse(id); }
  catch { throw new PublicationError("Notion のデータソース ID が不正です。"); }
}

function apiKey() {
  const key = process.env.NOTION_API_KEY;
  if (!key) throw new PublicationError("Notion API キーが設定されていません。");
  return key;
}

async function request<T>(path: string, init?: RequestInit, deadline?: number): Promise<T> {
  const remaining = deadline === undefined ? REQUEST_TIMEOUT_MS : Math.min(REQUEST_TIMEOUT_MS, deadline - Date.now());
  if (remaining <= 0) throw new PublicationError("Notion 本文の取得時間上限を超えました。");
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    signal: AbortSignal.timeout(remaining),
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    if (response.status === 404 && path.startsWith("/pages/")) return null as T;
    if (response.status === 401 || response.status === 403 ||
        response.status < 500 && ![408, 409, 429].includes(response.status)) {
      throw new PublicationError("Notion API の応答を確認してください。");
    }
    throw new Error(`Notion request failed (${response.status}).`);
  }
  try {
    return await response.json() as T;
  } catch {
    throw new PublicationError("Notion API の応答形式が不正です。");
  }
}

type PageResult = z.infer<typeof pageResultShape>;

function parsePage(value: unknown): NotionPage {
  try { return pageShape.parse(value) as NotionPage; }
  catch { throw new PublicationError("Notion ページの形式が不正です。"); }
}

function parsePageResult(value: unknown): PageResult {
  try { return pageResultShape.parse(value); }
  catch { throw new PublicationError("Notion のページング応答が不正です。"); }
}

export async function fetchPage(id: string): Promise<NotionPage | null> {
  const value = await request<unknown>(`/pages/${id}`);
  if (value === null) return null;
  return parsePage(value);
}

export async function queryPages(): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  let requests = 0;
  const seen = new Set<string>();
  while (true) {
    if (++requests > PAGE_LIMIT) throw new PublicationError("Notion のページ数が上限を超えています。");
    const body = cursor ? { page_size: 100, start_cursor: cursor } : { page_size: 100 };
    const response = parsePageResult(await request<unknown>(`/data_sources/${dataSourceId()}/query`, { method: "POST", body: JSON.stringify(body) }));
    if (response.request_status?.type === "incomplete") {
      throw new PublicationError("Notion の公開記事一覧を取得できませんでした。");
    }
    for (const page of response.results) pages.push(parsePage(page));
    if (pages.length > PAGE_LIMIT) throw new PublicationError("Notion の記事数が上限を超えています。");
    if (!response.has_more) return pages;
    if (!response.next_cursor || seen.has(response.next_cursor)) throw new PublicationError("Notion のページングカーソルが不正です。");
    seen.add(response.next_cursor);
    cursor = response.next_cursor;
  }
}

async function children(id: string, depth: number, count: { value: number }, deadline: number): Promise<NotionBlock[]> {
  if (depth > 24) throw new PublicationError("Notion の本文階層が深すぎます。");
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;
  const seen = new Set<string>();
  while (true) {
    const query = new URLSearchParams({ page_size: "100" });
    if (cursor) query.set("start_cursor", cursor);
    const response = parsePageResult(await request<unknown>(`/blocks/${id}/children?${query}`, undefined, deadline));
    if (response.request_status?.type === "incomplete") {
      throw new PublicationError("Notion の本文を最後まで取得できませんでした。");
    }
    for (const raw of response.results) {
      let block: NotionBlock;
      try {
        block = blockShape.parse(raw) as NotionBlock;
      } catch {
        throw new PublicationError("Notion の本文ブロック形式が不正です。");
      }
      count.value++;
      if (count.value > BLOCK_LIMIT) throw new PublicationError("Notion の本文が大きすぎます。");
      if (block.has_children && childBearingBlockTypes.has(block.type)) {
        block.children = await children(block.id, depth + 1, count, deadline);
      } else if (block.has_children) {
        throw new PublicationError("未対応の Notion ブロック（コンテナ）です。");
      }
      blocks.push(block);
    }
    if (!response.has_more) return blocks;
    if (!response.next_cursor || seen.has(response.next_cursor)) throw new PublicationError("Notion の本文ページングが不正です。");
    seen.add(response.next_cursor);
    cursor = response.next_cursor;
  }
}

export async function fetchBody(id: string, upload: UploadImage) {
  const deadline = Date.now() + 180_000;
  return convertNotionBlocks(await children(id, 0, { value: 0 }, deadline), upload, deadline);
}
