import type { BlogPost } from "@/lib/content/schema";
import styles from "./portfolio.module.css";

export function PostList({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;
  return <ul className={styles.posts}>{posts.map((post) => (
    <li key={post.slug}><a href={`/blog/${post.slug}`} className={styles.postRow}>
      <span>{post.title}</span><time dateTime={post.date}>{post.date.replaceAll("-", ".")}</time>
    </a></li>
  ))}</ul>;
}
