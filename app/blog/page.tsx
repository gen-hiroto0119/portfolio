import type { Metadata } from "next";
import { Suspense } from "react";

import { PostListLoading } from "@/components/blog/post-loading";
import { PostListFiltered } from "@/components/blog/post-list-filtered";
import { SectionPageHeader } from "@/components/blog/section-page-header";
import { getAllPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "技術の話を中心に、ときどき写真や日々のことも。",
};

export default function BlogPage() {
  return (
    <>
      <SectionPageHeader
        label="Blog"
        title="書いたこと"
        description="技術の話を中心に、ときどき写真や日々のことも。"
      />
      <Suspense fallback={<div className="mx-auto w-full max-w-4xl px-6 pb-24 sm:px-10"><PostListLoading /></div>}>
        <PublishedPosts />
      </Suspense>
    </>
  );
}

async function PublishedPosts() {
  const posts = await getAllPosts();
  return <PostListFiltered posts={posts} />;
}
