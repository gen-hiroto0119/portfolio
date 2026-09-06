"use client";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useCommandPalette } from "@/components/command-palette/command-palette-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navItems } from "@/lib/site";

export function HeaderNav() {
  return <Suspense fallback={<Navigation />}><ActiveNavigation /></Suspense>;
}

function ActiveNavigation() {
  const pathname = usePathname();
  return <Navigation pathname={pathname} />;
}

function Navigation({ pathname = "" }: { pathname?: string }) {
  const { openPalette } = useCommandPalette();
  const { t } = useLocale();
  return (
    <nav className="flex items-center gap-5" aria-label="メインナビゲーション">
      <div className="hidden items-center gap-5 md:flex">
        {navItems.filter(item => ['/works', '/blog', '/about'].includes(item.href)).map(item => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`text-sm transition-colors hover:text-foreground ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</Link>;
        })}
      </div>
      <div className="flex items-center gap-0.5">
        <button type="button" className="icon-button" aria-label={t.nav.openCommandPalette} onClick={openPalette}><Search size={16} strokeWidth={1.5} aria-hidden /></button>
        <div className="hidden md:contents"><LocaleToggle /><ThemeToggle /></div>
        <MobileMenu pathname={pathname} />
      </div>
    </nav>
  );
}
