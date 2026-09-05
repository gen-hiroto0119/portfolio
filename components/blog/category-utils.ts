import type { BlogCategory } from "@/lib/content/schema";

export type CategoryFilter = "all" | BlogCategory;

export function getCategoryLabel(category: BlogCategory): string {
  switch (category) {
    case "tech":
      return "技術";
    case "photo":
      return "写真";
    case "daily":
      return "日常";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function getFilterLabel(filter: CategoryFilter): string {
  switch (filter) {
    case "all":
      return "すべて";
    case "tech":
      return "技術";
    case "photo":
      return "写真";
    case "daily":
      return "日常";
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}
