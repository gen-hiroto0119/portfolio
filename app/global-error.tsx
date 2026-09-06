"use client";

import { PageRecovery } from "@/components/page-recovery";
import "./globals.css";

export default function GlobalError({ retry }: { retry: () => void }) {
  return <html lang="ja"><body className="min-h-screen bg-background font-sans text-foreground"><PageRecovery retry={retry} /></body></html>;
}
