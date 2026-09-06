import Link from "next/link";
import { cacheLife } from "next/cache";
import { SquarePen } from "lucide-react";
import { site } from "@/lib/site";

export async function Footer() {
  "use cache";
  cacheLife("days");
  return (
    <footer className="mt-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-6 px-6 pb-10 pt-12 text-xs text-muted-foreground sm:px-10">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <nav className="flex flex-wrap items-center gap-5" aria-label="フッター">
          <Link href="/lab" className="hover:text-foreground">Lab</Link>
          <Link href="/design" className="hover:text-foreground">Design</Link>
          <a href={site.socials.github} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub ↗</a>
          <a href={site.socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">LinkedIn ↗</a>
          <Link href="/admin" prefetch={false} aria-label="管理画面" title="管理画面" className="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
            <SquarePen size={16} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </footer>
  );
}
