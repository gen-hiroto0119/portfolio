"use client";
import { useLocale } from "@/components/i18n/locale-provider";

export function Hero() {
  const { t } = useLocale();
  return (
    <section className="pb-20 pt-20 sm:pb-24 sm:pt-28">
      <h1 className="text-4xl font-medium tracking-[-0.045em] sm:text-5xl">Hiroto Furugen<span className="text-muted-foreground">.</span></h1>
      <p className="mt-7 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">{t.hero.tagline}</p>
    </section>
  );
}
