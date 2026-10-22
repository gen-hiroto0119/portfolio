import type { z } from "zod";
import { uuid } from "@/feature/media/schema";
import {
  notionRichTextSchema,
  notionStatusSchema,
  notionTitlePropertySchema,
  notionTextPropertySchema,
  notionDatePropertySchema,
  notionTagsPropertySchema,
  type syncMarkerSchema,
  type notionPageSchema,
} from "./schema";
import { dateSchema, slugSchema } from "@/feature/posts/schema";

export class BlobConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlobConfigurationError";
  }
}

export class WebhookVerificationConflictError extends Error {
  constructor() {
    super("A different webhook verification token is already stored.");
    this.name = "WebhookVerificationConflictError";
  }
}

export type SyncMarker = z.infer<typeof syncMarkerSchema>;
export type SyncMarkerRead = { marker: SyncMarker | null; etag: string | null };

export class PublicationError extends Error {}
export class ConcurrentPublicationError extends Error {}

export type NotionPage = z.infer<typeof notionPageSchema>;

function richText(value: unknown): string {
  return notionRichTextSchema
    .parse(value)
    .map((item) => item.plain_text)
    .join("");
}

export function pageMetadata(page: NotionPage, dataSourceId: string) {
  if (
    page.archived ||
    page.is_archived ||
    page.in_trash ||
    page.parent.type !== "data_source_id" ||
    page.parent.data_source_id?.replaceAll("-", "").toLowerCase() !==
      dataSourceId.replaceAll("-", "").toLowerCase()
  )
    return null;
  const properties = page.properties;
  let status: { select: { name: string } | null };
  try {
    status = notionStatusSchema.parse(properties["公開状態"]);
  } catch {
    throw new PublicationError("公開状態の形式を確認してください。");
  }
  if (status.select?.name !== "公開") return null;
  try {
    const title = richText(
      notionTitlePropertySchema.parse(properties["タイトル"]).title,
    );
    const slug = slugSchema.parse(
      richText(notionTextPropertySchema.parse(properties.slug).rich_text),
    );
    const date = dateSchema.parse(
      notionDatePropertySchema.parse(properties["公開日"]).date.start,
    );
    const description = richText(
      notionTextPropertySchema.parse(properties["概要"]).rich_text,
    );
    const tags = notionTagsPropertySchema
      .parse(properties["タグ"])
      .multi_select.map((tag) => tag.name);
    return {
      id: uuid.parse(page.id),
      slug,
      title,
      description,
      date,
      // The existing presentation model requires a category; Notion tags remain unchanged.
      category: "tech" as const,
      tags,
      published: true as const,
      publishedAt: `${date}T00:00:00+09:00`,
    };
  } catch {
    throw new PublicationError(
      "公開記事のタイトル・slug・公開日・タグ・概要を確認してください。",
    );
  }
}
