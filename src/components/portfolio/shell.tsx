import { ThemeToggle } from "./theme-toggle";
import { site } from "@/lib/site";

export function PortfolioHeader({ path }: { path: string }) {
  return (
    <header class="portfolio-header">
      <a href="/" class="portfolio-homeLink">
        HirotoFurugen
      </a>
      <div class="portfolio-headerActions">
        <nav aria-label="メインナビゲーション">
          <a href={path === "/" ? "/blog" : "/"}>
            {path === "/" ? "Blog" : "Home"}
          </a>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function PortfolioFooter() {
  return (
    <footer class="portfolio-footer">
      <nav aria-label="ソーシャルリンク" class="portfolio-socials">
        <a href={site.socials.github} aria-label="GitHub">
          <img src="/portfolio/github.svg" alt="" width={16} height={16} />
        </a>
        <a href={site.socials.linkedin} aria-label="LinkedIn">
          <img src="/portfolio/linkedin.svg" alt="" width={16} height={16} />
        </a>
      </nav>
      <span>HirotoFurugen</span>
    </footer>
  );
}
