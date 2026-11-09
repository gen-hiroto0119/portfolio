import { getCollection } from "astro:content";

export function getBlogEntries() {
  return getCollection("blog");
}
