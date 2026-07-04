"use client";

import { useEffect, useRef } from "react";

import { useTheme } from "@/components/theme/theme-provider";
import { createNoise3D, createSeededRandom } from "@/lib/noise";

type ResolvedTheme = "dark" | "light";

type Particle = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  strokeStyle: string;
};

const FLOW_SCALE = 0.0028;
const FLOW_SPEED = 0.65;
const MOUSE_RADIUS = 140;
const MOUSE_STRENGTH = 2.4;
const CYCLE_MS = 20_000;
const FADE_MS = 2_000;
const STATIC_STEPS = 4_000;
const MAX_DPR = 2;

// Canvas cannot read CSS variables — hardcoded to match tokens.stylex colors.
const PARTICLE_COLORS = {
  dark: {
    base: "rgba(237, 235, 232, 0.07)", // colors.fg #EDEBE8
    accent: "rgba(255, 77, 0, 0.28)", // colors.accent #FF4D00
    trailFade: "rgba(10, 10, 11, 0.015)", // colors.bg #0A0A0B
    cycleFade: "rgba(10, 10, 11, 0.12)",
  },
  light: {
    base: "rgba(10, 10, 11, 0.07)", // colors.bg
    accent: "rgba(230, 69, 0, 0.28)", // light accent #E64500
    trailFade: "rgba(237, 235, 232, 0.02)", // colors.fg
    cycleFade: "rgba(237, 235, 232, 0.14)",
  },
} as const;

function particleCount(width: number, height: number): number {
  const area = width * height;
  return Math.min(900, Math.max(500, Math.floor(area / 1_800)));
}

function createParticles(
  width: number,
  height: number,
  theme: ResolvedTheme,
  seed: number,
): Particle[] {
  const random = createSeededRandom(seed);
  const palette = PARTICLE_COLORS[theme];
  const count = particleCount(width, height);

  return Array.from({ length: count }, () => {
    const isAccent = random() < 0.05;
    const x = random() * width;
    const y = random() * height;
    return {
      x,
      y,
      prevX: x,
      prevY: y,
      strokeStyle: isAccent ? palette.accent : palette.base,
    };
  });
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  noise: (x: number, y: number, z: number) => number,
  width: number,
  height: number,
  timeZ: number,
  mouseX: number,
  mouseY: number,
  hasMouse: boolean,
): void {
  for (const particle of particles) {
    particle.prevX = particle.x;
    particle.prevY = particle.y;

    const angle =
      noise(particle.x * FLOW_SCALE, particle.y * FLOW_SCALE, timeZ) *
      Math.PI *
      4;
    let vx = Math.cos(angle) * FLOW_SPEED;
    let vy = Math.sin(angle) * FLOW_SPEED;

    if (hasMouse) {
      const dx = particle.x - mouseX;
      const dy = particle.y - mouseY;
      const distSq = dx * dx + dy * dy;
      const radiusSq = MOUSE_RADIUS * MOUSE_RADIUS;
      if (distSq < radiusSq && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / MOUSE_RADIUS) * MOUSE_STRENGTH;
        vx += (dx / dist) * force;
        vy += (dy / dist) * force;
      }
    }

    particle.x += vx;
    particle.y += vy;

    // When wrapping, reset prev to avoid drawing a line across the canvas.
    let wrapped = false;
    if (particle.x < 0) {
      particle.x = width;
      wrapped = true;
    } else if (particle.x > width) {
      particle.x = 0;
      wrapped = true;
    }
    if (particle.y < 0) {
      particle.y = height;
      wrapped = true;
    } else if (particle.y > height) {
      particle.y = 0;
      wrapped = true;
    }
    if (wrapped) {
      particle.prevX = particle.x;
      particle.prevY = particle.y;
      continue;
    }

    ctx.beginPath();
    ctx.strokeStyle = particle.strokeStyle;
    ctx.lineWidth = 0.75;
    ctx.moveTo(particle.prevX, particle.prevY);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();
  }
}

type GenerativeHeroProps = {
  className?: string;
};

export function GenerativeHero({ className }: GenerativeHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let seed = Math.floor(Math.random() * 1_000_000);
    let particles: Particle[] = [];
    let noise = createNoise3D(seed);
    let rafId = 0;
    let cycleStart = 0;
    let timeZ = 0;
    let mouseX = 0;
    let mouseY = 0;
    let hasMouse = false;
    let isVisible = !document.hidden;
    let isRunning = false;

    const palette = () => PARTICLE_COLORS[resolvedTheme];

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      particles = createParticles(width, height, resolvedTheme, seed);
      return ctx;
    };

    const reinitCycle = (ctx: CanvasRenderingContext2D) => {
      seed = (seed + 1_337) % 1_000_000;
      noise = createNoise3D(seed);
      cycleStart = performance.now();
      timeZ = 0;
      ctx.clearRect(0, 0, width, height);
      particles = createParticles(width, height, resolvedTheme, seed);
    };

    const handlePointer = (clientX: number, clientY: number) => {
      const rect = parent.getBoundingClientRect();
      mouseX = clientX - rect.left;
      mouseY = clientY - rect.top;
      hasMouse = true;
    };

    const onMouseMove = (event: MouseEvent) => {
      handlePointer(event.clientX, event.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        handlePointer(touch.clientX, touch.clientY);
      }
    };

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !reducedMotion && !isRunning) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const tick = (now: number) => {
      isRunning = true;
      const ctx = canvas.getContext("2d");
      if (!ctx || width === 0 || height === 0) {
        isRunning = false;
        return;
      }

      if (!isVisible) {
        isRunning = false;
        return;
      }

      const elapsed = now - cycleStart;

      if (elapsed >= CYCLE_MS) {
        const fadeProgress = Math.min(1, (elapsed - CYCLE_MS) / FADE_MS);
        ctx.fillStyle = palette().cycleFade;
        ctx.globalAlpha = 0.25 + fadeProgress * 0.55;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;

        if (fadeProgress >= 1) {
          reinitCycle(ctx);
        }
      } else {
        ctx.fillStyle = palette().trailFade;
        ctx.fillRect(0, 0, width, height);
      }

      timeZ += 0.00035;
      drawFrame(
        ctx,
        particles,
        noise,
        width,
        height,
        timeZ,
        mouseX,
        mouseY,
        hasMouse,
      );

      rafId = requestAnimationFrame(tick);
    };

    let ctx = resize();
    if (!ctx) return;

    cycleStart = performance.now();

    if (reducedMotion) {
      for (let step = 0; step < STATIC_STEPS; step++) {
        timeZ += 0.00035;
        drawFrame(
          ctx,
          particles,
          noise,
          width,
          height,
          timeZ,
          width * 0.5,
          height * 0.5,
          false,
        );
      }
    } else {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibilityChange);
      rafId = requestAnimationFrame(tick);
    }

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      isRunning = false;
      ctx = resize();
      if (!ctx) return;

      if (reducedMotion) {
        for (let step = 0; step < STATIC_STEPS; step++) {
          timeZ += 0.00035;
          drawFrame(
            ctx,
            particles,
            noise,
            width,
            height,
            timeZ,
            width * 0.5,
            height * 0.5,
            false,
          );
        }
      } else {
        cycleStart = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    });
    resizeObserver.observe(parent);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
