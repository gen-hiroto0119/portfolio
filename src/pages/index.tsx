import { Hono } from "hono";

import HomePage from "./home";
import BlogPage from "./blog";
import { PostDetail } from "./post";
import { Layout } from "./layout";
import NotFoundPage from "./not-found";
import { getAllPosts, getPost } from "@/feature/posts/service";
import { rssLastBuildDate } from "@/lib/content/rss";
import { site } from "@/lib/site";
import { escapeXml } from "@/lib/xml";

const pages = new Hono()
  .get("/", async (c) => {
    const posts = await getAllPosts();
    return c.html(
      <Layout path="/">
        <HomePage posts={posts} />
      </Layout>,
    );
  })
  .get("/blog", async (c) => {
    const posts = await getAllPosts();
    return c.html(
      <Layout
        path="/blog"
        title="Blog"
        description="開発やデザインについて、考えたこと。"
      >
        <BlogPage posts={posts} />
      </Layout>,
    );
  })
  .get("/blog/:slug", async (c) => {
    // One read provides both the metadata and body for this response.
    const post = await getPost(c.req.param("slug"));
    if (!post) {
      return c.html(
        <Layout path={c.req.path} title="記事が見つかりませんでした" noindex>
          <NotFoundPage article />
        </Layout>,
        404,
      );
    }
    return c.html(
      <Layout
        path={`/blog/${post.slug}`}
        title={post.title}
        description={post.description}
        article={{ date: post.publishedAt, updatedAt: post.updatedAt }}
      >
        <PostDetail post={post} />
      </Layout>,
    );
  })
  .get("/opengraph-image", async () => {
    const { createPortfolioImage } =
      await import("@/lib/og/create-portfolio-image");
    return createPortfolioImage({
      label: "Portfolio",
      title: `${site.name} — Portfolio`,
    });
  })
  .get("/blog/:slug/opengraph-image", async (c) => {
    const post = await getPost(c.req.param("slug"));
    if (!post) return c.text("Not Found", 404);
    const { createPortfolioImage } =
      await import("@/lib/og/create-portfolio-image");
    return createPortfolioImage({ label: "Blog", title: post.title });
  })
  .get("/feed.xml", async () => {
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
      <pubDate>${new Date(`${post.date}T00:00:00+09:00`).toUTCString()}</pubDate>
    </item>`;
      })
      .join("\n");
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${site.name} — Blog`)}</title>
    <link>${escapeXml(`${site.url}/blog`)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>ja</language>
${lastBuildDate ? `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>`,
      {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  })
  .get("/sitemap.xml", async () => {
    const posts = await getAllPosts();
    const routes = [
      { url: site.url, frequency: "weekly", priority: 1 },
      { url: `${site.url}/blog`, frequency: "weekly", priority: 0.9 },
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
      {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  })
  .get("/robots.txt", (c) =>
    c.text(`User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`),
  );

export default pages;
