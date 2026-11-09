import type { CollectionEntry } from "astro:content";
import { getBlogEntries } from "./repository";
import { slugPattern, toDateString, type BlogPost } from "./domain";

function toPost(entry: CollectionEntry<"blog">): BlogPost {
  // The file name becomes the public URL, so reject names that are not URL-safe.
  if (!slugPattern.test(entry.id))
    throw new Error(`Invalid blog file name: ${entry.id}`);
  const date = toDateString(entry.data.date);
  const publishedAt = `${date}T00:00:00+09:00`;
  return {
    slug: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    date,
    tags: entry.data.tags,
    publishedAt,
    updatedAt: entry.data.updated
      ? `${toDateString(entry.data.updated)}T00:00:00+09:00`
      : publishedAt,
  };
}

export async function getPostEntries() {
  const entries = await getBlogEntries();
  return entries
    .map((entry) => ({ entry, post: toPost(entry) }))
    .sort((a, b) => b.post.date.localeCompare(a.post.date));
}

export async function getAllPosts(): Promise<BlogPost[]> {
  return (await getPostEntries()).map(({ post }) => post);
}
