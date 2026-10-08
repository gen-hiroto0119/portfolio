import {
  ogImageContentType,
  ogImageSize,
} from "@/lib/og/create-og-image";
import { site } from "@/lib/site";
import { createPortfolioImage } from "@/lib/og/create-portfolio-image";

export const alt = `${site.name} — Portfolio`;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createPortfolioImage({
    label: "Portfolio",
    title: `${site.name} — Portfolio`,
  });
}
