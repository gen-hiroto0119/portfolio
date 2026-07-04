import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import {
  colors,
  fontSize,
  fonts,
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

type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header {...stylex.props(styles.shell, x.width["100%"])}>
      <h1 {...stylex.props(styles.title)}>{title}</h1>
      <p {...stylex.props(styles.description, x.maxWidth["36rem"])}>
        {description}
      </p>
    </header>
  );
}
