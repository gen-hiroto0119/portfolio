import { z } from "zod";
import { parseTiptapDocument } from "@/lib/cms/document";
import { assetSchema, uuid } from "@/feature/media/schema";

export const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
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
export const snapshotSchema = z
  .object({
    version: z.literal(1),
    generation: uuid,
    posts: z.array(postSchema).max(1000),
    garbage: z.array(assetSchema),
  })
  .superRefine((snapshot, ctx) => {
    for (const field of ["id", "slug"] as const) {
      if (
        new Set(snapshot.posts.map((post) => post[field])).size !==
        snapshot.posts.length
      ) {
        ctx.addIssue({ code: "custom", message: `Duplicate post ${field}` });
      }
    }
    for (const asset of [
      ...snapshot.posts.flatMap((post) => post.assets),
      ...snapshot.garbage,
    ]) {
      if (asset.pathname !== `blog/assets/${asset.id}`) {
        ctx.addIssue({ code: "custom", message: "Invalid asset path" });
      }
    }
  });
