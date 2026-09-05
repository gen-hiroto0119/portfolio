import type { Metadata } from "next";

import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getContentCommandData } from "@/lib/content-commands";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getLocaleInitScript } from "@/lib/i18n/locale-script";
import { getThemeInitScript } from "@/lib/theme/theme-script";
import { site } from "@/lib/site";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "@fontsource-variable/noto-sans-jp";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Portfolio`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    siteName: site.name,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contentItems = await getContentCommandData();

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: getLocaleInitScript(),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeInitScript(),
          }}
        />
      </head>
      <body className="isolate flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <LocaleProvider>
            <CommandPaletteProvider contentItems={contentItems}>
              <Header />
              <main id="main" className="flex flex-1 flex-col">
                {children}
              </main>
              <Footer />
            </CommandPaletteProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
