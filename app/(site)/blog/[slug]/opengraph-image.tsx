import { notFound } from "next/navigation";
import { connection } from "next/server";

import {
  ogImageContentType,
  ogImageSize,
} from "@/lib/og/create-og-image";
import { getPost } from "@/lib/content";
import { createPortfolioImage } from "@/lib/og/create-portfolio-image";

export const alt = "Blog post";
export const size = ogImageSize;
export const contentType = ogImageContentType;

type BlogOgImageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateImageMetadata({ params }: BlogOgImageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  return post ? [{ id: String(post.revision), alt: post.title, size, contentType }] : [];
}

export default async function Image({ params, id }: BlogOgImageProps & { id: Promise<string> }) {
  await connection();
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || String(post.revision) !== await id) {
    notFound();
  }

  return createPortfolioImage({
    label: "Blog",
    title: post.title,
    noStore: true,
  });
}
