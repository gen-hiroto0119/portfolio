import type { Metadata } from "next";

import { SectionPageHeader } from "@/components/blog/section-page-header";
import { PostList } from "@/components/blog/post-row";
import { getAllPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "デザイン、エンジニアリング、プロダクト思考に関するエッセイと長文。",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <SectionPageHeader
        label="Blog"
        title="考えを言葉に、言葉を設計に。"
        description="プロダクト開発の現場で得た学びや、デザインと技術の境界について書いています。"
      />
      <PostList posts={posts} />
    </>
  );
}
