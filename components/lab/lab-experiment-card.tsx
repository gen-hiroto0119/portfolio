import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import type { LabExperiment } from "@/lib/lab-registry";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  lineHeight,
  maxWidth,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  card: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  demo: {
    backgroundColor: colors.bgSubtle,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  meta: {
    gap: spacing.md,
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    lineHeight: lineHeight.snug,
    color: colors.fg,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    color: colors.fgMuted,
  },
});

type LabExperimentCardProps = {
  experiment: LabExperiment;
};

export function LabExperimentCard({ experiment }: LabExperimentCardProps) {
  const { Component, no, date, title, description } = experiment;

  return (
    <article
      {...stylex.props(
        x.display.flex,
        x.flexDirection.column,
        styles.card,
      )}
    >
      <div
        {...stylex.props(
          x.height["16rem"],
          x.overflow.hidden,
          styles.demo,
        )}
      >
        <Component />
      </div>
      <div
        {...stylex.props(
          x.display.flex,
          x.flexDirection.column,
          styles.body,
        )}
      >
        <div
          {...stylex.props(
            x.display.flex,
            x.justifyContent["space-between"],
            x.textTransform.uppercase,
            styles.meta,
          )}
        >
          <span>No. {no}</span>
          <span>{date}</span>
        </div>
        <h2 {...stylex.props(x.margin._0, styles.title)}>{title}</h2>
        <p {...stylex.props(x.margin._0, styles.description)}>
          {description}
        </p>
      </div>
    </article>
  );
}

const gridStyles = stylex.create({
  shell: {
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingInline: spacing.lg,
    paddingBottom: spacing.section,
  },
  grid: {
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 768px)": "1fr 1fr",
    },
    gap: spacing.lg,
  },
});

export function LabExperimentGrid({
  experiments,
}: {
  experiments: LabExperiment[];
}) {
  return (
    <section
      aria-label="Lab experiments"
      {...stylex.props(x.width["100%"], gridStyles.shell)}
    >
      <div {...stylex.props(x.display.grid, gridStyles.grid)}>
        {experiments.map((experiment) => (
          <LabExperimentCard key={experiment.id} experiment={experiment} />
        ))}
      </div>
    </section>
  );
}
