import type { z } from "zod";
import type { TiptapDocument } from "@/lib/cms/document";
import type { snapshotSchema } from "./schema";

export type Snapshot = z.infer<typeof snapshotSchema>;
export type SnapshotRead = { snapshot: Snapshot; etag: string | null };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: "tech" | "photo" | "daily";
  tags: string[];
  published: true;
  publishedAt: string;
  updatedAt: string;
};
export type BlogPostWithContent = BlogPost & { body: TiptapDocument };
