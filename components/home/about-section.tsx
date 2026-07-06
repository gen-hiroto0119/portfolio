"use client";

import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { useLocale } from "@/components/i18n/locale-provider";
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
  const { t } = useLocale();

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
        <p {...stylex.props(x.margin._0, styles.text)}>{t.home.about.p1}</p>
        <p {...stylex.props(x.margin._0, styles.text)}>{t.home.about.p2}</p>
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
          {t.home.about.link}
        </Link>
      </div>
    </section>
  );
}
