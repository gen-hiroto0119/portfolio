import { z } from "zod";

import { CmsError } from "@/lib/cms/errors";

export type TiptapMark = { type: string; attrs?: Record<string, string> };
export type TiptapNode = {
  type: string;
  attrs?: Record<string, string | number | number[] | null>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
};
export type TiptapDocument = TiptapNode & { type: "doc"; content: TiptapNode[] };

export const EMPTY_DOCUMENT: TiptapDocument = { type: "doc", content: [{ type: "paragraph" }] };
const BLOCKS = new Set(["paragraph", "heading", "blockquote", "bulletList", "orderedList", "codeBlock", "horizontalRule", "image", "table"]);
const TABLE_PARTS = new Set(["tableRow", "tableCell", "tableHeader"]);
const MAX_TABLE_ROWS = 100;
const MAX_TABLE_COLUMNS = 20;
const LEAVES = new Set(["text", "hardBreak", "horizontalRule", "image"]);
const MARKS = new Set(["bold", "italic", "strike", "code", "link", "underline"]);
const assetIdSchema = z.uuid();

function invalid(message = "本文の形式が正しくありません。"): never {
  throw new CmsError("VALIDATION", message);
}

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function shortText(value: unknown, max: number, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string" || value.length > max) invalid();
  return value;
}

export function mediaPath(assetId: string): string {
  return `/media/${assetIdSchema.parse(assetId)}`;
}

function validateTableGrid(rows: TiptapNode[]) {
  const occupied: boolean[][] = rows.map(() => []);
  rows.forEach((row, rowIndex) => {
    let column = 0;
    for (const cell of row.content ?? []) {
      while (occupied[rowIndex][column]) column++;
      const colspan = Number(cell.attrs?.colspan ?? 1);
      const rowspan = Number(cell.attrs?.rowspan ?? 1);
      if (column + colspan > MAX_TABLE_COLUMNS || rowIndex + rowspan > rows.length) invalid("表のセル結合が正しくありません。");
      for (let y = rowIndex; y < rowIndex + rowspan; y++) {
        for (let x = column; x < column + colspan; x++) {
          if (occupied[y][x]) invalid("表のセル結合が重なっています。");
          occupied[y][x] = true;
        }
      }
      column += colspan;
    }
  });
  const columns = occupied[0].length;
  if (!columns || occupied.some((row) => row.length !== columns || Array.from({ length: columns }, (_, index) => row[index]).some((cell) => !cell))) {
    invalid("表の列数が揃っていません。");
  }
}

export function parseTiptapDocument(value: unknown): TiptapDocument {
  let count = 0;
  let textSize = 0;

  function parseNode(input: unknown, depth: number, insideTable = false): TiptapNode {
    if (depth > 32 || ++count > 20_000) invalid("本文が大きすぎます。");
    const raw = object(input);
    const type = raw.type;
    if (typeof type !== "string" || (!BLOCKS.has(type) && !TABLE_PARTS.has(type) && !["doc", "text", "listItem", "hardBreak"].includes(type))) invalid();
    if (type === "doc" && depth !== 0) invalid();
    if (type === "table" && insideTable) invalid("表の中に表は追加できません。");
    const node: TiptapNode = { type };
    const attrs = raw.attrs === undefined ? {} : object(raw.attrs);

    if (type === "text") {
      if (typeof raw.text !== "string" || !raw.text.length) invalid();
      textSize += raw.text.length;
      if (textSize > 500_000) invalid("本文は 50 万文字以内にしてください。");
      node.text = raw.text;
    } else if (raw.text !== undefined) {
      invalid();
    }

    if (type === "text" || type === "hardBreak") {
      if (raw.marks !== undefined) {
        if (!Array.isArray(raw.marks) || raw.marks.length > MARKS.size) invalid();
        node.marks = raw.marks.map((value): TiptapMark => {
          const mark = object(value);
          if (typeof mark.type !== "string" || !MARKS.has(mark.type)) invalid();
          if (mark.type !== "link") return { type: mark.type };
          const href = shortText(object(mark.attrs).href, 2_048);
          if (!/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href) || /[\u0000-\u0020]/.test(href)) invalid("リンクの URL が正しくありません。");
          return { type: "link", attrs: { href, target: "_blank", rel: "noopener noreferrer" } };
        });
      }
    } else if (raw.marks !== undefined) {
      invalid();
    }

    if (type === "heading") {
      const level = attrs.level ?? 2;
      if (typeof level !== "number" || !Number.isInteger(level) || level < 1 || level > 6) invalid();
      node.attrs = { level };
    } else if (type === "orderedList") {
      const start = attrs.start ?? 1;
      if (typeof start !== "number" || !Number.isInteger(start) || start < 1 || start > 1_000_000) invalid();
      node.attrs = { start };
    } else if (type === "codeBlock") {
      const language = shortText(attrs.language, 32);
      if (language && !/^[a-z0-9_+#-]+$/i.test(language)) invalid();
      node.attrs = { language: language || null };
    } else if (type === "tableCell" || type === "tableHeader") {
      const colspan = attrs.colspan ?? 1;
      const rowspan = attrs.rowspan ?? 1;
      const colwidth = attrs.colwidth ?? null;
      const align = attrs.align ?? null;
      if (typeof colspan !== "number" || !Number.isInteger(colspan) || colspan < 1 || colspan > MAX_TABLE_COLUMNS) invalid();
      if (typeof rowspan !== "number" || !Number.isInteger(rowspan) || rowspan < 1 || rowspan > MAX_TABLE_ROWS) invalid();
      if (colwidth !== null && (!Array.isArray(colwidth) || colwidth.length !== colspan || colwidth.some((width) => typeof width !== "number" || !Number.isInteger(width) || width < 0 || width > 2_000))) invalid();
      if (align !== null && (typeof align !== "string" || !["left", "center", "right"].includes(align))) invalid();
      node.attrs = { colspan, rowspan, colwidth, align };
    } else if (type === "image") {
      const result = assetIdSchema.safeParse(attrs.assetId);
      if (!result.success) invalid("画像をライブラリから選択してください。");
      node.attrs = {
        assetId: result.data,
        src: mediaPath(result.data),
        alt: shortText(attrs.alt, 1_000),
        title: shortText(attrs.title, 300) || null,
      };
      for (const dimension of ["width", "height"] as const) {
        const size = attrs[dimension];
        if (size !== undefined && size !== null) {
          if (typeof size !== "number" || !Number.isInteger(size) || size < 1 || size > 50_000) invalid();
          node.attrs[dimension] = size;
        }
      }
    }

    if (raw.content !== undefined && !Array.isArray(raw.content)) invalid();
    const children = (raw.content ?? []) as unknown[];
    if (type === "table" && (!children.length || children.length > MAX_TABLE_ROWS)) invalid("表は1〜100行にしてください。");
    if (type === "tableRow" && children.length > MAX_TABLE_COLUMNS) invalid("表は1〜20列にしてください。");
    if (LEAVES.has(type)) {
      if (children.length) invalid();
      return node;
    }
    node.content = children.map((child) => parseNode(child, depth + 1, insideTable || type === "table"));
    if (["doc", "blockquote"].includes(type) && (!node.content.length || node.content.some((child) => !BLOCKS.has(child.type)))) invalid();
    if (["paragraph", "heading"].includes(type) && node.content.some((child) => !["text", "hardBreak"].includes(child.type))) invalid();
    if (["bulletList", "orderedList"].includes(type) && (!node.content.length || node.content.some((child) => child.type !== "listItem"))) invalid();
    if (type === "listItem" && (node.content[0]?.type !== "paragraph" || node.content.some((child) => !BLOCKS.has(child.type)))) invalid();
    if (type === "codeBlock" && node.content.some((child) => child.type !== "text" || child.marks?.length)) invalid();
    if (type === "table") {
      if (node.content.some((child) => child.type !== "tableRow")) invalid();
      validateTableGrid(node.content);
    }
    if (type === "tableRow" && node.content.some((child) => !["tableCell", "tableHeader"].includes(child.type))) invalid();
    if (["tableCell", "tableHeader"].includes(type) && (!node.content.length || node.content.some((child) => !BLOCKS.has(child.type)))) invalid();
    return node;
  }

  const document = parseNode(value, 0);
  if (document.type !== "doc" || !document.content) invalid();
  return document as TiptapDocument;
}

export function documentAssetIds(document: TiptapDocument): string[] {
  const ids = new Set<string>();
  const visit = (node: TiptapNode) => {
    if (node.type === "image" && typeof node.attrs?.assetId === "string") ids.add(node.attrs.assetId);
    node.content?.forEach(visit);
  };
  visit(document);
  return [...ids];
}
