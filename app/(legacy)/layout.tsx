import { Suspense } from "react";
import { FeedbackToasts } from "@/components/feedback-notice";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getContentCommandData } from "@/lib/content-commands";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme/theme-provider";

async function ContentCommands() {
  return <CommandPalette contentItems={await getContentCommandData()} />;
}

export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return <><FeedbackToasts /><ThemeProvider><LocaleProvider><CommandPaletteProvider>
    <Header /><main id="main" className="flex flex-1 flex-col">{children}</main><Footer />
    <Suspense fallback={<CommandPalette />}><ContentCommands /></Suspense>
  </CommandPaletteProvider></LocaleProvider></ThemeProvider></>;
}
