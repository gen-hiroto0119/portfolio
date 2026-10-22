import { loadPublishedSnapshot } from "./repository";
import { slugSchema } from "./schema";
import type { BlogPost, BlogPostWithContent } from "./domain";

export async function getAllPosts(): Promise<BlogPost[]> {
  const snapshot = await loadPublishedSnapshot();
  return [...(snapshot?.posts ?? [])]
    .filter((post) => post.published)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      category: post.category,
      tags: post.tags,
      published: post.published,
      publishedAt: post.publishedAt,
      updatedAt: post.sourceEditedAt,
    }));
}

export async function getPost(
  slug: string,
): Promise<BlogPostWithContent | null> {
  if (!slugSchema.safeParse(slug).success) return null;
  const snapshot = await loadPublishedSnapshot();
  const post = snapshot?.posts.find(
    (item) => item.slug === slug && item.published,
  );
  if (!post) return null;
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    category: post.category,
    tags: post.tags,
    published: post.published,
    publishedAt: post.publishedAt,
    updatedAt: post.sourceEditedAt,
    body: post.body,
  };
}
