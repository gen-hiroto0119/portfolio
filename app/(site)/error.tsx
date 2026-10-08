"use client";

import Link from "next/link";
import styles from "@/components/portfolio/portfolio.module.css";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return <main id="main" className={styles.main}><h1>読み込みに失敗しました。</h1><p>時間をおいて、もう一度お試しください。</p><button className={styles.retry} onClick={retry}>再試行</button><Link href="/">ホームへ戻る</Link></main>;
}
