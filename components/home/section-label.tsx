import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
    marginBottom: spacing.lg,
  },
});

type SectionLabelProps = {
  children: string;
};

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p {...stylex.props(x.textTransform.uppercase, styles.label)}>
      {children}
    </p>
  );
}
