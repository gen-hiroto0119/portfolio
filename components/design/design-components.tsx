"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";
import Link from "next/link";

import { useCommandPalette } from "@/components/command-palette/command-palette-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  motion,
  radius,
  spacing,
} from "@/lib/theme/tokens.stylex";

const sectionStyles = stylex.create({
  section: {
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  group: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  link: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.snug,
    color: colors.fg,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.accent,
    },
  },
  button: {
    paddingBlock: spacing.xs,
    paddingInline: spacing.md,
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    color: colors.accentFg,
    backgroundColor: colors.accent,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.accent,
    borderRadius: radius.md,
    transitionProperty: "background-color, border-color, color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      backgroundColor: colors.fg,
      borderColor: colors.fg,
      color: colors.bg,
    },
    ":focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: colors.accent,
      outlineOffset: "2px",
    },
  },
  ghostButton: {
    paddingBlock: spacing.xs,
    paddingInline: spacing.md,
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    color: colors.fg,
    backgroundColor: "transparent",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.md,
    transitionProperty: "color, border-color, background-color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.fg,
      borderColor: colors.borderStrong,
      backgroundColor: colors.bgSubtle,
    },
    ":focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: colors.accent,
      outlineOffset: "2px",
    },
  },
});

export function DesignComponentsSection() {
  const { openPalette } = useCommandPalette();

  return (
    <section
      aria-labelledby="design-components"
      {...stylex.props(sectionStyles.section)}
    >
      <h2
        id="design-components"
        {...stylex.props(sectionStyles.sectionLabel, x.textTransform.uppercase)}
      >
        05 — Components
      </h2>
      <div
        {...stylex.props(
          sectionStyles.group,
          x.display.flex,
          x.flexDirection.column,
        )}
      >
        <div
          {...stylex.props(
            sectionStyles.row,
            x.display.flex,
            x.flexWrap.wrap,
            x.alignItems.center,
          )}
        >
          <p
            {...stylex.props(
              sectionStyles.rowLabel,
              x.textTransform.uppercase,
              x.width["100%"],
              x.margin._0,
            )}
          >
            Theme toggle
          </p>
          <ThemeToggle />
        </div>

        <div
          {...stylex.props(
            sectionStyles.row,
            x.display.flex,
            x.flexWrap.wrap,
            x.alignItems.center,
          )}
        >
          <p
            {...stylex.props(
              sectionStyles.rowLabel,
              x.textTransform.uppercase,
              x.width["100%"],
              x.margin._0,
            )}
          >
            Command palette
          </p>
          <button
            type="button"
            {...stylex.props(
              sectionStyles.ghostButton,
              x.display["inline-flex"],
              x.alignItems.center,
              x.justifyContent.center,
              x.cursor.pointer,
            )}
            onClick={openPalette}
          >
            ⌘K を試す
          </button>
        </div>

        <div
          {...stylex.props(
            sectionStyles.row,
            x.display.flex,
            x.flexWrap.wrap,
            x.alignItems.center,
          )}
        >
          <p
            {...stylex.props(
              sectionStyles.rowLabel,
              x.textTransform.uppercase,
              x.width["100%"],
              x.margin._0,
            )}
          >
            Links
          </p>
          <Link
            href="/design"
            {...stylex.props(sectionStyles.link, x.textDecoration.none)}
          >
            インラインリンク
          </Link>
        </div>

        <div
          {...stylex.props(
            sectionStyles.row,
            x.display.flex,
            x.flexWrap.wrap,
            x.alignItems.center,
          )}
        >
          <p
            {...stylex.props(
              sectionStyles.rowLabel,
              x.textTransform.uppercase,
              x.width["100%"],
              x.margin._0,
            )}
          >
            Buttons
          </p>
          <button
            type="button"
            {...stylex.props(
              sectionStyles.button,
              x.display["inline-flex"],
              x.alignItems.center,
              x.justifyContent.center,
              x.cursor.pointer,
            )}
          >
            Primary
          </button>
          <button
            type="button"
            {...stylex.props(
              sectionStyles.ghostButton,
              x.display["inline-flex"],
              x.alignItems.center,
              x.justifyContent.center,
              x.cursor.pointer,
            )}
          >
            Ghost
          </button>
        </div>
      </div>
    </section>
  );
}
