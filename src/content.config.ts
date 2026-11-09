import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

export const collections = {
  blog: defineCollection({
    loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
    schema: z.object({
      title: z.string().trim().min(1).max(300),
      description: z.string().trim().min(1).max(2000),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string().max(100)).default([]),
    }),
  }),
};
