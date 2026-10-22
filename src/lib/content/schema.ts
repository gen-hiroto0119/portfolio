import type { TiptapDocument } from "@/lib/cms/document";

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
