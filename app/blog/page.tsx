import type { Metadata } from "next";

import { PostListFiltered } from "@/components/blog/post-list-filtered";
import { SectionPageHeader } from "@/components/blog/section-page-header";
import { getAllPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "技術の話を中心に、ときどき写真や日々のことも。",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <SectionPageHeader
        label="Blog"
        title="書いたこと"
        description="技術の話を中心に、ときどき写真や日々のことも。"
      />
      <PostListFiltered posts={posts} />
    </>
  );
}
