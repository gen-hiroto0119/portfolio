import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { SectionLabel } from "@/components/home/section-label";
import {
  colors,
  fontSize,
  fonts,
  lineHeight,
  motion,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  section: {
    paddingBottom: spacing.xl,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  body: {
    gap: spacing.lg,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    color: colors.fgMuted,
  },
  link: {
    gap: spacing.xs,
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.accent,
    transitionProperty: "transform",
    transitionDuration: motion.durationBase,
    transitionTimingFunction: motion.easing,
    ":hover": {
      transform: "translateX(4px)",
    },
  },
});

export function AboutSection() {
  return (
    <section {...stylex.props(styles.section)}>
      <SectionLabel>01 — ABOUT</SectionLabel>
      <div
        {...stylex.props(
          x.display.flex,
          x.flexDirection.column,
          x.maxWidth["42rem"],
          styles.body,
        )}
      >
        <p {...stylex.props(x.margin._0, styles.text)}>
          マーケティング、プロダクトマネジメント、バックエンド開発と領域を横断しながら、「何が本質的な課題か」を整理し、技術とビジネスの両面から解決策をかたちにしてきました。
        </p>
        <p {...stylex.props(x.margin._0, styles.text)}>
          課題発見力と分析力を土台に、行動力と成長意欲を持って最後までやり切ること。変化の大きい環境でも学び続け、周囲を巻き込みながら前進することが強みです。
        </p>
        <Link
          href="/about"
          {...stylex.props(
            x.display["inline-flex"],
            x.alignItems.center,
            x.alignSelf["flex-start"],
            x.textDecoration.none,
            styles.link,
          )}
        >
          詳しく →
        </Link>
      </div>
    </section>
  );
}
