import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchablePosts } from "@/components/portfolio/searchable-posts";
import { PortfolioHeader, PortfolioFooter } from "@/components/portfolio/shell";
import { getAllPosts } from "@/lib/content";
import styles from "@/components/portfolio/portfolio.module.css";

export const metadata: Metadata = {
  title: "Blog",
  description: "開発やデザインについて、考えたこと。",
  alternates: { canonical: "/blog" },
};

async function PublishedPosts() {
  return <SearchablePosts posts={await getAllPosts()} />;
}

export default function BlogPage() {
  return <>
    <PortfolioHeader />
    <main id="main" className={styles.main}>
      <header className={styles.blogHeading}><h1>Blog</h1><p>開発やデザインについて、考えたこと。</p></header>
      <section className={styles.section} aria-label="記事一覧">
        <Suspense fallback={<p role="status" className={styles.secondary}>記事を読み込んでいます…</p>}><PublishedPosts /></Suspense>
      </section>
    </main>
    <PortfolioFooter />
  </>;
}
