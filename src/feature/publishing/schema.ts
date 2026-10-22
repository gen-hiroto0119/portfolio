import { z } from "zod";
import { uuid } from "@/feature/media/schema";

export const syncMarkerSchema = z.object({
  version: z.literal(1),
  pageId: uuid,
  token: z.string().min(1).max(200),
  requestedAt: z.iso.datetime({ offset: true }),
});

export const notionPageSchema = z.object({
  id: z.uuid(),
  last_edited_time: z.iso.datetime({ offset: true }),
  archived: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  in_trash: z.boolean().optional(),
  parent: z
    .object({ type: z.string(), data_source_id: z.uuid().optional() })
    .refine(
      (parent) =>
        parent.type !== "data_source_id" || parent.data_source_id !== undefined,
    ),
  properties: z.record(z.string(), z.unknown()),
});
export const notionPageResultSchema = z
  .object({
    results: z.array(z.unknown()),
    has_more: z.boolean(),
    next_cursor: z.string().nullable(),
    request_status: z.object({ type: z.string() }).optional(),
  })
  .passthrough();
export const notionBlockSchema = z
  .object({
    id: z.uuid(),
    type: z.string().min(1),
    has_children: z.boolean(),
  })
  .passthrough();

export const webhookEventSchema = z.object({
  id: z.uuid(),
  type: z.enum([
    "page.created",
    "page.content_updated",
    "page.properties_updated",
    "page.deleted",
    "page.undeleted",
    "page.moved",
  ]),
  entity: z.object({ id: z.uuid() }),
});
export const webhookEnvelopeSchema = z.object({
  id: z.uuid(),
  type: z.string().min(1),
  entity: z.object({ id: z.uuid() }),
});

export const syncRequestSchema = z
  .object({ pageId: z.uuid().optional() })
  .strict();
export const webhookVerificationSchema = z
  .object({ verification_token: z.string().min(1) })
  .strict();

export const notionRichTextSchema = z.array(
  z
    .object({
      type: z.enum(["text", "mention"]),
      plain_text: z.string(),
    })
    .passthrough(),
);
export const notionStatusSchema = z.object({
  type: z.literal("select"),
  select: z.object({ name: z.string() }).nullable(),
});
export const notionTitlePropertySchema = z.object({ title: z.unknown() });
export const notionTextPropertySchema = z.object({ rich_text: z.unknown() });
export const notionDatePropertySchema = z.object({
  date: z.object({ start: z.string() }),
});
export const notionTagsPropertySchema = z.object({
  multi_select: z.array(z.object({ name: z.string() })),
});
export const notionTableSchema = z.object({
  has_column_header: z.boolean(),
  has_row_header: z.boolean(),
});
export const notionTableRowSchema = z.object({ cells: z.array(z.unknown()) });

export const notionBodyRichTextSchema = z
  .object({
    type: z.string(),
    plain_text: z.string(),
    annotations: z
      .object({
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        strikethrough: z.boolean().optional(),
        underline: z.boolean().optional(),
        code: z.boolean().optional(),
        color: z.string().optional(),
      })
      .passthrough()
      .optional(),
    text: z
      .object({
        content: z.string().optional(),
        link: z.object({ url: z.string() }).nullable().optional(),
      })
      .passthrough()
      .optional(),
    href: z.string().nullable().optional(),
  })
  .passthrough();
