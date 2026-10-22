import { html } from "hono/html";
import type { PropsWithChildren } from "hono/jsx";
import { PortfolioHeader, PortfolioFooter } from "@/components/portfolio/shell";
import { site } from "@/lib/site";

type PageMetadata = {
  title?: string;
  description?: string;
  path: string;
  article?: { date: string; updatedAt: string };
  noindex?: boolean;
};

// Apply the saved theme before paint; the delegated click handler needs no hydration.
const themeScript = `(()=>{try{const t=localStorage.getItem("portfolio-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}document.addEventListener("click",e=>{if(!(e.target instanceof Element)||!e.target.closest("[data-theme-toggle]"))return;const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;const t=dark?"light":"dark";r.dataset.theme=t;try{localStorage.setItem("portfolio-theme",t)}catch{}})})();`;

export function Layout({
  children,
  title,
  description = site.description,
  path,
  article,
  noindex,
}: PropsWithChildren<PageMetadata>) {
  const fullTitle = title
    ? `${title} — ${site.name}`
    : `${site.name} — Portfolio`;
  const canonical = new URL(path, `${site.url}/`).href;
  const image = new URL(
    article ? `${path}/opengraph-image` : "/opengraph-image",
    `${site.url}/`,
  ).href;
  const document = (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta
          name="robots"
          content={noindex ? "noindex, nofollow" : "index, follow"}
        />
        <meta
          name="google-site-verification"
          content="ssWfIeurI-ISfNLYHK1mlYeqDZzqYm2nfiBx17FY1FA"
        />
        <link rel="canonical" href={canonical} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${site.name} — Blog`}
          href="/feed.xml"
        />
        <link
          rel="preload"
          href="/portfolio/fonts/Geist-Regular.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        <link rel="stylesheet" href="/styles/portfolio.css" />
        {article && <link rel="stylesheet" href="/styles/fonts.css" />}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content={site.name} />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:type" content={article ? "article" : "website"} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content={title ?? `${site.name} — Portfolio`}
        />
        {article && (
          <meta property="article:published_time" content={article.date} />
        )}
        {article && (
          <meta property="article:modified_time" content={article.updatedAt} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div class="portfolio-site">
          <a href="#main" class="portfolio-skipLink">
            本文へスキップ
          </a>
          <div class="portfolio-container">
            <PortfolioHeader path={path} />
            {children}
            <PortfolioFooter />
          </div>
        </div>
        {process.env.VERCEL && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};`,
              }}
            />
            <script defer src="/_vercel/speed-insights/script.js" />
          </>
        )}
        {process.env.VERCEL_ENV === "production" && (
          <>
            <script
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-HPL2D9ZG54"
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-HPL2D9ZG54');`,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
  return html`<!DOCTYPE html>${document}`;
}
