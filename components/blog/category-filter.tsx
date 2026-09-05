"use client";

import type { BlogCategory } from "@/lib/content/schema";

import { getFilterLabel, type CategoryFilter } from "./category-utils";

const FILTERS: CategoryFilter[] = ["all", "tech", "photo", "daily"];

type CategoryFilterProps = {
  selected: CategoryFilter;
  counts: Record<CategoryFilter, number>;
  onChange: (filter: CategoryFilter) => void;
};

export function CategoryFilterTabs({ selected, counts, onChange }: CategoryFilterProps) {
  return (
    <div role="group" aria-label="記事のカテゴリ" className="flex flex-wrap gap-x-6 gap-y-1 pb-3">
      {FILTERS.map((filter) => {
        const isSelected = selected === filter;

        return (
          <button
            key={filter}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(filter)}
            className={`cursor-pointer py-2 text-sm underline-offset-8 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground ${isSelected ? "text-foreground underline" : "text-muted-foreground"}`}
          >
            {getFilterLabel(filter)}
            <span className="ml-1.5 text-xs text-muted-foreground">{counts[filter]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function countPostsByCategory(
  posts: Array<{ category: BlogCategory }>,
): Record<CategoryFilter, number> {
  const counts: Record<CategoryFilter, number> = {
    all: posts.length,
    tech: 0,
    photo: 0,
    daily: 0,
  };

  for (const post of posts) {
    counts[post.category] += 1;
  }

  return counts;
}
