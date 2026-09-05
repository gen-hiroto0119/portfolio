"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme/theme-provider";

import { useLabAnimation } from "../use-lab-animation";

const GLYPHS = ["あ", "A", "■", "0", "×", "◇"] as const;

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
      className="h-full w-full"
      onMouseMove={(event) => {
        mouseRef.current = { x: event.clientX, y: event.clientY };
      }}
      onMouseLeave={() => {
        mouseRef.current = { x: -9999, y: -9999 };
      }}
    >
      <div
        ref={gridRef}
        className="grid h-full w-full grid-cols-12 grid-rows-6 items-center justify-items-center font-mono select-none"
      >
        {cells.map((cell, index) => (
          <span
            key={index}
            className={`transition-[opacity,transform,color] duration-[80ms] ease-linear motion-reduce:transition-none ${cell.glyphIndex >= 3 ? "text-accent" : "text-foreground"}`}
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
