import Link from "next/link";
import type { BlogPost } from "@/lib/content/schema";
import styles from "./portfolio.module.css";

export function PostList({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return <div className={styles.empty}><p>まだ記事はありません。</p><p>新しい記事は、ここに追加していきます。</p></div>;
  return <ul className={styles.posts}>{posts.map((post) => (
    <li key={post.slug}><Link href={`/blog/${post.slug}`} className={styles.postRow}>
      <span>{post.title}</span><time dateTime={post.date}>{post.date.replaceAll("-", ".")}</time>
    </Link></li>
  ))}</ul>;
}
