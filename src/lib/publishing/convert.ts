import "server-only";

import { mediaPath, type TiptapNode, type TiptapDocument } from "@/lib/cms/document";
import { z } from "zod";

import { PublicationError, type PublishedAsset } from "./model";

export type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  children?: NotionBlock[];
  [key: string]: unknown;
};
export type UploadImage = (data: Uint8Array, contentType: PublishedAsset["contentType"]) => Promise<PublishedAsset>;
type RichText = { type: string; plain_text?: unknown; annotations?: Record<string, unknown>; text?: { link?: { url?: string } | null }; href?: string | null };
const richTextShape = z.object({
  type: z.string(),
  plain_text: z.string(),
  annotations: z.object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    strikethrough: z.boolean().optional(),
    underline: z.boolean().optional(),
    code: z.boolean().optional(),
    color: z.string().optional(),
  }).passthrough().optional(),
  text: z.object({
    content: z.string().optional(),
    link: z.object({ url: z.string() }).nullable().optional(),
  }).passthrough().optional(),
  href: z.string().nullable().optional(),
}).passthrough();

function fail(message: string): never { throw new PublicationError(message); }
function text(value: unknown): RichText[] {
  if (!Array.isArray(value)) fail("Notion のリッチテキスト形式が不正です。");
  try { return z.array(richTextShape).parse(value) as RichText[]; }
  catch { return fail("Notion のリッチテキスト形式が不正です。"); }
}
function inline(value: unknown): TiptapNode[] {
  return text(value).flatMap((item) => {
    if (!["text", "mention"].includes(item.type) || typeof item.plain_text !== "string") fail("未対応の Notion リッチテキストです。");
    const marks: { type: string; attrs?: Record<string, string> }[] = [];
    const a = item.annotations ?? {};
    for (const mark of ["bold", "italic", "strikethrough", "underline", "code"]) if (a[mark] === true) marks.push({ type: mark === "strikethrough" ? "strike" : mark });
    const href = item.text?.link?.url ?? item.href;
    if (href) marks.push({ type: "link", attrs: { href } });
    const parts = item.plain_text.split("\n");
    return parts.flatMap((part, index) => [
      ...(part ? [{ type: "text", text: part, ...(marks.length ? { marks } : {}) } as TiptapNode] : []),
      ...(index < parts.length - 1 ? [{ type: "hardBreak" } as TiptapNode] : []),
    ]);
  });
}
function children(block: NotionBlock): NotionBlock[] { return block.children ?? []; }
function rich(block: NotionBlock, type: string): RichText[] { return text((block[type] as { rich_text?: unknown } | undefined)?.rich_text); }
function paragraph(content: TiptapNode[] = []): TiptapNode { return { type: "paragraph", content }; }

function language(value: unknown): string | null {
  if (typeof value !== "string" || value === "plain text" || value === "plaintext") return null;
  const normalized = value.toLowerCase();
  return normalized === "c++" ? "cpp" : normalized === "c#" ? "csharp" : normalized;
}
function caption(block: NotionBlock): string {
  const value = (block.image as { caption?: unknown } | undefined)?.caption;
  return text(value === undefined ? [] : value).map((item) => item.plain_text as string).join("");
}
function imageUrl(block: NotionBlock): string {
  const image = block.image as { type?: string; file?: { url?: string } } | undefined;
  if (image?.type !== "file") fail("画像は Notion にアップロードしてください。");
  const url = image?.type === "file" ? image.file?.url : undefined;
  if (typeof url !== "string" || !url) fail("Notion 画像を確認できません。");
  let parsed: URL;
  try { parsed = new URL(url); } catch { return fail("画像は Notion にアップロードしてください。"); }
  const allowed = parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.port && !parsed.hash &&
    (parsed.hostname === "secure.notion-static.com" || parsed.hostname === "prod-files-secure.s3.us-west-2.amazonaws.com" ||
      (parsed.hostname === "s3.us-west-2.amazonaws.com" && parsed.pathname.startsWith("/secure.notion-static.com/")));
  if (!allowed) fail("画像は Notion にアップロードしてください。");
  return parsed.href;
}
async function image(block: NotionBlock, upload: UploadImage, deadline: number): Promise<TiptapNode[]> {
  const alt = caption(block);
  const remaining = Math.min(20_000, deadline - Date.now());
  if (remaining <= 0) fail("Notion 本文の取得時間上限を超えました。");
  const response = await fetch(imageUrl(block), { redirect: "manual", signal: AbortSignal.timeout(remaining) });
  if (response.status === 429 || response.status >= 500) throw new Error(`Notion image request failed (${response.status}).`);
  if (!response.ok || response.type === "opaqueredirect") fail("Notion 画像を取得できませんでした。");
  const reader = response.body?.getReader();
  if (!reader) fail("Notion 画像を取得できませんでした。");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4 * 1024 * 1024) {
      await reader.cancel();
      fail("画像が大きすぎます。");
    }
    chunks.push(value);
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  const declared = response.headers.get("content-type")?.split(";")[0].toLowerCase();
  const detected = data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47 &&
    data[4] === 0x0d && data[5] === 0x0a && data[6] === 0x1a && data[7] === 0x0a ? "image/png" :
    data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff ? "image/jpeg" :
    data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x38 &&
    (data[4] === 0x37 || data[4] === 0x39) && data[5] === 0x61 ? "image/gif" :
    data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
    data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50 ? "image/webp" : null;
  if (!detected || declared !== detected) fail("画像の形式を確認できませんでした。SVG は利用できません。");
  const asset = await upload(data, detected);
  const attrs: Record<string, string | number | null> = { assetId: asset.id, src: mediaPath(asset.id), alt, title: null };
  const result: TiptapNode[] = [{ type: "image", attrs }];
  if (alt) result.push(paragraph([{ type: "text", text: alt }]));
  return result;
}

async function convertBlock(block: NotionBlock, upload: UploadImage, deadline: number): Promise<TiptapNode[]> {
  switch (block.type) {
    case "paragraph": return [paragraph(inline(rich(block, "paragraph"))), ...await convertBlocks(children(block), upload, deadline)];
    case "heading_1":
    case "heading_2":
    case "heading_3": return [{ type: "heading", attrs: { level: Number(block.type.slice(-1)) }, content: inline(rich(block, block.type)) }, ...await convertBlocks(children(block), upload, deadline)];
    case "quote": {
      const content = await convertBlocks(children(block), upload, deadline);
      const quote = inline(rich(block, "quote"));
      if (quote.length) content.unshift(paragraph(quote));
      return [{ type: "blockquote", content: content.length ? content : [paragraph()] }];
    }
    case "divider": return [{ type: "horizontalRule" }];
    case "code": {
      const code = rich(block, "code").map((item) => item.plain_text as string).join("");
      return [{ type: "codeBlock", attrs: { language: language((block.code as { language?: unknown }).language) }, content: code ? [{ type: "text", text: code }] : [] }];
    }
    case "image": return image(block, upload, deadline);
    case "table": {
      const rows = children(block);
      let table: { has_column_header: boolean; has_row_header: boolean };
      try { table = z.object({ has_column_header: z.boolean(), has_row_header: z.boolean() }).parse(block.table); }
      catch { return fail("Notion の表形式が不正です。"); }
      return [{ type: "table", content: rows.map((row, rowIndex) => {
        let cells: unknown[];
        try { cells = z.object({ cells: z.array(z.unknown()) }).parse(row.table_row).cells; }
        catch { return fail("Notion の表形式が不正です。"); }
        return {
          type: "tableRow",
          content: cells.map((cell, columnIndex) => ({
            type: table.has_column_header && rowIndex === 0 || table.has_row_header && columnIndex === 0 ? "tableHeader" : "tableCell",
            attrs: { colspan: 1, rowspan: 1, colwidth: null, align: null },
            content: [paragraph(inline(cell))],
          })),
        };
      }) }];
    }
    case "bulleted_list_item":
    case "numbered_list_item": {
      const listType = block.type === "bulleted_list_item" ? "bulletList" : "orderedList";
      return [{ type: listType, content: [{ type: "listItem", content: [paragraph(inline(rich(block, block.type))), ...(await convertBlocks(children(block), upload, deadline))] }] }];
    }
    case "child_page":
    case "child_database":
    case "link_to_page":
    case "synced_block":
    case "equation": fail(`未対応の Notion ブロックです: ${block.type}`);
    default: fail(`未対応の Notion ブロックです: ${block.type}`);
  }
}
async function convertBlocks(blocks: NotionBlock[], upload: UploadImage, deadline: number): Promise<TiptapNode[]> {
  const output: TiptapNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      const listType = block.type === "bulleted_list_item" ? "bulletList" : "orderedList";
      const items: TiptapNode[] = [];
      while (blocks[i]?.type === block.type) {
        items.push((await convertBlock(blocks[i], upload, deadline))[0]);
        i++;
      }
      i--;
      output.push({ type: listType, content: items.flatMap((item) => item.content ?? []) });
    } else output.push(...await convertBlock(block, upload, deadline));
  }
  return output;
}
export async function convertNotionBlocks(blocks: NotionBlock[], upload: UploadImage, deadline = Date.now() + 180_000): Promise<{ body: TiptapDocument; assets: PublishedAsset[] }> {
  const assets: PublishedAsset[] = [];
  const body = await convertBlocks(blocks, async (data, contentType) => {
    const asset = await upload(data, contentType);
    assets.push(asset);
    return asset;
  }, deadline);
  return { body: { type: "doc", content: body.length ? body : [paragraph()] }, assets };
}
