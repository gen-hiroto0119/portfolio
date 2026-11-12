import { defineConfig } from "astro/config";

export default defineConfig({
  site: (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://hiroto-portfolio.vercel.app"
  ).replace(/\/$/, ""),
  trailingSlash: "never",
  // Inline the small stylesheet so it does not block the first render.
  build: { format: "file", inlineStylesheets: "always" },
  // Token colors come from the site's --syntax-* properties in portfolio.css.
  markdown: { shikiConfig: { theme: "css-variables" } },
});
