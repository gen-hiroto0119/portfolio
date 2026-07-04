import type { Metadata } from "next";

import { PostListFiltered } from "@/components/blog/post-list-filtered";
import { SectionPageHeader } from "@/components/blog/section-page-header";
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
        description="技術記事、写真、日々のメモ。かたちの違う言葉をここに置いています。"
      />
      <PostListFiltered posts={posts} />
    </>
  );
}
