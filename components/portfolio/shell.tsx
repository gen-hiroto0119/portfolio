import { SiteNavigation } from "./site-navigation";
import { site } from "@/lib/site";
import styles from "./portfolio.module.css";

export function PortfolioHeader({ pathname }: { pathname: string }) {
  return <header className={styles.header}>
    <a href="/" className={styles.homeLink}>HirotoFurugen</a>
    <div className={styles.headerActions}>
      <nav aria-label="メインナビゲーション"><SiteNavigation pathname={pathname} /></nav>
    </div>
  </header>;
}

export function PortfolioFooter() {
  return <footer className={styles.footer}>
    <nav aria-label="ソーシャルリンク" className={styles.socials}>
      <a href={site.socials.github} aria-label="GitHub"><img src="/portfolio/github.svg" alt="" width={16} height={16} /></a>
      <a href={site.socials.linkedin} aria-label="LinkedIn"><img src="/portfolio/linkedin.svg" alt="" width={16} height={16} /></a>
    </nav>
    <span>HirotoFurugen</span>
  </footer>;
}
