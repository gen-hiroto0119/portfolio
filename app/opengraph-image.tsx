import {
  createOgImage,
  ogImageContentType,
  ogImageSize,
} from "@/lib/og/create-og-image";
import { site } from "@/lib/site";

export const alt = `${site.name} — Portfolio`;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage({
    label: "Hiroto — Portfolio",
    title: `${site.name} — Portfolio`,
  });
}
