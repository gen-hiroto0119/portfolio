import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { PostList } from "@/components/portfolio/post-list";
import { getAllPosts } from "@/lib/content";
import styles from "@/components/portfolio/portfolio.module.css";

const experience = [
  { company: "CyberAgent", role: "Software Engineer · Intern", date: "2026.07 — 現在", logo: "cyberagent-logo-clean" },
  { company: "Google", role: "Campus Ambassador", date: "2026.04 — 現在", logo: "google-logo" },
  { company: "CyberAgent", role: "Backend Engineer · Intern", date: "2026.02 — 2026.03", logo: "cyberagent-logo-clean" },
  { company: "LayerX", role: "Product Manager · Intern", date: "2025.08 — 2026.07", logo: "layerx-logo" },
];

function Technology({ name, logo }: { name: string; logo: string }) {
  return <span className={styles.technology}><Image src={`/portfolio/${logo}-logo.svg`} width={15} height={15} alt="" />{name}</span>;
}

async function RecentPosts() {
  return <PostList posts={(await getAllPosts()).slice(0, 3)} />;
}

export default function HomePage() {
  return <>
    <main id="main" className={styles.main}>
      <section className={styles.intro} lang="en" aria-labelledby="intro-title">
        <h1 id="intro-title">I&apos;m Hiroto</h1>
        <p>I&apos;m a <strong>product engineer</strong> based in Tokyo, and I love <strong>Product Design</strong>. I&apos;m currently working as an engineer while attending university.</p>
        <p>My main focus is on <strong>frontend</strong> and <strong>native development</strong>. I primarily use <Technology name="React" logo="react" />, <Technology name="Next.js" logo="nextjs" />, and <Technology name="Swift" logo="swift" />.</p>
        <p>Lately, I&apos;ve been drawn to <Technology name="Rust" logo="rust" /> and am building a <strong>macOS application</strong> with <strong>GPUI</strong>.</p>
      </section>
      <section className={styles.section} aria-labelledby="work-title">
        <h2 id="work-title">Work</h2>
        <ul className={styles.experience}>{experience.map((job) => (
          <li className={styles.experienceRow} key={`${job.company}-${job.role}`}>
            <span className={styles.job}><Image src={`/portfolio/${job.logo}.svg`} width={16} height={16} alt="" /><span lang="en">{job.company} <span className={styles.secondary}>~ {job.role}</span></span></span>
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
        <div className={styles.sectionHeading}><h2 id="blog-title">Blog</h2><Link href="/blog">記事一覧を見る ↗</Link></div>
        <Suspense fallback={<p role="status" className={styles.secondary}>記事を読み込んでいます…</p>}><RecentPosts /></Suspense>
      </section>
    </main>
  </>;
}
