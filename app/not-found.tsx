import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { DecryptedTextView } from "@/components/visuals/decrypted-text";

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
    maxWidth: maxWidth.content,
    marginInline: "auto",
    paddingBlock: spacing.section,
    paddingInline: spacing.lg,
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.tight,
    color: colors.fg,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    color: colors.fgMuted,
  },
  link: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    color: colors.accent,
    marginTop: spacing.sm,
    ":hover": {
      textDecoration: "underline",
    },
  },
});

export default function NotFound() {
  return (
    <div
      {...stylex.props(
        styles.shell,
        x.width["100%"],
        x.display.flex,
        x.flexDirection.column,
      )}
    >
      <p {...stylex.props(styles.label, x.textTransform.uppercase)}>
        <DecryptedTextView text="404 — Not Found" />
      </p>
      <h1 {...stylex.props(styles.title)}>
        <DecryptedTextView text="ページが見つかりません" speed={35} />
      </h1>
      <p {...stylex.props(styles.description, x.maxWidth["36rem"])}>
        お探しのページは移動したか、削除された可能性があります。
      </p>
      <Link
        href="/"
        {...stylex.props(
          styles.link,
          x.textTransform.uppercase,
          x.textDecoration.none,
        )}
      >
        Home
      </Link>
    </div>
  );
}
