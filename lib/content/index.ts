import "server-only";

import { unstable_cache } from "next/cache";

import { getPublishedPost, listPublishedPosts } from "@/lib/cms/posts";
import type { BlogPost, BlogPostWithContent } from "@/lib/content/schema";

const cmsPosts = unstable_cache(listPublishedPosts, ["cms-blog-list"], { tags: ["cms-blog"], revalidate: 300 });
const cmsPost = unstable_cache(getPublishedPost, ["cms-blog-post"], { tags: ["cms-blog"], revalidate: 300 });

export async function getAllPosts(): Promise<BlogPost[]> {
  return cmsPosts();
}

export async function getPost(slug: string): Promise<BlogPostWithContent | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return cmsPost(slug);
}
