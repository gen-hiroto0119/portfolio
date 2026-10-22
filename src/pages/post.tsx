import { TiptapContent } from "@/components/blog/tiptap-content";
import type { BlogPostWithContent } from "@/feature/posts/domain";

export function PostDetail({ post }: { post: BlogPostWithContent }) {
  return (
    <>
      <main id="main" class="portfolio-main">
        <a href="/blog">← Blog</a>
        <article class="portfolio-article">
          <header class="portfolio-articleHeading">
            <h1>{post.title}</h1>
            <time dateTime={post.date}>{post.date.replaceAll("-", ".")}</time>
          </header>
          <div class="portfolio-articleBody">
            <TiptapContent document={post.body} />
          </div>
        </article>
        <a href="/blog">← 記事一覧に戻る</a>
      </main>
    </>
  );
}
