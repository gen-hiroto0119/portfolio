import type { MetadataRoute } from "next";

import { getAllIdeas, getAllPosts, getAllWorks } from "@/lib/content";
import { site } from "@/lib/site";

const staticRoutes: MetadataRoute.Sitemap = [
  { url: site.url, changeFrequency: "weekly", priority: 1 },
  { url: `${site.url}/works`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${site.url}/blog`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${site.url}/idea`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${site.url}/lab`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${site.url}/design`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [works, posts, notes] = await Promise.all([
    getAllWorks(),
    getAllPosts(),
    getAllIdeas(),
  ]);

  const workRoutes: MetadataRoute.Sitemap = works.map((work) => ({
    url: `${site.url}/works/${work.slug}`,
    lastModified: work.date,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const noteRoutes: MetadataRoute.Sitemap = notes.map((note) => ({
    url: `${site.url}/idea/${note.slug}`,
    lastModified: note.tended,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...workRoutes, ...postRoutes, ...noteRoutes];
}
