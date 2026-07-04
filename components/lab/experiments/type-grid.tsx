"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme/theme-provider";
import { colors, fonts } from "@/lib/theme/tokens.stylex";

import { useLabAnimation } from "../use-lab-animation";

const GLYPHS = ["あ", "A", "■", "0", "×", "◇"] as const;

const styles = stylex.create({
  grid: {
    fontFamily: fonts.mono,
  },
  cell: {
    color: colors.fg,
    transitionProperty: "opacity, transform, color",
    transitionDuration: "80ms",
    transitionTimingFunction: "linear",
    willChange: "transform, opacity",
  },
  cellAccent: {
    color: colors.accent,
  },
});

type CellState = {
  opacity: number;
  scale: number;
  glyphIndex: number;
};

const COLS = 12;
const ROWS = 6;

export function TypeGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const [cells, setCells] = useState<CellState[]>(() =>
    Array.from({ length: COLS * ROWS }, () => ({
      opacity: 0.18,
      scale: 1,
      glyphIndex: 0,
    })),
  );
  const { resolvedTheme } = useTheme();

  const updateCells = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const rect = grid.getBoundingClientRect();
    const cellWidth = rect.width / COLS;
    const cellHeight = rect.height / ROWS;

    setCells(
      Array.from({ length: COLS * ROWS }, (_, index) => {
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        const cx = rect.left + col * cellWidth + cellWidth / 2;
        const cy = rect.top + row * cellHeight + cellHeight / 2;
        const dist = Math.hypot(mouseRef.current.x - cx, mouseRef.current.y - cy);
        const influence = Math.max(0, 1 - dist / 160);
        const glyphIndex = Math.min(
          GLYPHS.length - 1,
          Math.floor(influence * GLYPHS.length),
        );

        return {
          opacity: lerp(0.12, 1, influence),
          scale: lerp(0.85, 1.35, influence),
          glyphIndex,
        };
      }),
    );
  }, []);

  const containerRef = useLabAnimation({
    onFrame: updateCells,
    onStaticFrame: updateCells,
  });

  useEffect(() => {
    updateCells();
  }, [updateCells, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
      onMouseMove={(event) => {
        mouseRef.current = { x: event.clientX, y: event.clientY };
      }}
      onMouseLeave={() => {
        mouseRef.current = { x: -9999, y: -9999 };
      }}
    >
      <div
        ref={gridRef}
        {...stylex.props(
          x.display.grid,
          x.gridTemplateColumns["repeat(12, 1fr)"],
          x.gridTemplateRows["repeat(6, 1fr)"],
          x.width["100%"],
          x.height["100%"],
          x.alignItems.center,
          x.justifyItems.center,
          x.userSelect.none,
          styles.grid,
        )}
      >
        {cells.map((cell, index) => (
          <span
            key={index}
            {...stylex.props(
              styles.cell,
              cell.glyphIndex >= 3 && styles.cellAccent,
            )}
            style={{
              opacity: cell.opacity,
              transform: `scale(${cell.scale})`,
            }}
          >
            {GLYPHS[cell.glyphIndex]}
          </span>
        ))}
      </div>
    </div>
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
