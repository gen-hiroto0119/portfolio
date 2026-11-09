import type { APIRoute } from "astro";
import { createPortfolioImage } from "@/lib/og/create-portfolio-image";
import { site } from "@/lib/site";

export const GET: APIRoute = () =>
  createPortfolioImage({ label: "Portfolio", title: `${site.name} — Portfolio` });
