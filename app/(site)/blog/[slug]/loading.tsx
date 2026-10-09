import styles from "@/components/portfolio/portfolio.module.css";

export default function Loading() {
  return <main id="main" className={styles.main}><p role="status">記事を読み込んでいます…</p></main>;
}
