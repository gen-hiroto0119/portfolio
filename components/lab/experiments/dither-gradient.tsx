"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { DitherGradientCanvas } from "@/components/visuals/dither-gradient-canvas";

const styles = stylex.create({
  container: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 10",
  },
});

export function DitherGradient() {
  return (
    <DitherGradientCanvas
      className={stylex.props(styles.container).className ?? undefined}
    />
  );
}
