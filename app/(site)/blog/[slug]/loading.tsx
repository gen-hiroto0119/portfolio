import { PortfolioHeader, PortfolioFooter } from "@/components/portfolio/shell";
import styles from "@/components/portfolio/portfolio.module.css";

export default function Loading() {
  return <><PortfolioHeader /><main id="main" className={styles.main}><p role="status">記事を読み込んでいます…</p></main><PortfolioFooter /></>;
}
