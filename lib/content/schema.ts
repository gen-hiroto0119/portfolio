import { z } from "zod";

import { calendarDateSchema } from "@/lib/content/calendar-date";

const publishedSchema = z.boolean().default(true);

export const blogCategorySchema = z.enum(["tech", "photo", "daily"]);

export type BlogCategory = z.infer<typeof blogCategorySchema>;

export const blogFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: calendarDateSchema,
  category: blogCategorySchema.default("tech"),
  tags: z.array(z.string()),
  published: publishedSchema,
});

export const ideaFrontmatterSchema = z.object({
  title: z.string().min(1),
  planted: calendarDateSchema,
  tended: calendarDateSchema,
  status: z.enum(["seedling", "budding", "evergreen"]),
  tags: z.array(z.string()),
  // Slugs of explicitly connected notes (idea graph edges).
  related: z.array(z.string()).default([]),
  published: publishedSchema,
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;
export type IdeaFrontmatter = z.infer<typeof ideaFrontmatterSchema>;

export type BlogPost = BlogFrontmatter & {
  slug: string;
};

export type IdeaNote = IdeaFrontmatter & {
  slug: string;
};

export type BlogPostWithContent = BlogPost & {
  content: string;
};

export type IdeaNoteWithContent = IdeaNote & {
  content: string;
};

export type ContentKind = "blog" | "idea";

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

export function parseBlogFrontmatter(
  data: unknown,
  filePath: string,
): BlogFrontmatter {
  const result = blogFrontmatterSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid blog frontmatter in ${filePath}: ${formatZodError(result.error)}`,
    );
  }
  return result.data;
}

export function parseIdeaFrontmatter(
  data: unknown,
  filePath: string,
): IdeaFrontmatter {
  const result = ideaFrontmatterSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid idea frontmatter in ${filePath}: ${formatZodError(result.error)}`,
    );
  }
  return result.data;
}
