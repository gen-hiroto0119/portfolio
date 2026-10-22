import { site } from "@/lib/site";
import { createPortfolioImage } from "../server/og";
export async function GET() { return createPortfolioImage({ label: "Portfolio", title: `${site.name} — Portfolio` }); }
