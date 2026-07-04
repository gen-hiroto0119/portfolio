import { notFound } from "next/navigation";

import {
  createOgImage,
  ogImageContentType,
  ogImageSize,
} from "@/lib/og/create-og-image";
import { getWork } from "@/lib/content";

export const alt = "Case study";
export const size = ogImageSize;
export const contentType = ogImageContentType;

type WorkOgImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: WorkOgImageProps) {
  const { slug } = await params;
  const work = await getWork(slug);

  if (!work) {
    notFound();
  }

  return createOgImage({
    label: "Case Study",
    title: work.title,
  });
}
