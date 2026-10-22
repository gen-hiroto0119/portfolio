import type { APIRoute } from 'astro';
import { contentForRequest } from '@/lib/content';
import { createPortfolioImage } from '@/lib/og/create-portfolio-image';
export const GET: APIRoute = async ({ params }) => {
  const post = await contentForRequest().getPost(params.slug ?? '');
  if (!post) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return createPortfolioImage({ title: post.title, noStore: true });
};
