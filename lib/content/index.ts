import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import {
  parseBlogFrontmatter,
  parseGardenFrontmatter,
  parseWorksFrontmatter,
  type BlogPost,
  type BlogPostWithContent,
  type GardenNote,
  type GardenNoteWithContent,
  type Work,
  type WorkWithContent,
} from "@/lib/content/schema";

const CONTENT_ROOT = path.join(process.cwd(), "content");

const BLOG_DIR = path.join(CONTENT_ROOT, "blog");
const WORKS_DIR = path.join(CONTENT_ROOT, "works");
const GARDEN_DIR = path.join(CONTENT_ROOT, "garden");

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

  return files
    .map((file) => ({
      slug: file.slug,
      ...parseBlogFrontmatter(file.data, file.filePath),
    }))
    .filter(isPublished)
    .sort((left, right) => compareByDateDesc(left.date, right.date));
}

export async function getAllWorks(): Promise<Work[]> {
  const files = await readMdxFiles(WORKS_DIR);

  return files
    .map((file) => ({
      slug: file.slug,
      ...parseWorksFrontmatter(file.data, file.filePath),
    }))
    .filter(isPublished)
    .sort((left, right) => {
      if (left.featured !== right.featured) {
        return left.featured ? -1 : 1;
      }
      return compareByDateDesc(left.date, right.date);
    });
}

export async function getAllNotes(): Promise<GardenNote[]> {
  const files = await readMdxFiles(GARDEN_DIR);

  return files
    .map((file) => ({
      slug: file.slug,
      ...parseGardenFrontmatter(file.data, file.filePath),
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
    const post = {
      slug,
      content,
      ...parseBlogFrontmatter(data, filePath),
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

export async function getWork(slug: string): Promise<WorkWithContent | null> {
  const filePath = path.join(WORKS_DIR, `${slug}.mdx`);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const { content, data } = matter(raw);
    const work = {
      slug,
      content,
      ...parseWorksFrontmatter(data, filePath),
    };

    return work.published ? work : null;
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

export async function getNote(
  slug: string,
): Promise<GardenNoteWithContent | null> {
  const filePath = path.join(GARDEN_DIR, `${slug}.mdx`);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const { content, data } = matter(raw);
    const note = {
      slug,
      content,
      ...parseGardenFrontmatter(data, filePath),
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
