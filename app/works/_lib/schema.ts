import { z } from "zod";

import { calendarDateSchema } from "@/lib/content/calendar-date";

const publishedSchema = z.boolean().default(true);

export const workSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  date: calendarDateSchema,
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

export type Work = z.infer<typeof workSchema>;

export type WorkWithContent = Work & {
  content: string;
};

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

export function parseWork(data: unknown, source: string): Work {
  const result = workSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid work entry in ${source}: ${formatZodError(result.error)}`);
  }
  return result.data;
}
