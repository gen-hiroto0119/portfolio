import { z } from "zod";

import type { TiptapDocument } from "@/lib/cms/document";

export const blogCategorySchema = z.enum(["tech", "photo", "daily"]);

export type BlogCategory = z.infer<typeof blogCategorySchema>;
export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: BlogCategory;
  tags: string[];
  published: true;
  publishedAt: string;
};
export type BlogPostWithContent = BlogPost & { body: TiptapDocument };
