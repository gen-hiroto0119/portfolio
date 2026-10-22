import { site } from "@/lib/site";
import { createPortfolioImage } from "@/lib/og/create-portfolio-image";
export async function GET() { return createPortfolioImage({ label: "Portfolio", title: `${site.name} — Portfolio` }); }
