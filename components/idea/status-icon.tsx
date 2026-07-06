import { Circle, CircleDot } from "lucide-react";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import type { IdeaStatus } from "@/components/idea/idea-status";
import { getStatusLabel } from "@/components/idea/idea-status";
import { iconSize, iconStroke } from "@/lib/icons";
import { colors, fontSize, fonts, spacing } from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  root: {
    gap: spacing.xs,
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
  status: IdeaStatus;
  showLabel?: boolean;
};

function StatusGlyph({ status }: { status: IdeaStatus }) {
  const props = {
    size: iconSize,
    strokeWidth: iconStroke,
    "aria-hidden": true as const,
  };

  switch (status) {
    case "seedling":
      return <Circle {...props} />;
    case "budding":
      return <CircleDot {...props} />;
    case "evergreen":
      return (
        <Circle
          {...props}
          fill={colors.accent}
          stroke={colors.accent}
        />
      );
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

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
      <StatusGlyph status={status} />
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
