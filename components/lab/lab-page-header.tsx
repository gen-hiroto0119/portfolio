"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { DecryptedSubtitle, DecryptedTextView } from "@/components/visuals/decrypted-text";

import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  maxWidth,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  shell: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingBlock: spacing.section,
    paddingInline: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.tight,
    color: colors.fg,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    color: colors.fgMuted,
  },
});

type LabPageHeaderProps = {
  label: string;
  title: string;
  description: string;
};

export function LabPageHeader({
  label,
  title,
  description,
}: LabPageHeaderProps) {
  return (
    <header {...stylex.props(x.width["100%"], styles.shell)}>
      <p {...stylex.props(x.textTransform.uppercase, styles.label)}>
        <DecryptedTextView text={label} />
      </p>
      <h1 {...stylex.props(styles.title)}>
        <DecryptedTextView text={title} speed={35} />
      </h1>
      <p {...stylex.props(x.maxWidth["36rem"], styles.description)}>
        <DecryptedSubtitle text={description} />
      </p>
    </header>
  );
}
