import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  spacing,
} from "@/lib/theme/tokens.stylex";

const SAMPLE_JA = "デザインとビジネスの文脈から、技術でかたちにする。";
const SAMPLE_EN = "The quick brown fox 0123";

const FONT_SAMPLES = [
  { label: "display", family: fonts.display },
  { label: "body", family: fonts.body },
  { label: "mono", family: fonts.mono },
] as const;

const FONT_SIZE_SCALE = [
  { name: "xs", size: fontSize.xs },
  { name: "sm", size: fontSize.sm },
  { name: "base", size: fontSize.base },
  { name: "lg", size: fontSize.lg },
  { name: "xl", size: fontSize.xl },
  { name: "xxl", size: fontSize.xxl },
  { name: "display", size: fontSize.display },
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
  stack: {
    gap: spacing.xl,
  },
  familyBlock: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  familyLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  sampleJa: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    color: colors.fg,
  },
  sampleEn: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    color: colors.fgMuted,
  },
  scaleHeading: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  scaleList: {
    gap: spacing.md,
  },
  scaleRow: {
    gap: spacing.xxs,
  },
  scaleMeta: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgFaint,
  },
  scaleSample: {
    fontFamily: fonts.body,
    lineHeight: lineHeight.tight,
    color: colors.fg,
  },
});

export function DesignTypographySection() {
  return (
    <section
      aria-labelledby="design-typography"
      {...stylex.props(sectionStyles.section)}
    >
      <h2
        id="design-typography"
        {...stylex.props(sectionStyles.sectionLabel, x.textTransform.uppercase)}
      >
        02 — Typography
      </h2>
      <div
        {...stylex.props(
          sectionStyles.stack,
          x.display.flex,
          x.flexDirection.column,
        )}
      >
        {FONT_SAMPLES.map((sample) => (
          <div
            key={sample.label}
            {...stylex.props(
              sectionStyles.familyBlock,
              x.display.flex,
              x.flexDirection.column,
            )}
          >
            <p
              {...stylex.props(
                sectionStyles.familyLabel,
                x.textTransform.uppercase,
                x.margin._0,
              )}
            >
              {sample.label}
            </p>
            <p
              {...stylex.props(sectionStyles.sampleJa, x.margin._0)}
              style={{ fontFamily: sample.family }}
            >
              {SAMPLE_JA}
            </p>
            <p
              {...stylex.props(sectionStyles.sampleEn, x.margin._0)}
              style={{ fontFamily: sample.family }}
            >
              {SAMPLE_EN}
            </p>
          </div>
        ))}

        <div>
          <p
            {...stylex.props(
              sectionStyles.scaleHeading,
              x.textTransform.uppercase,
            )}
          >
            fontSize scale
          </p>
          <div
            {...stylex.props(
              sectionStyles.scaleList,
              x.display.flex,
              x.flexDirection.column,
            )}
          >
            {FONT_SIZE_SCALE.map((item) => (
              <div
                key={item.name}
                {...stylex.props(
                  sectionStyles.scaleRow,
                  x.display.flex,
                  x.flexDirection.column,
                )}
              >
                <p {...stylex.props(sectionStyles.scaleMeta, x.margin._0)}>
                  {item.name}
                </p>
                <p
                  {...stylex.props(sectionStyles.scaleSample, x.margin._0)}
                  style={{ fontSize: item.size }}
                >
                  {SAMPLE_EN}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
