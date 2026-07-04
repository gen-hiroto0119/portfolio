import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import type { BlogCategory } from "@/lib/content/schema";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
} from "@/lib/theme/tokens.stylex";

import { getCategoryLabel } from "./category-utils";

const styles = stylex.create({
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
});

type CategoryLabelProps = {
  category: BlogCategory;
};

export function CategoryLabel({ category }: CategoryLabelProps) {
  return (
    <span {...stylex.props(styles.label, x.textTransform.uppercase)}>
      {getCategoryLabel(category)}
    </span>
  );
}
