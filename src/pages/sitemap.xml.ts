import type { APIRoute } from "astro";
import { getAllPosts } from "@/feature/posts/service";
import { site } from "@/lib/site";
import { escapeXml } from "@/lib/xml";

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();
  const routes = [
    { url: site.url, frequency: "weekly", priority: 1 },
    ...posts.map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      date: post.date,
      frequency: "monthly",
      priority: 0.8,
    })),
  ];
  const entries = routes
    .map(
      (route) =>
        `<url><loc>${escapeXml(route.url)}</loc>${"date" in route ? `<lastmod>${escapeXml(String(route.date))}</lastmod>` : ""}<changefreq>${route.frequency}</changefreq><priority>${route.priority}</priority></url>`,
    )
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
