import Link from "next/link";
import type { ReactNode } from "react";

import type { Work } from "@/app/works/_lib/schema";

type WorkDetailProps = {
  work: Work;
  children: ReactNode;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export function WorkDetail({ work, children, prev, next }: WorkDetailProps) {
  const metaItems: Array<{ label: string; value: string }> = [
    { label: "担当", value: work.role },
    ...(work.client ? [{ label: "クライアント", value: work.client }] : []),
    ...(work.date ? [{ label: "公開日", value: work.date }] : []),
    { label: "使用技術", value: work.stack.join(" / ") },
  ];

  return (
    <article className="w-full px-6 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1 className="text-2xl leading-relaxed font-medium tracking-tight text-foreground sm:text-3xl">
            {work.title}
          </h1>
          <p className="mt-4 text-base leading-8 text-muted-foreground">{work.description}</p>
        </header>

        <dl className="mb-12 grid grid-cols-1 gap-x-8 gap-y-5 border-y border-border py-6 sm:grid-cols-2">
          {metaItems.map((item) => (
            <div key={item.label}>
              <dt className="mb-1 text-sm text-muted-foreground">{item.label}</dt>
              <dd className="text-sm leading-7 text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mb-12 w-full">
        {children}
      </div>

      <div className="mx-auto max-w-3xl">
        {work.links && work.links.length > 0 ? (
          <div className="mb-12 flex flex-wrap gap-x-6 gap-y-3">
            {work.links.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
                {link.label}
              </a>
            ))}
          </div>
        ) : null}

        <nav aria-label="前後の実績" className="grid grid-cols-2 gap-6 border-t border-border pt-7">
          {prev ? (
            <Link href={`/works/${prev.slug}`} className="group flex min-w-0 flex-col items-start gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
              <span className="text-sm text-muted-foreground">前の実績</span>
              <span className="text-base leading-7 text-foreground group-hover:underline group-hover:underline-offset-4">{prev.title}</span>
            </Link>
        ) : <div aria-hidden="true" />}
        {next ? (
          <Link href={`/works/${next.slug}`} className="group flex min-w-0 flex-col items-end gap-2 text-right focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
            <span className="text-sm text-muted-foreground">次の実績</span>
            <span className="text-base leading-7 text-foreground group-hover:underline group-hover:underline-offset-4">{next.title}</span>
          </Link>
        ) : <div aria-hidden="true" />}
      </nav>
      <Link href="/works" className="mt-10 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
        実績一覧へ
      </Link>
      </div>
    </article>
  );
}
