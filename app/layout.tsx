import type { Metadata } from "next";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { getContentCommandData } from "@/lib/content-commands";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getThemeInitScript } from "@/lib/theme/theme-script";
import { site } from "@/lib/site";
import { lightTheme } from "@/lib/theme/themes.stylex";
import { colors, fonts, motion } from "@/lib/theme/tokens.stylex";
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

const lightThemeClassName = stylex.props(lightTheme).className ?? "";

const layoutStyles = stylex.create({
  body: {
    minHeight: "100%",
    backgroundColor: colors.bg,
    color: colors.fg,
    fontFamily: fonts.body,
    transitionProperty: "background-color, color",
    transitionDuration: motion.durationBase,
    transitionTimingFunction: motion.easing,
    "::selection": {
      backgroundColor: colors.selection,
    },
  },
});

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
            __html: getThemeInitScript(lightThemeClassName),
          }}
        />
      </head>
      <body
        {...stylex.props(
          layoutStyles.body,
          x.isolation.isolate,
          x.display.flex,
          x.flexDirection.column,
        )}
      >
        <ThemeProvider lightThemeClassName={lightThemeClassName}>
          <CommandPaletteProvider contentItems={contentItems}>
            <Header />
            <main
              id="main"
              {...stylex.props(x.flex._1, x.display.flex, x.flexDirection.column)}
            >
              {children}
            </main>
            <Footer />
          </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
