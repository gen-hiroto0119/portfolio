import { z } from "zod";
import { parseTiptapDocument } from "@/lib/cms/document";

export const uuid = z.uuid().transform((id) => id.toLowerCase());
export const slugSchema = z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
export const assetSchema = z.object({
  id: uuid,
  pathname: z.string().regex(/^blog\/assets\/[0-9a-f-]{36}$/),
  contentType: z.enum(["image/png", "image/jpeg", "image/gif", "image/webp"]),
});
export const postSchema = z.object({
  id: uuid,
  slug: slugSchema,
  title: z.string().trim().min(1).max(300),
  description: z.string().max(2000),
  date: dateSchema,
  category: z.enum(["tech", "photo", "daily"]),
  tags: z.array(z.string().max(100)).max(100),
  published: z.literal(true),
  publishedAt: z.iso.datetime({ offset: true }),
  revision: z.number().int().nonnegative(),
  body: z.unknown().transform(parseTiptapDocument),
  assets: z.array(assetSchema),
  sourceEditedAt: z.string(),
});
export const snapshotSchema = z.object({
  version: z.literal(1),
  generation: uuid,
  posts: z.array(postSchema).max(1000),
  garbage: z.array(assetSchema),
}).superRefine((snapshot, ctx) => {
  for (const field of ["id", "slug"] as const) {
    if (new Set(snapshot.posts.map((post) => post[field])).size !== snapshot.posts.length) {
      ctx.addIssue({ code: "custom", message: `Duplicate post ${field}` });
    }
  }
  for (const asset of [...snapshot.posts.flatMap((post) => post.assets), ...snapshot.garbage]) {
    if (asset.pathname !== `blog/assets/${asset.id}`) {
      ctx.addIssue({ code: "custom", message: "Invalid asset path" });
    }
  }
});
export type PublishedAsset = z.infer<typeof assetSchema>;
export type PublishedPost = z.infer<typeof postSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type SnapshotRead = { snapshot: Snapshot; etag: string | null };

export class PublicationError extends Error {}
export class ConcurrentPublicationError extends Error {}

export type NotionPage = {
  id: string;
  last_edited_time: string;
  archived?: boolean;
  is_archived?: boolean;
  in_trash?: boolean;
  parent: { type: string; data_source_id?: string };
  properties: Record<string, unknown>;
};

function richText(value: unknown): string {
  return z.array(z.object({ type: z.enum(["text", "mention"]), plain_text: z.string() }).passthrough())
    .parse(value).map((item) => item.plain_text).join("");
}

export function pageMetadata(page: NotionPage, dataSourceId: string) {
  if (page.archived || page.is_archived || page.in_trash || page.parent.type !== "data_source_id" ||
      page.parent.data_source_id?.replaceAll("-", "").toLowerCase() !== dataSourceId.replaceAll("-", "").toLowerCase()) return null;
  const properties = page.properties;
  let status: { select: { name: string } | null };
  try {
    status = z.object({ type: z.literal("select"), select: z.object({ name: z.string() }).nullable() }).parse(properties["公開状態"]);
  } catch {
    throw new PublicationError("公開状態の形式を確認してください。");
  }
  if (status.select?.name !== "公開") return null;
  try {
    const title = richText(z.object({ title: z.unknown() }).parse(properties["タイトル"]).title);
    const slug = slugSchema.parse(richText(z.object({ rich_text: z.unknown() }).parse(properties.slug).rich_text));
    const date = dateSchema.parse(z.object({ date: z.object({ start: z.string() }) }).parse(properties["公開日"]).date.start);
    const description = richText(z.object({ rich_text: z.unknown() }).parse(properties["概要"]).rich_text);
    const tags = z.object({ multi_select: z.array(z.object({ name: z.string() })) }).parse(properties["タグ"]).multi_select.map((tag) => tag.name);
    return {
      id: uuid.parse(page.id), slug, title, description, date,
      // The existing presentation model requires a category; Notion tags remain unchanged.
      category: "tech" as const, tags, published: true as const,
      publishedAt: `${date}T00:00:00+09:00`,
    };
  } catch {
    throw new PublicationError("公開記事のタイトル・slug・公開日・タグ・概要を確認してください。");
  }
}
