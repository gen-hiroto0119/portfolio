"use client";
import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navItems } from "@/lib/site";

export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="icon-button md:hidden" aria-label={t.nav.openMenu}><Menu size={18} strokeWidth={1.5} aria-hidden /></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-background px-7 py-6 shadow-xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-sm font-medium">メニュー</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label={t.nav.closeMenu}><X size={18} aria-hidden /></Dialog.Close>
          </div>
          <nav className="mt-10 flex flex-1 flex-col gap-7" aria-label="モバイルナビゲーション">
            {navItems.map(item => <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? 'page' : undefined} className="text-xl tracking-tight" onClick={() => setOpen(false)}>{item.label}</Link>)}
          </nav>
          <div className="flex gap-3 border-t border-border pt-5"><LocaleToggle /><ThemeToggle /></div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
