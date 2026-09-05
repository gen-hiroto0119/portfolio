"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import { SectionLabel } from "@/components/home/section-label";
import type { Work } from "@/app/works/_lib/schema";

export function FeaturedWorks({ works }: { works: Work[] }) {
  const { t, locale } = useLocale();
  return (
    <section className="grid gap-x-12 sm:grid-cols-[8rem_1fr]">
      <SectionLabel>{locale === "ja" ? "つくったもの" : "Selected work"}</SectionLabel>
      <div>
        <ul className="divide-y divide-border">
          {works.slice(0, 3).map(work => (
            <li key={work.slug} className="pt-7 first:pt-0">
              <Link href={`/works/${work.slug}`} className="group block pb-7 pt-1">
                <div className="flex items-baseline justify-between gap-4"><h3 className="text-xl font-medium tracking-tight">{work.title}</h3><ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{work.description}</p>
                <p className="mt-4 text-xs text-muted-foreground">{work.role}{work.date ? ` · ${work.date.slice(0, 4)}` : ""}</p>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/works" className="text-sm underline decoration-border underline-offset-4 hover:decoration-foreground">{t.home.allWorks}</Link>
      </div>
    </section>
  );
}
