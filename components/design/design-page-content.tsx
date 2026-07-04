import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { DesignColorsSection } from "@/components/design/design-colors";
import { DesignComponentsSection } from "@/components/design/design-components";
import { DesignMotionSection } from "@/components/design/design-motion";
import { DesignSpacingSection } from "@/components/design/design-spacing";
import { DesignTypographySection } from "@/components/design/design-typography";
import {
  colors,
  fontSize,
  fonts,
  maxWidth,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  shell: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    paddingBottom: spacing.section,
  },
  footnote: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgMuted,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
  },
});

export function DesignPageContent() {
  return (
    <div {...stylex.props(styles.shell, x.width["100%"])}>
      <DesignColorsSection />
      <DesignTypographySection />
      <DesignSpacingSection />
      <DesignMotionSection />
      <DesignComponentsSection />
      <p {...stylex.props(styles.footnote)}>
        トークンは lib/theme/tokens.stylex.ts で定義され、全コンポーネントが参照しています。
      </p>
    </div>
  );
}
