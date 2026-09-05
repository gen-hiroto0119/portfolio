import { z } from "zod";

import type { PublishedPost, PublishedPostSummary } from "@/lib/cms/posts";

export const blogCategorySchema = z.enum(["tech", "photo", "daily"]);

export type BlogCategory = z.infer<typeof blogCategorySchema>;
export type BlogPost = PublishedPostSummary;
export type BlogPostWithContent = PublishedPost;
