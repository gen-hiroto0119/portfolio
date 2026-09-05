import Link from "next/link";

import type { Work } from "@/app/works/_lib/schema";

type WorkCardProps = {
  work: Work;
  index: number;
};

export function WorkCard({ work }: WorkCardProps) {
  return (
    <Link
      href={`/works/${work.slug}`}
      className="group block py-8 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
    >
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="min-w-0 text-xl leading-relaxed font-medium tracking-tight group-hover:underline group-hover:underline-offset-4">
          {work.title}
        </h2>
        {work.date ? (
          <time dateTime={work.date} className="shrink-0 text-sm text-muted-foreground">
            {work.date.slice(0, 4)}
          </time>
        ) : null}
      </div>
      <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
        {work.description}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{work.role}</p>
    </Link>
  );
}

export function WorkCardList({ works }: { works: Work[] }) {
  return (
    <div className="mx-auto w-full max-w-4xl divide-y divide-border px-6 pb-24 sm:px-8">
      {works.map((work, index) => (
        <WorkCard key={work.slug} work={work} index={index} />
      ))}
    </div>
  );
}
