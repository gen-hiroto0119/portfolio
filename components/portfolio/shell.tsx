import Image from "next/image";
import Link from "next/link";
import { IcePlanet } from "./ice-planet";
import { site } from "@/lib/site";
import styles from "./portfolio.module.css";

export function PortfolioHeader({ home = false }: { home?: boolean }) {
  return <header className={styles.header}>
    <Link href="/" className={styles.avatarLink} aria-label="Hiroto Furugen — Home"><IcePlanet /></Link>
    <nav aria-label="メインナビゲーション"><Link href={home ? "/blog" : "/"}>{home ? "Blog" : "Home"}</Link></nav>
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
