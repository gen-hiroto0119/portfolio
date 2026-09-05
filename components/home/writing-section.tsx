"use client";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { SectionLabel } from "@/components/home/section-label";
import type { BlogPost } from "@/lib/content/schema";

export function WritingSection({ posts }: { posts: BlogPost[] }) {
  const { t, locale } = useLocale();
  return (
    <section className="grid gap-x-12 sm:grid-cols-[8rem_1fr]">
      <SectionLabel>{locale === "ja" ? "書いたこと" : "Writing"}</SectionLabel>
      <div>
        <ul className="mb-6 space-y-6">
          {posts.slice(0, 3).map(post => (
            <li key={post.slug}><Link href={`/blog/${post.slug}`} className="group block">
              <h3 className="text-[15px] leading-7 group-hover:underline group-hover:underline-offset-4">{post.title}</h3>
              <time dateTime={post.date} className="mt-2 block text-xs text-muted-foreground">{post.date.replaceAll('-', '.')}</time>
            </Link></li>
          ))}
        </ul>
        <Link href="/blog" className="text-sm underline decoration-border underline-offset-4 hover:decoration-foreground">{t.home.allPosts}</Link>
      </div>
    </section>
  );
}
