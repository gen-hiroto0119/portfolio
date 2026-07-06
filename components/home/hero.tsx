"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { HeroStackLoop } from "@/components/home/hero-stack-loop";
import { useLocale } from "@/components/i18n/locale-provider";
import { DecryptedTextView } from "@/components/visuals/decrypted-text";
import { DitherGradientCanvas } from "@/components/visuals/dither-gradient-canvas";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  maxWidth,
  spacing,
} from "@/lib/theme/tokens.stylex";

/** Exact sticky header height: 4rem inner height + 1px bottom border. */
const HEADER_OFFSET = "calc(4rem + 1px)";

const scrollPulse = stylex.keyframes({
  "0%, 100%": {
    opacity: 1,
    transform: "translateY(0)",
  },
  "50%": {
    opacity: 0.45,
    transform: "translateY(2px)",
  },
});

const styles = stylex.create({
  section: {
    minHeight: `calc(100svh - ${HEADER_OFFSET})`,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  content: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    paddingBlock: spacing.xl,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
  },
  titleBlock: {
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.display,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
    color: colors.fg,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    color: colors.fgMuted,
  },
  bottomRow: {
    gap: spacing.lg,
  },
  scroll: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
    animationName: scrollPulse,
    animationDuration: "2400ms",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    "@media (prefers-reduced-motion: reduce)": {
      animationName: "none",
    },
  },
});

export function Hero() {
  const { t } = useLocale();
  const canvasClass = stylex.props(
    x.position.absolute,
    x.inset._0,
    x.width["100%"],
    x.height["100%"],
    x.pointerEvents.none,
  );

  return (
    <section
      {...stylex.props(
        x.position.relative,
        x.display.flex,
        x.flexDirection.column,
        x.overflow.hidden,
        styles.section,
      )}
    >
      <DitherGradientCanvas className={canvasClass.className ?? undefined} />
      <div
        {...stylex.props(
          x.position.relative,
          x.zIndex._1,
          x.display.flex,
          x.flexDirection.column,
          x.flex._1,
          x.width["100%"],
          styles.content,
        )}
      >
        <p {...stylex.props(x.textTransform.uppercase, styles.label)}>
          <DecryptedTextView text={t.hero.label} />
        </p>
        <div
          {...stylex.props(
            x.marginTop.auto,
            x.display.flex,
            x.alignItems["flex-end"],
            x.justifyContent["space-between"],
            styles.bottomRow,
          )}
        >
          <div
            {...stylex.props(
              x.display.flex,
              x.flexDirection.column,
              x.maxWidth["40rem"],
              styles.titleBlock,
            )}
          >
            <h1 {...stylex.props(x.margin._0, styles.title)}>
              <DecryptedTextView
                text="Hiroto Furugen"
                revealDirection="center"
                speed={50}
                viewDelay={560}
              />
            </h1>
            <p {...stylex.props(x.margin._0, x.maxWidth["36rem"], styles.tagline)}>
              <DecryptedTextView
                text={t.hero.tagline}
                speed={48}
                viewDelay={1180}
              />
            </p>
          </div>
          <p
            {...stylex.props(
              x.textTransform.uppercase,
              x.whiteSpace.nowrap,
              styles.scroll,
            )}
          >
            {t.hero.scroll}
          </p>
        </div>
        <HeroStackLoop />
      </div>
    </section>
  );
}
