import Link from "next/link";
import { TiptapContent } from "@/components/blog/tiptap-content";
import type { BlogPostWithContent } from "@/lib/content/schema";
import styles from "@/components/portfolio/portfolio.module.css";

export function PostDetail({ post }: { post: BlogPostWithContent }) {
  return <>
    <main id="main" className={styles.main}>
      <Link href="/blog">← Blog</Link>
      <article className={styles.article}>
        <header className={styles.articleHeading}>
          <h1>{post.title}</h1>
          <time dateTime={post.date}>{post.date.replaceAll("-", ".")}</time>
        </header>
        <div className={styles.articleBody}><TiptapContent document={post.body} /></div>
      </article>
      <Link href="/blog">← 記事一覧に戻る</Link>
    </main>
  </>;
}
