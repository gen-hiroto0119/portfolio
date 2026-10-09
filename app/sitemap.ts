import type { MetadataRoute } from "next";

import { getAllPosts } from "@/lib/content";
import { site } from "@/lib/site";

const staticRoutes: MetadataRoute.Sitemap = [
  { url: site.url, changeFrequency: "weekly", priority: 1 },
  { url: `${site.url}/blog`, changeFrequency: "weekly", priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes];
}
