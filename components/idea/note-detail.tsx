import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { MdxContent } from "@/components/mdx/mdx-content";
import { NoteConnectionsSection } from "@/components/garden/note-connections";
import { StatusIcon } from "@/components/garden/status-icon";
import type { GardenNoteWithContent } from "@/lib/content/schema";
import type { NoteConnections } from "@/lib/garden-graph";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  maxWidth,
  motion,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  article: {
    maxWidth: maxWidth.content,
    marginInline: "auto",
    paddingBlock: spacing.section,
    paddingInline: spacing.lg,
    paddingBottom: spacing.section,
  },
  meta: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dates: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.tight,
    color: colors.fg,
    marginBottom: spacing.xl,
  },
  backLink: {
    marginTop: spacing.xxl,
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.accent,
    transitionProperty: "opacity",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      opacity: 0.8,
    },
  },
});

type NoteDetailProps = {
  note: GardenNoteWithContent;
  connections: NoteConnections;
};

export function NoteDetail({ note, connections }: NoteDetailProps) {
  return (
    <article {...stylex.props(styles.article, x.width["100%"])}>
      <header>
        <div
          {...stylex.props(
            styles.meta,
            x.display.flex,
            x.flexWrap.wrap,
            x.alignItems.center,
          )}
        >
          <StatusIcon status={note.status} showLabel />
          <span {...stylex.props(styles.dates)}>
            Planted {note.planted} / Tended {note.tended}
          </span>
        </div>
        <h1 {...stylex.props(styles.title)}>{note.title}</h1>
      </header>
      <div {...stylex.props(x.width["100%"])}>
        <MdxContent source={note.content} />
      </div>
      <NoteConnectionsSection connections={connections} />
      <Link
        href="/garden"
        {...stylex.props(
          styles.backLink,
          x.display["inline-block"],
          x.textDecoration.none,
        )}
      >
        ← Garden 一覧へ
      </Link>
    </article>
  );
}
