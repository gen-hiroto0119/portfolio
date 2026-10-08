import localFont from "next/font/local";
import styles from "@/components/portfolio/portfolio.module.css";

const geist = localFont({
  src: [
    { path: "../../public/portfolio/fonts/Geist-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/portfolio/fonts/Geist-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--portfolio-font",
  display: "swap",
});

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${geist.variable} ${styles.site}`}>
    <a href="#main" className={styles.skipLink}>本文へスキップ</a>
    <div className={styles.container}>{children}</div>
  </div>;
}
