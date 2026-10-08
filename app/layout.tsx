import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";

import { FeedbackToasts } from "@/components/feedback-notice";
import { CommandPalette } from "@/components/command-palette/command-palette";
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
  verification: {
    google: "ssWfIeurI-ISfNLYHK1mlYeqDZzqYm2nfiBx17FY1FA",
  },
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

async function ContentCommands() {
  const contentItems = await getContentCommandData();
  return <CommandPalette contentItems={contentItems} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <FeedbackToasts />
        <ThemeProvider>
          <LocaleProvider>
            <CommandPaletteProvider>
              <Header />
              <main id="main" className="flex flex-1 flex-col">
                {children}
              </main>
              <Footer />
              <Suspense fallback={<CommandPalette />}>
                <ContentCommands />
              </Suspense>
            </CommandPaletteProvider>
          </LocaleProvider>
        </ThemeProvider>
        <SpeedInsights />
        {process.env.VERCEL_ENV === "production" && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-HPL2D9ZG54"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-HPL2D9ZG54');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
