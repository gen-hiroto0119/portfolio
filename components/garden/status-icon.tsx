import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import type { GardenStatus } from "@/components/garden/garden-status";
import { getStatusLabel } from "@/components/garden/garden-status";
import { colors, fontSize, fonts, spacing } from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  root: {
    gap: spacing.xs,
  },
  icon: {
    width: fontSize.sm,
    height: fontSize.sm,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.fgMuted,
  },
  labelEvergreen: {
    color: colors.accent,
  },
});

type StatusIconProps = {
  status: GardenStatus;
  showLabel?: boolean;
};

export function StatusIcon({ status, showLabel = false }: StatusIconProps) {
  const isEvergreen = status === "evergreen";

  return (
    <span
      {...stylex.props(
        styles.root,
        x.display["inline-flex"],
        x.alignItems.center,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        {...stylex.props(styles.icon, x.flexShrink._0)}
      >
        {status === "seedling" ? (
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke={colors.fgMuted}
            strokeWidth="1.5"
          />
        ) : null}
        {status === "budding" ? (
          <>
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke={colors.fgMuted}
              strokeWidth="1.5"
            />
            <path d="M8 2 A6 6 0 0 1 8 14 Z" fill={colors.fgMuted} />
          </>
        ) : null}
        {status === "evergreen" ? (
          <circle cx="8" cy="8" r="6" fill={colors.accent} />
        ) : null}
      </svg>
      {showLabel ? (
        <span
          {...stylex.props(styles.label, isEvergreen && styles.labelEvergreen)}
        >
          {getStatusLabel(status)}
        </span>
      ) : null}
    </span>
  );
}
