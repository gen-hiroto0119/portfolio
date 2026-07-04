"use client";

import Link from "next/link";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { StatusIcon } from "@/components/garden/status-icon";
import type { GardenNote } from "@/lib/content/schema";
import {
  colors,
  fontSize,
  fonts,
  lineHeight,
  maxWidth,
  motion,
  radius,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  grid: {
    gap: spacing.md,
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    paddingBottom: spacing.section,
    "@media (max-width: 1024px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.sm,
    transitionProperty: "background-color, border-color",
    transitionDuration: motion.durationBase,
    transitionTimingFunction: motion.easing,
    ":hover": {
      backgroundColor: colors.bgSubtle,
      borderColor: colors.borderStrong,
    },
  },
  titleRow: {
    gap: spacing.sm,
  },
  titleActions: {
    gap: spacing.sm,
    flexShrink: 0,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    color: colors.fg,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
  },
  titleAccent: {
    color: colors.accent,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgMuted,
    lineHeight: lineHeight.snug,
  },
  tags: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgFaint,
  },
  connectionCount: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgMuted,
    flexShrink: 0,
  },
});

type NoteCardProps = {
  note: GardenNote;
  connectionCount?: number;
};

function NoteCard({ note, connectionCount = 0 }: NoteCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/garden/${note.slug}`}
      {...stylex.props(
        styles.card,
        x.display.flex,
        x.flexDirection.column,
        x.textDecoration.none,
        x.color.inherit,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        {...stylex.props(
          styles.titleRow,
          x.display.flex,
          x.alignItems["flex-start"],
          x.justifyContent["space-between"],
        )}
      >
        <h2
          {...stylex.props(styles.title, x.margin._0, hovered && styles.titleAccent)}
        >
          {note.title}
        </h2>
        <div
          {...stylex.props(
            styles.titleActions,
            x.display.flex,
            x.alignItems.center,
          )}
        >
          {connectionCount > 0 ? (
            <span {...stylex.props(styles.connectionCount)} aria-label={`${connectionCount}件のつながり`}>
              ⤳ {connectionCount}
            </span>
          ) : null}
          <StatusIcon status={note.status} />
        </div>
      </div>
      <p {...stylex.props(styles.meta)}>
        Planted {note.planted} / Tended {note.tended}
      </p>
      <div
        {...stylex.props(
          styles.tags,
          x.display.flex,
          x.flexWrap.wrap,
        )}
      >
        {note.tags.map((tag) => (
          <span key={tag} {...stylex.props(styles.tag)}>
            #{tag}
          </span>
        ))}
      </div>
    </Link>
  );
}

export function NoteGrid({
  notes,
  connectionCounts,
}: {
  notes: GardenNote[];
  connectionCounts?: Record<string, number>;
}) {
  return (
    <nav
      aria-label="Garden notes"
      {...stylex.props(
        styles.grid,
        x.display.grid,
        x.gridTemplateColumns["repeat(3, 1fr)"],
        x.width["100%"],
      )}
    >
      {notes.map((note) => (
        <NoteCard
          key={note.slug}
          note={note}
          connectionCount={connectionCounts?.[note.slug] ?? 0}
        />
      ))}
    </nav>
  );
}
