import { site } from '@/lib/site';
import { escapeXml } from '@/lib/xml';
import { contentForRequest } from '@/lib/content';
export async function GET() {
  const posts = await contentForRequest().getAllPosts();
  const paths = ['/', '/blog', ...posts.map(post => `/blog/${post.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escapeXml(new URL(path, site.url).href)}</loc></url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
}
