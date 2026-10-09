import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { IcePlanet } from "./ice-planet";
import { SiteNavigation } from "./site-navigation";
import { site } from "@/lib/site";
import styles from "./portfolio.module.css";

export function PortfolioHeader() {
  return <header className={styles.header}>
    <Link href="/" className={styles.avatarLink} aria-label="Hiroto Furugen — Home"><IcePlanet /></Link>
    <nav aria-label="メインナビゲーション"><Suspense fallback={<Link href="/">Home</Link>}><SiteNavigation /></Suspense></nav>
  </header>;
}

export function PortfolioFooter() {
  return <footer className={styles.footer}>
    <nav aria-label="ソーシャルリンク" className={styles.socials}>
      <a href={site.socials.github} aria-label="GitHub"><Image src="/portfolio/github.svg" alt="" width={16} height={16} /></a>
      <a href={site.socials.linkedin} aria-label="LinkedIn"><Image src="/portfolio/linkedin.svg" alt="" width={16} height={16} /></a>
    </nav>
    <span>HirotoFurugen</span>
  </footer>;
}
