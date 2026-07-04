"use client";

import { useMemo, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { ContentGraph } from "@/components/graph/content-graph";
import { NoteGrid } from "@/components/garden/note-card";
import type { ContentGraph as ContentGraphData } from "@/lib/content-graph";
import type { GardenNote } from "@/lib/content/schema";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  maxWidth,
  motion,
  spacing,
} from "@/lib/theme/tokens.stylex";

const NOTES_PER_PAGE = 6;

type GardenViewMode = "cards" | "graph";

const styles = stylex.create({
  shell: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
  },
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
  pagination: {
    gap: spacing.lg,
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.section,
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
  },
  pageNav: {
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
    ":disabled": {
      color: colors.fgFaint,
      cursor: "default",
    },
  },
  pageNumber: {
    color: colors.fgMuted,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingBlock: spacing.xs,
    paddingInline: spacing.xxs,
    cursor: "pointer",
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.fg,
    },
  },
  pageNumberCurrent: {
    color: colors.accent,
  },
});

type GardenViewProps = {
  notes: GardenNote[];
  connectionCounts: Record<string, number>;
  graph: ContentGraphData;
};

function formatPageNumber(page: number): string {
  return String(page).padStart(2, "0");
}

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  return (
    <nav
      aria-label="Garden notes pagination"
      {...stylex.props(
        styles.pagination,
        x.display.flex,
        x.alignItems.center,
        x.justifyContent.center,
        x.textTransform.uppercase,
      )}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        {...stylex.props(styles.pageNav)}
      >
        ← PREV
      </button>
      {pages.map((pageNumber) => {
        const isCurrent = pageNumber === page;

        if (isCurrent) {
          return (
            <span
              key={pageNumber}
              aria-current="page"
              {...stylex.props(
                styles.pageNumber,
                styles.pageNumberCurrent,
              )}
            >
              {formatPageNumber(pageNumber)}
            </span>
          );
        }

        return (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            {...stylex.props(styles.pageNumber)}
          >
            {formatPageNumber(pageNumber)}
          </button>
        );
      })}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        {...stylex.props(styles.pageNav)}
      >
        NEXT →
      </button>
    </nav>
  );
}

function renderViewContent(
  view: GardenViewMode,
  notes: GardenNote[],
  connectionCounts: Record<string, number>,
  graph: ContentGraphData,
  page: number,
  totalPages: number,
  onPageChange: (page: number) => void,
) {
  switch (view) {
    case "cards": {
      const start = (page - 1) * NOTES_PER_PAGE;
      const paginatedNotes = notes.slice(start, start + NOTES_PER_PAGE);

      return (
        <>
          <NoteGrid notes={paginatedNotes} connectionCounts={connectionCounts} />
          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          ) : null}
        </>
      );
    }
    case "graph":
      return <ContentGraph graph={graph} />;
    default: {
      const _exhaustive: never = view;
      return _exhaustive;
    }
  }
}

export function GardenView({
  notes,
  connectionCounts,
  graph,
}: GardenViewProps) {
  const [view, setView] = useState<GardenViewMode>("cards");
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));

  const safePage = Math.min(page, totalPages);

  return (
    <>
      <div
        {...stylex.props(
          styles.shell,
          x.width["100%"],
        )}
      >
        <div
          role="tablist"
          aria-label="Garden view"
          {...stylex.props(
            styles.tablist,
            x.display.flex,
            x.flexWrap.wrap,
            x.alignItems["flex-end"],
          )}
        >
          {(["cards", "graph"] as const).map((tab) => {
            const isSelected = view === tab;

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setView(tab)}
                {...stylex.props(
                  styles.tab,
                  x.textTransform.uppercase,
                  isSelected && styles.tabSelected,
                )}
              >
                {tab === "cards" ? "CARDS" : "GRAPH"}
              </button>
            );
          })}
        </div>
      </div>
      {renderViewContent(
        view,
        notes,
        connectionCounts,
        graph,
        safePage,
        totalPages,
        setPage,
      )}
    </>
  );
}
