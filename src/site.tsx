import { raw } from "hono/html";
import type { Child } from "hono/jsx";

import { PostDetail } from "@/components/blog/post-detail";
import { PortfolioFooter, PortfolioHeader } from "@/components/portfolio/shell";
import { PostList } from "@/components/portfolio/post-list";
import styles from "@/components/portfolio/portfolio.module.css";
import portraitStyles from "@/components/portfolio/ascii-portrait.module.css?inline";
import planetStyles from "@/components/portfolio/ice-planet.module.css?inline";
import type { BlogPost } from "@/lib/content/schema";
import globalStyles from "./styles/global.css?inline";
import portfolioStyles from "@/components/portfolio/portfolio.module.css?inline";
import { site } from "@/lib/site";

const experience = [
  { company: "CyberAgent", role: "Software Engineer · Intern", date: "2026.07 — 現在", logo: "cyberagent-logo-clean" },
  { company: "Google", role: "Campus Ambassador", date: "2026.04 — 現在", logo: "google-logo" },
  { company: "CyberAgent", role: "Backend Engineer · Intern", date: "2026.02 — 2026.03", logo: "cyberagent-logo-clean" },
  { company: "LayerX", role: "Product Manager · Intern", date: "2025.08 — 2026.07", logo: "layerx-logo" },
];

const clientScript = import.meta.env.DEV ? "/src/client/main.tsx" : "/assets/client.js";
const inlineStyles = [globalStyles, portfolioStyles, portraitStyles, planetStyles];

export type PageMeta = {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: "website" | "article";
  image?: string;
  publishedTime?: string;
};

function absolute(path: string) {
  return new URL(path, site.url).toString();
}

export function homeMeta(): PageMeta {
  return {
    title: `${site.name} — Portfolio`,
    description: site.description,
    canonical: absolute("/"),
    image: absolute("/opengraph-image"),
  };
}

export function blogMeta(): PageMeta {
  return {
    title: `Blog — ${site.name}`,
    description: "開発やデザインについて、考えたこと。",
    canonical: absolute("/blog"),
    image: absolute("/opengraph-image"),
  };
}

export function postMeta(post: { title: string; description: string; slug: string; date: string }): PageMeta {
  const path = `/blog/${post.slug}`;
  return {
    title: `${post.title} — ${site.name}`,
    description: post.description,
    canonical: absolute(path),
    ogType: "article",
    image: absolute(`${path}/opengraph-image`),
    publishedTime: post.date,
  };
}

export function notFoundMeta(): PageMeta {
  return {
    title: `ページが見つかりませんでした — ${site.name}`,
    description: site.description,
    noindex: true,
  };
}

function Technology({ name, logo }: { name: string; logo: string }) {
  return <span className={styles.technology}><img src={`/portfolio/${logo}-logo.svg`} width={15} height={15} alt="" />{name}</span>;
}

export function HomePage({ posts }: { posts: BlogPost[] }) {
  return <main id="main" className={styles.main}>
    <section className={styles.intro} lang="en" aria-label="Profile">
      <p>I'm a <strong>product engineer</strong> based in Tokyo, and I love <strong>Product Design</strong>. I'm currently working as an engineer while attending university.</p>
      <p>My main focus is on <strong>frontend</strong> and <strong>native development</strong>. I primarily use <Technology name="React" logo="react" />, <Technology name="Next.js" logo="nextjs" />, <Technology name="Deno" logo="deno" />, and <Technology name="Swift" logo="swift" />.</p>
      <p>Lately, I've been drawn to <Technology name="Rust" logo="rust" /> and am building a <strong>macOS application</strong> with <strong>GPUI</strong>.</p>
    </section>
    <section className={styles.section} aria-labelledby="work-title">
      <h2 id="work-title">Work</h2>
      <ul className={styles.experience}>{experience.map((job) => (
        <li className={styles.experienceRow} key={`${job.company}-${job.role}`}>
          <span className={styles.job}><img src={`/portfolio/${job.logo}.svg`} width={16} height={16} alt="" /><span lang="en">{job.company} <span className={styles.secondary}>~ {job.role}</span></span></span>
          <span className={styles.date}>{job.date}</span>
        </li>
      ))}</ul>
    </section>
    <section className={styles.section} aria-labelledby="edu-title">
      <h2 id="edu-title">Edu</h2>
      <div className={styles.experienceRow} lang="en"><span>Hosei University <span className={styles.secondary}>~ Geography</span></span><span className={styles.date}>2024.04 — 2028.03 (Expected)</span></div>
    </section>
    <section className={`${styles.section} ${styles.projects}`} aria-labelledby="projects-title"><h2 id="projects-title">Projects</h2></section>
    <section className={styles.section} aria-labelledby="blog-title">
      <div className={styles.sectionHeading}><h2 id="blog-title">Blog</h2><a href="/blog">記事一覧を見る ↗</a></div>
      <PostList posts={posts.slice(0, 3)} />
    </section>
  </main>;
}

export function BlogPage({ posts }: { posts: BlogPost[] }) {
  return <main id="main" className={styles.main}>
    <header className={styles.blogHeading}><h1>Blog</h1></header>
    <section className={styles.section} aria-label="記事一覧">
      <PostList posts={posts} />
    </section>
  </main>;
}

export function ArticlePage({ post }: { post: Parameters<typeof PostDetail>[0]["post"] }) {
  return <PostDetail post={post} />;
}

export function NotFoundPage() {
  return <main id="main" className={styles.main}>
    <p className={styles.secondary}>404</p>
    <h1>ページが見つかりませんでした。</h1>
    <a href="/">ホームへ戻る</a>
  </main>;
}

export function SiteErrorPage({ path }: { path: string }) {
  return <main id="main" className={styles.main}>
    <h1>読み込みに失敗しました。</h1>
    <p>時間をおいて、もう一度お試しください。</p>
    <a className={styles.retry} href={path}>再試行</a>
    <a href="/">ホームへ戻る</a>
  </main>;
}

function Head({ meta }: { meta: PageMeta }) {
  const description = meta.description ?? site.description;
  const image = meta.image ?? absolute("/opengraph-image");
  const analytics = process.env["VERCEL_ENV"] === "production";
  return <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/icon.png" type="image/png" />
    <title>{meta.title}</title>
    <meta name="description" content={description} />
    <meta name="robots" content={meta.noindex ? "noindex" : "index, follow"} />
    <meta name="google-site-verification" content="ssWfIeurI-ISfNLYHK1mlYeqDZzqYm2nfiBx17FY1FA" />
    {meta.canonical ? <link rel="canonical" href={meta.canonical} /> : null}
    <meta property="og:site_name" content={site.name} />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:type" content={meta.ogType ?? "website"} />
    <meta property="og:title" content={meta.title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    {meta.canonical ? <meta property="og:url" content={meta.canonical} /> : null}
    {meta.publishedTime ? <meta property="article:published_time" content={meta.publishedTime} /> : null}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={meta.title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
    {inlineStyles.map((css) => <style>{raw(css)}</style>)}
    {analytics ? <>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-HPL2D9ZG54" />
      <script>{raw(`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-HPL2D9ZG54');`)}</script>
    </> : null}
  </head>;
}

export function SiteDocument({ meta, pathname, children }: { meta: PageMeta; pathname: string; children: Child }) {
  return <>
    {raw("<!DOCTYPE html>")}
    <html lang="ja">
      <Head meta={meta} />
      <body className="isolate flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <div className={styles.site}>
          <a href="#main" className={styles.skipLink}>本文へスキップ</a>
          <div className={styles.container}>
            <PortfolioHeader pathname={pathname} />
            {children}
            <PortfolioFooter />
          </div>
        </div>
        <script type="module" src={clientScript} />
      </body>
    </html>
  </>;
}

export function RecoveryDocument() {
  return <>
    {raw("<!DOCTYPE html>")}
    <html lang="ja">
      <Head meta={{ title: `ページを読み込めませんでした — ${site.name}`, noindex: true }} />
      <body className="isolate flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <div id="page-recovery" />
        <noscript>
          <section className="mx-auto w-full max-w-4xl px-6 py-24 sm:px-10">
            <h1 className="mt-6 text-2xl font-medium tracking-tight">ページを読み込めませんでした</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">一時的に接続が途切れた可能性があります。少し待ってから、もう一度読み込んでみてください。</p>
            <p className="mt-8"><a href="/" className="text-sm underline underline-offset-4">ホームへ</a></p>
          </section>
        </noscript>
        <script type="module" src={clientScript} />
      </body>
    </html>
  </>;
}
