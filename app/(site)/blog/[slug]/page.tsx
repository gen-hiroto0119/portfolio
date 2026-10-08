import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";

import { PostDetail } from "@/components/blog/post-detail";
import { getPost } from "@/lib/content";
import { site } from "@/lib/site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `${site.url}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  return <PublishedArticle slug={slug} />;
}

async function PublishedArticle({ slug }: { slug: string }) {
  "use cache";
  cacheLife("blog");
  // Inherits cms-blog from getPost, including the rendered syntax highlighting.
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return <PostDetail post={post} />;
}
