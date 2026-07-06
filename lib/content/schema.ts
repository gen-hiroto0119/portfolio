import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date format");

const publishedSchema = z.boolean().default(true);

export const blogCategorySchema = z.enum(["tech", "photo", "daily"]);

export type BlogCategory = z.infer<typeof blogCategorySchema>;

export const blogFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: dateStringSchema,
  category: blogCategorySchema.default("tech"),
  tags: z.array(z.string()),
  published: publishedSchema,
});

export const worksFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: dateStringSchema,
  role: z.string().min(1),
  stack: z.array(z.string()),
  client: z.string().optional(),
  challenge: z.string().min(1),
  outcome: z.string().min(1),
  metrics: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
      }),
    )
    .optional(),
  links: z
    .array(
      z.object({
        label: z.string().min(1),
        href: z.string().url(),
      }),
    )
    .optional(),
  featured: z.boolean().default(false),
  published: publishedSchema,
});

export const gardenFrontmatterSchema = z.object({
  title: z.string().min(1),
  planted: dateStringSchema,
  tended: z.string().min(1),
  status: z.enum(["seedling", "budding", "evergreen"]),
  tags: z.array(z.string()),
  // Slugs of explicitly connected notes (idea graph edges).
  related: z.array(z.string()).default([]),
  published: publishedSchema,
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;
export type WorksFrontmatter = z.infer<typeof worksFrontmatterSchema>;
export type GardenFrontmatter = z.infer<typeof gardenFrontmatterSchema>;

export type BlogPost = BlogFrontmatter & {
  slug: string;
};

export type Work = WorksFrontmatter & {
  slug: string;
};

export type GardenNote = GardenFrontmatter & {
  slug: string;
};

export type BlogPostWithContent = BlogPost & {
  content: string;
};

export type WorkWithContent = Work & {
  content: string;
};

export type GardenNoteWithContent = GardenNote & {
  content: string;
};

export type ContentKind = "blog" | "works" | "garden";

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

export function parseWorksFrontmatter(
  data: unknown,
  filePath: string,
): WorksFrontmatter {
  const result = worksFrontmatterSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid works frontmatter in ${filePath}: ${formatZodError(result.error)}`,
    );
  }
  return result.data;
}

export function parseGardenFrontmatter(
  data: unknown,
  filePath: string,
): GardenFrontmatter {
  const result = gardenFrontmatterSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid garden frontmatter in ${filePath}: ${formatZodError(result.error)}`,
    );
  }
  return result.data;
}
