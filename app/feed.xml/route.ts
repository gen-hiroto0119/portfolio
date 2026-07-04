import { getAllPosts } from "@/lib/content";
import { site } from "@/lib/site";
import { escapeXml } from "@/lib/xml";

function toRssDate(date: string): string {
  return new Date(`${date}T00:00:00+09:00`).toUTCString();
}

export async function GET() {
  const posts = await getAllPosts();

  const items = posts
    .map((post) => {
      const link = `${site.url}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${toRssDate(post.date)}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${site.name} — Blog`)}</title>
    <link>${escapeXml(`${site.url}/blog`)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>ja</language>
    <lastBuildDate>${toRssDate(posts[0]?.date ?? new Date().toISOString().slice(0, 10))}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
