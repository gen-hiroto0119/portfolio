import type { BlogCategory } from "@/lib/content/schema";

export type CategoryFilter = "all" | BlogCategory;

export function getCategoryLabel(category: BlogCategory): string {
  switch (category) {
    case "tech":
      return "TECH";
    case "photo":
      return "PHOTO";
    case "daily":
      return "DAILY";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function getFilterLabel(filter: CategoryFilter): string {
  switch (filter) {
    case "all":
      return "ALL";
    case "tech":
      return "TECH";
    case "photo":
      return "PHOTO";
    case "daily":
      return "DAILY";
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}
