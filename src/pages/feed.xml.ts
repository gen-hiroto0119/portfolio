import type { APIRoute } from "astro";
import { getAllPosts } from "@/feature/posts/service";
import { rssLastBuildDate } from "@/lib/content/rss";
import { site } from "@/lib/site";
import { escapeXml } from "@/lib/xml";

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();
  const lastBuildDate = rssLastBuildDate(posts);
  const items = posts
    .map((post) => {
      const link = `${site.url}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${site.name} — Blog`)}</title>
    <link>${escapeXml(site.url)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>ja</language>
${lastBuildDate ? `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
