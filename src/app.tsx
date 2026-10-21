import { Hono } from "hono";
import type { Context } from "hono";

import { getAllPosts, getPost } from "@/lib/content";
import { rssLastBuildDate } from "@/lib/content/rss";
import { createPortfolioImage } from "@/lib/og/create-portfolio-image";
import { createBlogCacheInvalidationHandler } from "@/lib/publishing/cache-handler";
import { getMedia, readSnapshot } from "@/lib/publishing/blob";
import { createMediaHandler } from "@/lib/publishing/media-handler";
import { manualSync } from "@/lib/publishing/sync-route";
import { notionWebhook } from "@/lib/publishing/webhook-handler";
import { site } from "@/lib/site";
import { escapeXml } from "@/lib/xml";
import {
  ArticlePage, BlogPage, HomePage, NotFoundPage, RecoveryDocument, SiteDocument, SiteErrorPage,
  blogMeta, homeMeta, notFoundMeta, postMeta,
} from "@/src/site";

const app = new Hono();
const invalidateBlog = createBlogCacheInvalidationHandler();
const media = createMediaHandler(readSnapshot, getMedia);

function page(c: Context, node: unknown, status: 200 | 404 | 500 = 200) {
  return c.html(String(node), status, { "Cache-Control": "private, no-store" });
}

function xml(body: string, contentType: string) {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}

function toRssDate(date: string) {
  return new Date(`${date}T00:00:00+09:00`).toUTCString();
}

app.post("/api/notion/revalidate", (c) => invalidateBlog(c.req.raw));
app.post("/api/notion/sync", (c) => manualSync(c.req.raw));
app.post("/api/notion/webhook/:key", (c) => notionWebhook(c.req.raw, {
  params: Promise.resolve({ key: c.req.param("key") }),
}));
app.get("/media/:assetId", (c) => media(c.req.raw, {
  params: Promise.resolve({ assetId: c.req.param("assetId") }),
}));

app.get("/feed.xml", async () => {
  const posts = await getAllPosts();
  const lastBuildDate = rssLastBuildDate(posts);
  const items = posts.map((post) => {
    const link = `${site.url}/blog/${post.slug}`;
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${toRssDate(post.date)}</pubDate>
    </item>`;
  }).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${site.name} — Blog`)}</title>
    <link>${escapeXml(`${site.url}/blog`)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>ja</language>
${lastBuildDate ? `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>`;
  return xml(body, "application/xml; charset=utf-8");
});

app.get("/sitemap.xml", async () => {
  const posts = await getAllPosts();
  const urls = [
    { loc: site.url, changeFrequency: "weekly", priority: "1" },
    { loc: `${site.url}/blog`, changeFrequency: "weekly", priority: "0.9" },
    ...posts.map((post) => ({
      loc: `${site.url}/blog/${post.slug}`,
      changeFrequency: "monthly",
      priority: "0.8",
      lastModified: post.date,
    })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${"lastModified" in url ? `<lastmod>${escapeXml(url.lastModified)}</lastmod>` : ""}
    <changefreq>${url.changeFrequency}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
  return xml(body, "application/xml; charset=utf-8");
});

app.get("/robots.txt", () => xml(`User-Agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`, "text/plain; charset=utf-8"));

app.get("/opengraph-image", () => createPortfolioImage({
  label: "Portfolio",
  title: `${site.name} — Portfolio`,
}));

app.get("/blog/:slug/opengraph-image", async (c) => {
  const post = await getPost(c.req.param("slug"));
  if (!post) return c.body(null, 404, { "Cache-Control": "private, no-store" });
  return createPortfolioImage({ label: "Blog", title: post.title, noStore: true });
});

app.get("/", async (c) => {
  try {
    const posts = await getAllPosts();
    return page(c, <SiteDocument meta={homeMeta()} pathname="/"><HomePage posts={posts} /></SiteDocument>);
  } catch (error) {
    console.error(error);
    return page(c, <SiteDocument meta={notFoundMeta()} pathname="/"><SiteErrorPage path="/" /></SiteDocument>, 500);
  }
});

app.get("/blog", async (c) => {
  try {
    const posts = await getAllPosts();
    return page(c, <SiteDocument meta={blogMeta()} pathname="/blog"><BlogPage posts={posts} /></SiteDocument>);
  } catch (error) {
    console.error(error);
    return page(c, <SiteDocument meta={notFoundMeta()} pathname="/blog"><SiteErrorPage path="/blog" /></SiteDocument>, 500);
  }
});

app.get("/blog/:slug", async (c) => {
  const slug = c.req.param("slug");
  const path = `/blog/${slug}`;
  try {
    const post = await getPost(slug);
    if (!post) return page(c, <SiteDocument meta={notFoundMeta()} pathname={path}><NotFoundPage /></SiteDocument>, 404);
    return page(c, <SiteDocument meta={postMeta(post)} pathname={path}><ArticlePage post={post} /></SiteDocument>);
  } catch (error) {
    console.error(error);
    return page(c, <SiteDocument meta={notFoundMeta()} pathname={path}><SiteErrorPage path={path} /></SiteDocument>, 500);
  }
});

app.notFound((c) => page(c, <SiteDocument meta={notFoundMeta()} pathname={c.req.path}><NotFoundPage /></SiteDocument>, 404));
app.onError((error, c) => {
  console.error(error);
  return page(c, <RecoveryDocument />, 500);
});

export default app;
