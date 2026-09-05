"use client";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { SectionLabel } from "@/components/home/section-label";

export function AboutSection() {
  const { t, locale } = useLocale();
  return (
    <section className="grid gap-x-12 sm:grid-cols-[8rem_1fr]">
      <SectionLabel>{locale === "ja" ? "私について" : "About"}</SectionLabel>
      <div className="space-y-5 text-[15px] leading-8">
        <p>{t.home.about.p1}</p>
        <p className="text-muted-foreground">{t.home.about.p2}</p>
        <Link href="/about" className="inline-block text-sm underline decoration-border underline-offset-4 hover:decoration-foreground">{t.home.about.link}</Link>
      </div>
    </section>
  );
}
