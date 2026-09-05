import Link from "next/link";
import { HeaderNav } from "@/components/layout/header-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 w-full max-w-4xl items-center justify-between gap-5 px-6 sm:px-10">
        <Link href="/" className="shrink-0 text-sm font-medium tracking-tight">Hiroto Furugen</Link>
        <HeaderNav />
      </div>
    </header>
  );
}
