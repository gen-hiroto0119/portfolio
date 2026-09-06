import { AboutSection } from "@/components/home/about-section";
import { FeaturedWorks } from "@/components/home/featured-works";
import { Hero } from "@/components/home/hero";
import { WritingSection } from "@/components/home/writing-section";
import { getAllWorks } from "@/app/works/_lib/get-works";
import { getAllPosts } from "@/lib/content";

export default async function Home() {
  const works = await getAllWorks();
  return (
    <div className="mx-auto w-full max-w-4xl px-6 pb-28 sm:px-10">
      <Hero />
      <div className="space-y-20 sm:space-y-24">
        <AboutSection />
        <FeaturedWorks works={works} />
        <Suspense fallback={<PostListLoading />}>
          <LatestWriting />
        </Suspense>
      </div>
    </div>
  );
}

async function LatestWriting() {
  const posts = await getAllPosts();
  return <WritingSection posts={posts} />;
}
import { Suspense } from "react";

import { PostListLoading } from "@/components/blog/post-loading";
