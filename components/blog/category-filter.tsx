"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import type { BlogCategory } from "@/lib/content/schema";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  motion,
  spacing,
} from "@/lib/theme/tokens.stylex";

import {
  getFilterLabel,
  type CategoryFilter,
} from "./category-utils";

const styles = stylex.create({
  tablist: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  tab: {
    position: "relative",
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingBlock: spacing.xs,
    paddingInline: 0,
    cursor: "pointer",
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.fg,
    },
  },
  tabSelected: {
    color: colors.accent,
    "::after": {
      content: '""',
      position: "absolute",
      left: 0,
      bottom: `calc(-1 * ${spacing.sm} - 1px)`,
      width: "100%",
      height: "2px",
      backgroundColor: colors.accent,
    },
  },
  count: {
    marginLeft: spacing.xxs,
    color: colors.fgFaint,
    fontWeight: 400,
  },
});

const FILTERS: CategoryFilter[] = ["all", "tech", "photo", "daily"];

type CategoryFilterProps = {
  selected: CategoryFilter;
  counts: Record<CategoryFilter, number>;
  onChange: (filter: CategoryFilter) => void;
};

export function CategoryFilterTabs({
  selected,
  counts,
  onChange,
}: CategoryFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Blog categories"
      {...stylex.props(
        styles.tablist,
        x.display.flex,
        x.flexWrap.wrap,
        x.alignItems["flex-end"],
      )}
    >
      {FILTERS.map((filter) => {
        const isSelected = selected === filter;

        return (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(filter)}
            {...stylex.props(
              styles.tab,
              x.textTransform.uppercase,
              isSelected && styles.tabSelected,
            )}
          >
            {getFilterLabel(filter)}
            <span {...stylex.props(styles.count)}>({counts[filter]})</span>
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
