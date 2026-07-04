import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  radius,
  spacing,
} from "@/lib/theme/tokens.stylex";

const SPACING_SCALE = [
  { name: "xxs", token: spacing.xxs },
  { name: "xs", token: spacing.xs },
  { name: "sm", token: spacing.sm },
  { name: "md", token: spacing.md },
  { name: "lg", token: spacing.lg },
  { name: "xl", token: spacing.xl },
  { name: "xxl", token: spacing.xxl },
  { name: "section", token: spacing.section },
] as const;

// Text labels are literals because tokens resolve to var() references at runtime.
const RADIUS_SCALE = [
  { name: "sm", token: radius.sm, value: "2px" },
  { name: "md", token: radius.md, value: "4px" },
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
  spacingList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  spacingRow: {
    gap: spacing.md,
  },
  spacingLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  spacingBar: {
    height: "3px",
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  radiusHeading: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    marginBottom: spacing.md,
  },
  radiusRow: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  radiusSample: {
    backgroundColor: colors.bgSubtle,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
  },
  radiusLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.fg,
    lineHeight: lineHeight.snug,
  },
  radiusValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgMuted,
  },
});

export function DesignSpacingSection() {
  return (
    <section
      aria-labelledby="design-spacing"
      {...stylex.props(sectionStyles.section)}
    >
      <h2
        id="design-spacing"
        {...stylex.props(sectionStyles.sectionLabel, x.textTransform.uppercase)}
      >
        03 — Spacing &amp; Radius
      </h2>
      <div
        {...stylex.props(
          sectionStyles.spacingList,
          x.display.flex,
          x.flexDirection.column,
        )}
      >
        {SPACING_SCALE.map((item) => (
          <div
            key={item.name}
            {...stylex.props(
              sectionStyles.spacingRow,
              x.display.grid,
              x.gridTemplateColumns["4rem 1fr"],
              x.alignItems.center,
            )}
          >
            <p {...stylex.props(sectionStyles.spacingLabel, x.margin._0)}>
              {item.name}
            </p>
            <div
              {...stylex.props(sectionStyles.spacingBar)}
              style={{ width: item.token }}
            />
          </div>
        ))}
      </div>

      <p
        {...stylex.props(
          sectionStyles.radiusHeading,
          x.textTransform.uppercase,
        )}
      >
        radius
      </p>
      {RADIUS_SCALE.map((item) => (
        <div
          key={item.name}
          {...stylex.props(
            sectionStyles.radiusRow,
            x.display.flex,
            x.alignItems.center,
          )}
        >
          <div
            {...stylex.props(
              sectionStyles.radiusSample,
              x.width["4rem"],
              x.height["4rem"],
            )}
            style={{ borderRadius: item.token }}
          />
          <div>
            <p {...stylex.props(sectionStyles.radiusLabel, x.margin._0)}>
              {item.name}
            </p>
            <p {...stylex.props(sectionStyles.radiusValue, x.margin._0)}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
