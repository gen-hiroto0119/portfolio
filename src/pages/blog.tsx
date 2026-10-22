import { PostList } from "@/components/portfolio/post-list";
import type { BlogPost } from "@/feature/posts/domain";

export default function BlogPage({ posts }: { posts: BlogPost[] }) {
  return (
    <>
      <main id="main" class="portfolio-main">
        <header class="portfolio-blogHeading">
          <h1>Blog</h1>
        </header>
        <section class="portfolio-section" aria-label="記事一覧">
          <PostList posts={posts} />
        </section>
      </main>
    </>
  );
}
