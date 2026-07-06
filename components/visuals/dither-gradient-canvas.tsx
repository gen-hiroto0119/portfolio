"use client";

import { useCallback, useEffect, useRef } from "react";

import { useLabAnimation } from "@/components/lab/use-lab-animation";
import { useTheme } from "@/components/theme/theme-provider";

type ResolvedTheme = "dark" | "light";

// Canvas colors map to tokens: colors.bg / colors.accent (dark & light)
const PALETTE = {
  dark: { bg: "#0A0A0B", accent: "#FF4D00" },
  light: { bg: "#F7F5F2", accent: "#E64500" },
} as const;

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

type DitherGradientCanvasProps = {
  className?: string;
};

export function DitherGradientCanvas({ className }: DitherGradientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const { resolvedTheme } = useTheme();
  const themeRef = useRef<ResolvedTheme>(resolvedTheme);

  useEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    const palette = PALETTE[themeRef.current];
    const [bgR, bgG, bgB] = hexToRgb(palette.bg);
    const [accentR, accentG, accentB] = hexToRgb(palette.accent);
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const time = timestamp * 0.00035;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const nx = x / Math.max(width - 1, 1);
        const ny = y / Math.max(height - 1, 1);
        const wave =
          Math.sin(nx * 4 + time) * 0.08 +
          Math.cos(ny * 3 - time * 1.2) * 0.06;
        const gradient = nx * 0.55 + ny * 0.45 + wave;
        const threshold = (BAYER_4[y % 4][x % 4] + 0.5) / 16;
        const useAccent = gradient > threshold;
        const index = (y * width + x) * 4;

        data[index] = useAccent ? accentR : bgR;
        data[index + 1] = useAccent ? accentG : bgG;
        data[index + 2] = useAccent ? accentB : bgB;
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const vignette = ctx.createLinearGradient(0, 0, width, height);
    vignette.addColorStop(0, "rgba(0,0,0,0.08)");
    vignette.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    sizeRef.current = { width, height };
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, []);

  const containerRef = useLabAnimation({
    onFrame: draw,
    onStaticFrame: () => draw(0),
  });

  useEffect(() => {
    resize();
    draw(0);

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [resize, draw, resolvedTheme, containerRef]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <canvas ref={canvasRef} aria-hidden />
    </div>
  );
}
