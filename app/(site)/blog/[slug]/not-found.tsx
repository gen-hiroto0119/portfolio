import Link from "next/link";
import styles from "@/components/portfolio/portfolio.module.css";

export default function NotFound() {
  return <main id="main" className={styles.main}><h1>記事が見つかりませんでした。</h1><Link href="/blog">← 記事一覧に戻る</Link></main>;
}
