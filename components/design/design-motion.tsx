"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";
import { useState } from "react";

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

const MOTION_DEMOS = [
  { name: "durationFast", duration: motion.durationFast },
  { name: "durationBase", duration: motion.durationBase },
  { name: "durationSlow", duration: motion.durationSlow },
] as const;

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
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 640px)": "repeat(3, 1fr)",
    },
    gap: spacing.lg,
  },
  demo: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  track: {
    backgroundColor: colors.bgSubtle,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  box: {
    left: spacing.sm,
    marginTop: "-0.625rem",
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    transitionProperty: "transform",
    transitionTimingFunction: motion.easing,
    transform: "translateX(0)",
  },
  boxActive: {
    transform: "translateX(calc(100% + 4rem))",
  },
  easing: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fg,
    marginTop: spacing.md,
    lineHeight: lineHeight.snug,
  },
  easingValue: {
    color: colors.fgMuted,
  },
});

type MotionDemoProps = {
  name: string;
  duration: string;
};

function MotionDemo({ name, duration }: MotionDemoProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      {...stylex.props(
        sectionStyles.demo,
        x.display.flex,
        x.flexDirection.column,
        x.minHeight["6rem"],
        x.justifyContent.center,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p {...stylex.props(sectionStyles.label, x.margin._0)}>{name}</p>
      <div
        {...stylex.props(
          sectionStyles.track,
          x.position.relative,
          x.height["2rem"],
          x.overflow.hidden,
        )}
      >
        <div
          {...stylex.props(
            sectionStyles.box,
            x.position.absolute,
            x.top["50%"],
            x.width["1.25rem"],
            x.height["1.25rem"],
            hovered && sectionStyles.boxActive,
          )}
          style={{ transitionDuration: duration }}
        />
      </div>
    </div>
  );
}

export function DesignMotionSection() {
  return (
    <section aria-labelledby="design-motion" {...stylex.props(sectionStyles.section)}>
      <h2
        id="design-motion"
        {...stylex.props(sectionStyles.sectionLabel, x.textTransform.uppercase)}
      >
        04 — Motion
      </h2>
      <div {...stylex.props(sectionStyles.grid)}>
        {MOTION_DEMOS.map((demo) => (
          <MotionDemo key={demo.name} name={demo.name} duration={demo.duration} />
        ))}
      </div>
      <p {...stylex.props(sectionStyles.easing)}>
        easing{" "}
        <span {...stylex.props(sectionStyles.easingValue)}>
          cubic-bezier(0.2, 0, 0, 1)
        </span>
      </p>
    </section>
  );
}
