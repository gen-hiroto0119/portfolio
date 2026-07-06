"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

import { useTheme } from "@/components/theme/theme-provider";

import "./border-glow.css";

type HSL = { h: number; s: number; l: number };

type BorderGlowProps = {
  children: ReactNode;
  className?: string;
  fill?: boolean;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  idleSpin?: boolean;
  idleSpinDuration?: number;
  idleProximity?: number;
  colors?: string[];
  fillOpacity?: number;
};

const GRADIENT_POSITIONS = [
  "80% 55%",
  "69% 34%",
  "8% 6%",
  "41% 38%",
  "86% 85%",
  "82% 18%",
  "51% 4%",
] as const;

const GRADIENT_KEYS = [
  "--gradient-one",
  "--gradient-two",
  "--gradient-three",
  "--gradient-four",
  "--gradient-five",
  "--gradient-six",
  "--gradient-seven",
] as const;

const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1] as const;

const THEME_GLOW = {
  dark: {
    backgroundColor: "#0A0A0B",
    glowColor: "18 100 55",
    colors: ["#FF4D00", "#3F4658", "#55534E"],
  },
  light: {
    backgroundColor: "#F7F5F2",
    glowColor: "18 90 48",
    colors: ["#E64500", "#C2BDB4", "#8A8782"],
  },
} as const;

function parseHSL(hslStr: string): HSL {
  const match = hslStr.match(/([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
  if (!match) return { h: 18, s: 100, l: 55 };
  return {
    h: Number.parseFloat(match[1]),
    s: Number.parseFloat(match[2]),
    l: Number.parseFloat(match[3]),
  };
}

function buildGlowVars(
  glowColor: string,
  intensity: number,
): Record<string, string> {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
  const vars: Record<string, string> = {};

  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] =
      `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }

  return vars;
}

function buildGradientVars(colors: string[]): Record<string, string> {
  const vars: Record<string, string> = {};

  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] =
      `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }

  vars["--gradient-base"] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function easeOutCubic(x: number): number {
  return 1 - (1 - x) ** 3;
}

function easeInCubic(x: number): number {
  return x * x * x;
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (x: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
}): void {
  const t0 = performance.now() + delay;

  function tick(): void {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) {
      requestAnimationFrame(tick);
    } else if (onEnd) {
      onEnd();
    }
  }

  setTimeout(() => requestAnimationFrame(tick), delay);
}

export function BorderGlow({
  children,
  className = "",
  fill = false,
  edgeSensitivity = 28,
  glowColor,
  backgroundColor,
  borderRadius = 4,
  glowRadius = 28,
  glowIntensity = 0.85,
  coneSpread = 22,
  animated = false,
  idleSpin = false,
  idleSpinDuration = 10_000,
  idleProximity = 58,
  colors,
  fillOpacity = 0.35,
}: BorderGlowProps) {
  const { resolvedTheme } = useTheme();
  const themeGlow = THEME_GLOW[resolvedTheme];
  const cardRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const idleFrameRef = useRef<number | undefined>(undefined);

  const resolvedBackground = backgroundColor ?? themeGlow.backgroundColor;
  const resolvedGlowColor = glowColor ?? themeGlow.glowColor;
  const resolvedColors = colors ?? [...themeGlow.colors];

  const getCenterOfElement = useCallback((el: HTMLElement): [number, number] => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback(
    (el: HTMLElement, x: number, y: number): number => {
      const [cx, cy] = getCenterOfElement(el);
      const dx = x - cx;
      const dy = y - cy;
      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    },
    [getCenterOfElement],
  );

  const getCursorAngle = useCallback(
    (el: HTMLElement, x: number, y: number): number => {
      const [cx, cy] = getCenterOfElement(el);
      const dx = x - cx;
      const dy = y - cy;
      if (dx === 0 && dy === 0) return 0;
      const radians = Math.atan2(dy, dx);
      let degrees = radians * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      return degrees;
    },
    [getCenterOfElement],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const edge = getEdgeProximity(card, x, y);
      const angle = getCursorAngle(card, x, y);

      card.style.setProperty("--edge-proximity", `${(edge * 100).toFixed(3)}`);
      card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
    },
    [getEdgeProximity, getCursorAngle],
  );

  const handlePointerEnter = useCallback(() => {
    isHoveredRef.current = true;
  }, []);

  const handlePointerLeave = useCallback(() => {
    isHoveredRef.current = false;
  }, []);

  useEffect(() => {
    if (!idleSpin || !cardRef.current) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const card = cardRef.current;
    card.classList.add("border-glow-card--idle-spin");

    let start: number | null = null;

    const tick = (now: number): void => {
      if (
        !isHoveredRef.current &&
        !card.classList.contains("sweep-active")
      ) {
        if (start === null) start = now;
        const elapsed = now - start;
        const angle =
          (360 - ((elapsed / idleSpinDuration) * 360) % 360) % 360;
        card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
        card.style.setProperty("--edge-proximity", String(idleProximity));
      }

      idleFrameRef.current = requestAnimationFrame(tick);
    };

    idleFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (idleFrameRef.current !== undefined) {
        cancelAnimationFrame(idleFrameRef.current);
      }
      card.classList.remove("border-glow-card--idle-spin");
    };
  }, [idleSpin, idleSpinDuration, idleProximity]);

  useEffect(() => {
    if (!animated || !cardRef.current) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const card = cardRef.current;
    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add("sweep-active");
    card.style.setProperty("--cursor-angle", `${angleStart}deg`);

    animateValue({
      duration: 500,
      onUpdate: (value) =>
        card.style.setProperty("--edge-proximity", String(value)),
    });
    animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: (value) => {
        card.style.setProperty(
          "--cursor-angle",
          `${((angleEnd - angleStart) * value) / 100 + angleStart}deg`,
        );
      },
    });
    animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: (value) => {
        card.style.setProperty(
          "--cursor-angle",
          `${((angleEnd - angleStart) * value) / 100 + angleStart}deg`,
        );
      },
    });
    animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: (value) =>
        card.style.setProperty("--edge-proximity", String(value)),
      onEnd: () => card.classList.remove("sweep-active"),
    });
  }, [animated]);

  const glowVars = buildGlowVars(resolvedGlowColor, glowIntensity);

  const style: CSSProperties = {
    "--card-bg": resolvedBackground,
    "--edge-sensitivity": edgeSensitivity,
    "--border-radius": `${borderRadius}px`,
    "--glow-padding": `${glowRadius}px`,
    "--cone-spread": coneSpread,
    "--fill-opacity": fillOpacity,
    ...glowVars,
    ...buildGradientVars(resolvedColors),
  } as CSSProperties;

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      className={`border-glow-card${fill ? " border-glow-fill" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      <span className="edge-light" aria-hidden />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
