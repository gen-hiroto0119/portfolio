import { z } from "zod";

import { parseTiptapDocument, type TiptapDocument } from "@/lib/cms/document";
import { CmsError } from "@/lib/cms/errors";
import { calendarDateSchema } from "@/lib/content/calendar-date";

export const slugSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "URL は半角英小文字・数字・ハイフンで入力してください。");
const draftInputSchema = z.object({
  id: z.uuid().optional(),
  expectedRevision: z.number().int().positive().optional(),
  slug: slugSchema,
  title: z.string().trim().min(1, "タイトルを入力してください。").max(180),
  description: z.string().trim().max(500),
  date: calendarDateSchema,
  category: z.enum(["tech", "photo", "daily"]),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).transform((tags) => [...new Set(tags)]),
  body: z.unknown(),
}).strict().superRefine((value, context) => {
  if (value.id && !value.expectedRevision) context.addIssue({ code: "custom", path: ["expectedRevision"], message: "保存済みの記事には revision が必要です。" });
  if (!value.id && value.expectedRevision !== undefined) context.addIssue({ code: "custom", path: ["expectedRevision"], message: "新規記事には revision を指定できません。" });
});

export type DraftInput = Omit<z.input<typeof draftInputSchema>, "body"> & { body: TiptapDocument };
export type ValidatedDraftInput = Omit<z.output<typeof draftInputSchema>, "body"> & { body: TiptapDocument };

export function parseDraftInput(input: unknown): ValidatedDraftInput {
  const result = draftInputSchema.safeParse(input);
  if (!result.success) throw new CmsError("VALIDATION", result.error.issues[0]?.message ?? "入力内容を確認してください。");
  return { ...result.data, body: parseTiptapDocument(result.data.body) };
}

export function parsePostId(id: unknown): string {
  const result = z.uuid().safeParse(id);
  if (!result.success) throw new CmsError("VALIDATION", "記事 ID が正しくありません。");
  return result.data;
}

export function parseRevision(value: unknown): number {
  const result = z.number().int().positive().safeParse(value);
  if (!result.success) throw new CmsError("VALIDATION", "revision が正しくありません。");
  return result.data;
}
