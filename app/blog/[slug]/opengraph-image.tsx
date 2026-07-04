import { notFound } from "next/navigation";

import {
  createOgImage,
  ogImageContentType,
  ogImageSize,
} from "@/lib/og/create-og-image";
import { getPost } from "@/lib/content";

export const alt = "Blog post";
export const size = ogImageSize;
export const contentType = ogImageContentType;

type BlogOgImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: BlogOgImageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return createOgImage({
    label: "Blog",
    title: post.title,
  });
}
