"use client";

import { Moon, Sun } from "lucide-react";
import styles from "./portfolio.module.css";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("portfolio-theme", next);
    } catch {
      // The switch still works when browser storage is unavailable.
    }
  }

  return (
    <button type="button" className={styles.themeToggle} onClick={toggle} aria-label="配色を切り替える">
      <Moon size={16} className={styles.lightIcon} aria-hidden="true" />
      <Sun size={16} className={styles.darkIcon} aria-hidden="true" />
    </button>
  );
}
