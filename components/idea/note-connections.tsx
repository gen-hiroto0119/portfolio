"use client";

import Link from "next/link";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { StatusIcon } from "@/components/idea/status-icon";
import type { IdeaNote } from "@/lib/content/schema";
import type { NoteConnections } from "@/lib/idea-graph";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  motion,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  section: {
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.lg,
  },
  group: {
    marginBottom: spacing.lg,
  },
  groupLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgFaint,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.xs,
  },
  link: {
    gap: spacing.sm,
    paddingBlock: spacing.xs,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.fg,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
  },
  titleAccent: {
    color: colors.accent,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgMuted,
    flexShrink: 0,
  },
});

type ConnectionGroupProps = {
  label: string;
  notes: IdeaNote[];
};

function ConnectionGroup({ label, notes }: ConnectionGroupProps) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div {...stylex.props(styles.group)}>
      <p {...stylex.props(styles.groupLabel)}>{label}</p>
      <ul
        {...stylex.props(
          styles.list,
          x.display.flex,
          x.flexDirection.column,
          x.listStyleType.none,
          x.margin._0,
          x.padding._0,
        )}
      >
        {notes.map((note) => (
          <ConnectionRow key={note.slug} note={note} />
        ))}
      </ul>
    </div>
  );
}

function ConnectionRow({ note }: { note: IdeaNote }) {
  const [hovered, setHovered] = useState(false);

  return (
    <li>
      <Link
        href={`/idea/${note.slug}`}
        {...stylex.props(
          styles.link,
          x.display.flex,
          x.alignItems.center,
          x.textDecoration.none,
          x.color.inherit,
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <StatusIcon status={note.status} />
        <span
          {...stylex.props(
            styles.title,
            x.flexGrow._1,
            x.overflow.hidden,
            x.textOverflow.ellipsis,
            x.whiteSpace.nowrap,
            hovered && styles.titleAccent,
          )}
        >
          {note.title}
        </span>
        <span {...stylex.props(styles.date)}>{note.tended}</span>
      </Link>
    </li>
  );
}

type NoteConnectionsSectionProps = {
  connections: NoteConnections;
};

export function NoteConnectionsSection({
  connections,
}: NoteConnectionsSectionProps) {
  const { related, backlinks, sameTags } = connections;
  const hasConnections =
    related.length > 0 || backlinks.length > 0 || sameTags.length > 0;

  if (!hasConnections) {
    return null;
  }

  return (
    <section {...stylex.props(styles.section)} aria-label="つながり">
      <p {...stylex.props(styles.label, x.textTransform.uppercase)}>
        Connections
      </p>
      <ConnectionGroup label="関連づけたメモ" notes={related} />
      <ConnectionGroup label="ここへのリンク" notes={backlinks} />
      <ConnectionGroup label="同じタグのメモ" notes={sameTags} />
    </section>
  );
}
