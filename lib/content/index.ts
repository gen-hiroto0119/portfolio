import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import {
  prepareContentImages,
  resolveCoverImageUrl,
} from "@/lib/content/attachments";
import {
  parseBlogFrontmatter,
  parseIdeaFrontmatter,
  type BlogPost,
  type BlogPostWithContent,
  type IdeaNote,
  type IdeaNoteWithContent,
} from "@/lib/content/schema";

const CONTENT_ROOT = path.join(process.cwd(), "content");

const BLOG_DIR = path.join(CONTENT_ROOT, "blog");
const IDEA_DIR = path.join(CONTENT_ROOT, "idea");

async function readMdxFiles(directory: string): Promise<
  Array<{
    slug: string;
    filePath: string;
    content: string;
    data: Record<string, unknown>;
  }>
> {
  let entries: string[];

  try {
    entries = await fs.readdir(directory);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }

  const files = entries.filter((entry) => entry.endsWith(".mdx"));

  return Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(directory, fileName);
      const raw = await fs.readFile(filePath, "utf8");
      const { content, data } = matter(raw);

      return {
        slug: fileName.replace(/\.mdx$/, ""),
        filePath,
        content,
        data: data as Record<string, unknown>,
      };
    }),
  );
}

function compareByDateDesc(
  leftDate: string,
  rightDate: string,
): number {
  return rightDate.localeCompare(leftDate);
}

function isPublished<T extends { published: boolean }>(item: T): boolean {
  return item.published;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const files = await readMdxFiles(BLOG_DIR);

  const posts = await Promise.all(
    files.map(async (file) => {
      const frontmatter = parseBlogFrontmatter(file.data, file.filePath);
      const coverUrl = await resolveCoverImageUrl(frontmatter.cover);

      return {
        slug: file.slug,
        ...frontmatter,
        ...(coverUrl ? { coverUrl } : {}),
      };
    }),
  );

  return posts
    .filter(isPublished)
    .sort((left, right) => compareByDateDesc(left.date, right.date));
}

export async function getAllIdeas(): Promise<IdeaNote[]> {
  const files = await readMdxFiles(IDEA_DIR);

  return files
    .map((file) => ({
      slug: file.slug,
      ...parseIdeaFrontmatter(file.data, file.filePath),
    }))
    .filter(isPublished)
    .sort((left, right) =>
      compareByDateDesc(left.tended, right.tended),
    );
}

export async function getPost(slug: string): Promise<BlogPostWithContent | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const { content, data } = matter(raw);
    const frontmatter = parseBlogFrontmatter(data, filePath);
    const [resolvedContent, coverUrl] = await Promise.all([
      prepareContentImages(content),
      resolveCoverImageUrl(frontmatter.cover),
    ]);
    const post = {
      slug,
      content: resolvedContent,
      ...frontmatter,
      ...(coverUrl ? { coverUrl } : {}),
    };

    return post.published ? post : null;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}

export async function getIdea(
  slug: string,
): Promise<IdeaNoteWithContent | null> {
  const filePath = path.join(IDEA_DIR, `${slug}.mdx`);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const { content, data } = matter(raw);
    const frontmatter = parseIdeaFrontmatter(data, filePath);
    const resolvedContent = await prepareContentImages(content);
    const note = {
      slug,
      content: resolvedContent,
      ...frontmatter,
    };

    return note.published ? note : null;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}
