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
          プロダクト思考で問いを立て、エンジニアリングで組み、デザインで届ける——三つのレイヤーを分断せずに扱ってきました。マーケティング、プロダクトマネジメント、エンジニアリングと領域を横断してきました。
        </p>
        <p {...stylex.props(x.margin._0, styles.text)}>
          AIが実装を加速するいまだからこそ、「何をつくるか」と「どう届けるか」がより問われます。課題の本質から入り、最後まで形にすることを大切にしています。
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
