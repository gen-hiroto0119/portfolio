"use client";

import { useCallback, useEffect, useRef } from "react";

import { useTheme } from "@/components/theme/theme-provider";

import { useLabAnimation } from "../use-lab-animation";

// Canvas colors map to tokens: dark bg #0A0A0B / accent #FF4D00, light bg #F7F5F2 / accent #E64500
const PALETTE = {
  dark: {
    bg: "#0A0A0B",
    dot: "#EDEBE8",
    accent: "#FF4D00",
  },
  light: {
    bg: "#F7F5F2",
    dot: "#141414",
    accent: "#E64500",
  },
} as const;

type Point = {
  angle: number;
  radius: number;
  speed: number;
  x: number;
  y: number;
};

const POINT_COUNT = 48;
const LINK_DISTANCE = 72;

function createPoints(width: number, height: number): Point[] {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.38;

  return Array.from({ length: POINT_COUNT }, (_, index) => {
    const radius = maxRadius * (0.35 + (index / POINT_COUNT) * 0.65);
    const angle = (index / POINT_COUNT) * Math.PI * 2;
    return {
      angle,
      radius,
      speed: 0.00035 + (index % 7) * 0.00012,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });
}

export function OrbitLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const sizeRef = useRef({ width: 0, height: 0 });
  const { resolvedTheme } = useTheme();

  const draw = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = sizeRef.current;
      const palette = PALETTE[resolvedTheme];
      const cx = width / 2;
      const cy = height / 2;
      const time = timestamp * 0.001;

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      const points = pointsRef.current;

      for (const point of points) {
        point.angle += point.speed;
        const orbitX = cx + Math.cos(point.angle + time * 0.15) * point.radius;
        const orbitY = cy + Math.sin(point.angle + time * 0.12) * point.radius;

        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - orbitX;
          const dy = mouseRef.current.y - orbitY;
          const dist = Math.hypot(dx, dy);
          const pull = Math.max(0, 1 - dist / 140);
          point.x = orbitX + dx * pull * 0.22;
          point.y = orbitY + dy * pull * 0.22;
        } else {
          point.x = orbitX;
          point.y = orbitY;
        }
      }

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const a = points[i];
          const b = points[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DISTANCE) {
            const alpha = (1 - dist / LINK_DISTANCE) * 0.9;
            ctx.strokeStyle =
              resolvedTheme === "dark"
                ? `rgba(237, 235, 232, ${alpha * 0.18})`
                : `rgba(20, 20, 20, ${alpha * 0.14})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const point of points) {
        ctx.fillStyle = palette.dot;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.75, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    },
    [resolvedTheme],
  );

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    sizeRef.current = { width, height };
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (pointsRef.current.length === 0) {
      pointsRef.current = createPoints(width, height);
    }
  }, []);

  const containerRef = useLabAnimation({
    onFrame: draw,
    onStaticFrame: () => draw(0),
  });

  useEffect(() => {
    resize();
    draw(0);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize, draw, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        mouseRef.current = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          active: true,
        };
      }}
      onMouseLeave={() => {
        mouseRef.current.active = false;
      }}
    >
      <canvas ref={canvasRef} aria-hidden />
    </div>
  );
}
