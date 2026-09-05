import Link from "next/link";

import { CategoryLabel } from "@/components/blog/category-label";
import type { BlogPost } from "@/lib/content/schema";

type PostRowProps = {
  post: BlogPost;
};

function PostRow({ post }: PostRowProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid gap-3 py-8 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-8"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 pt-1 sm:flex-col">
        <time dateTime={post.date} className="text-sm text-muted-foreground">
          {post.date}
        </time>
        <CategoryLabel category={post.category} />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl leading-relaxed font-medium tracking-tight group-hover:underline group-hover:underline-offset-4">
          {post.title}
        </h2>
        <p className="mt-2 text-base leading-7 text-muted-foreground">{post.description}</p>
        {post.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {post.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

type PostListProps = {
  posts: BlogPost[];
  embedded?: boolean;
};

export function PostList({ posts, embedded = false }: PostListProps) {
  return (
    <nav
      aria-label="記事一覧"
      className={embedded
        ? "w-full divide-y divide-border"
        : "mx-auto w-full max-w-4xl divide-y divide-border px-6 pb-24 sm:px-8"}
    >
      {posts.map((post) => (
        <PostRow key={post.slug} post={post} />
      ))}
    </nav>
  );
}
