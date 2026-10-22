import type { BlogPost } from "@/feature/posts/domain";

export function PostList({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;
  return (
    <ul class="portfolio-posts">
      {posts.map((post) => (
        <li key={post.slug}>
          <a href={`/blog/${post.slug}`} class="portfolio-postRow">
            <span>{post.title}</span>
            <time dateTime={post.date}>{post.date.replaceAll("-", ".")}</time>
          </a>
        </li>
      ))}
    </ul>
  );
}
