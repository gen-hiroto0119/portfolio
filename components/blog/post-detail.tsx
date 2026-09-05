import Link from "next/link";
import { TiptapContent } from "@/components/blog/tiptap-content";

import { CategoryLabel } from "@/components/blog/category-label";
import type { BlogPostWithContent } from "@/lib/content/schema";

type PostDetailProps = {
  post: BlogPostWithContent;
};

export function PostDetail({ post }: PostDetailProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8 sm:py-24">
      <header className="mb-12">
        <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <time dateTime={post.date}>{post.date}</time>
          <CategoryLabel category={post.category} />
        </div>
        <h1 className="text-2xl leading-relaxed font-medium tracking-tight text-foreground sm:text-3xl">
          {post.title}
        </h1>
        {post.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
        ) : null}
      </header>
      <div className="mb-16 w-full">
        <TiptapContent document={post.body} />
      </div>
      <Link href="/blog" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
        記事一覧へ
      </Link>
    </article>
  );
}
