"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./ascii-portrait.module.css";

const GLYPHS = ".:-=+*TERA%#@";
const PORTRAITS = {
  light: {
    source: "/portfolio/thinker-coverage.webp",
    fallback: "/portfolio/thinker-preview.webp",
    ink: "#244cff",
    label: "青いASCII文字で描いた、顎に手を添えて考える人",
  },
  dark: {
    // SMK's photograph of the David head cast, KAS2232, released under CC0:
    // https://commons.wikimedia.org/wiki/File:Michelangelo_Buonarroti,_Hoved_fra_statuen_af_David,_,_KAS2232,_Statens_Museum_for_Kunst.jpg
    source: "/portfolio/david-photo.webp",
    fallback: "/portfolio/david-ascii.svg",
    ink: "#648cff",
    label: "写真の明暗を青いASCII文字に変換したダビデ像",
  },
};

type Letter = {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  glyph: number;
};

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  preference.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    preference.removeEventListener("change", onChange);
  };
}

function currentTheme(): keyof typeof PORTRAITS {
  const theme = document.documentElement.dataset.theme;
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function serverTheme() {
  return null;
}

export function AsciiPortrait() {
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme, serverTheme);
  return <><Portrait mode="light" active={theme === "light"} /><Portrait mode="dark" active={theme === "dark"} /></>;
}

function Portrait({ mode, active }: { mode: keyof typeof PORTRAITS; active: boolean }) {
  const portrait = PORTRAITS[mode];
  const frameRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!frame || !canvas || !context) return;

    const source = new window.Image();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let disposed = false;
    let loaded = false;
    let visible = true;
    let animation = 0;
    let previousTime = 0;
    let width = 0;
    let height = 0;
    let cellWidth = 0;
    let cellHeight = 0;
    let letters: Letter[] = [];
    let atlas: HTMLCanvasElement | null = null;
    let atlasSize = 0;
    const pointer = { x: 0, y: 0, active: false };

    function paint() {
      if (!context || !atlas) return;
      context.clearRect(0, 0, width, height);
      const size = cellHeight * 1.45;
      for (const letter of letters) {
        context.drawImage(
          atlas,
          letter.glyph * atlasSize, 0, atlasSize, atlasSize,
          letter.x + letter.offsetX - size / 2,
          letter.y + letter.offsetY - size / 2,
          size, size,
        );
      }
    }

    function reset() {
      cancelAnimationFrame(animation);
      animation = 0;
      previousTime = 0;
      pointer.active = false;
      for (const letter of letters) {
        letter.offsetX = 0;
        letter.offsetY = 0;
      }
      paint();
    }

    function tick(time: number) {
      animation = 0;
      if (disposed || !visible || document.hidden || reducedMotion.matches) return;
      const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60;
      previousTime = time;
      const ease = 1 - Math.exp(-12 * dt);
      const radius = Math.min(width * 0.2, 90);
      let unsettled = false;

      for (const letter of letters) {
        const dx = letter.x - pointer.x;
        const dy = letter.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const influence = pointer.active ? Math.max(0, 1 - distance / radius) ** 2 : 0;
        const force = influence * cellWidth * 2.8;
        const targetX = dx / Math.max(distance, 1) * force;
        const targetY = dy / Math.max(distance, 1) * force;
        letter.offsetX += (targetX - letter.offsetX) * ease;
        letter.offsetY += (targetY - letter.offsetY) * ease;
        if (Math.abs(targetX - letter.offsetX) + Math.abs(targetY - letter.offsetY) > 0.025) {
          unsettled = true;
        } else {
          letter.offsetX = targetX;
          letter.offsetY = targetY;
        }
      }
      paint();
      if (unsettled) animation = requestAnimationFrame(tick);
      else previousTime = 0;
    }

    function wake() {
      if (!animation && loaded && visible && !document.hidden && !reducedMotion.matches) {
        animation = requestAnimationFrame(tick);
      }
    }

    function resize() {
      if (!frame || !canvas || !context || !loaded) return;
      const nextWidth = frame.getBoundingClientRect().width;
      if (nextWidth <= 0) return;
      reset();
      width = nextWidth;
      height = width * 2 / 3;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Keep narrow screens detailed, without a sudden density jump at a breakpoint.
      const columns = Math.round(Math.min(90, Math.max(80, 80 + (width - 272) * 10 / 268)));
      const rows = Math.round(columns / 1.85);
      cellWidth = width / columns;
      cellHeight = height / rows;
      const sample = document.createElement("canvas");
      sample.width = columns;
      sample.height = rows;
      const sampling = sample.getContext("2d", { willReadFrequently: true });
      if (!sampling) return;
      sampling.drawImage(source, 0, 0, columns, rows);
      const pixels = sampling.getImageData(0, 0, columns, rows).data;
      letters = [];
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const i = (row * columns + column) * 4;
          // Thinker's small grayscale source contains precomputed blue ink coverage.
          const luminance = (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) / 255;
          const coverage = mode === "dark"
            ? Math.max(0, (luminance - 0.09) / 0.84)
            : luminance;
          if (coverage < 0.035) continue;
          const tone = mode === "dark"
            ? Math.min(1, coverage) ** 1.8
            : Math.min(1, coverage / 0.55) ** 0.85;
          letters.push({
            x: (column + 0.5) * cellWidth,
            y: (row + 0.5) * cellHeight,
            offsetX: 0,
            offsetY: 0,
            glyph: Math.min(GLYPHS.length - 1, Math.floor(tone * GLYPHS.length)),
          });
        }
      }

      // Rasterize the small alphabet once, rather than typesetting on every frame.
      atlasSize = Math.ceil(cellHeight * 1.45 * dpr);
      atlas = document.createElement("canvas");
      atlas.width = atlasSize * GLYPHS.length;
      atlas.height = atlasSize;
      const ink = atlas.getContext("2d");
      if (!ink) return;
      ink.fillStyle = portrait.ink;
      ink.font = `500 ${cellHeight * 1.16 * dpr}px "JetBrains Mono Variable", monospace`;
      ink.textAlign = "center";
      ink.textBaseline = "middle";
      for (let index = 0; index < GLYPHS.length; index++) {
        ink.fillText(GLYPHS[index], (index + 0.5) * atlasSize, atlasSize / 2);
      }
      paint();
      setReady(true);
    }

    function move(event: PointerEvent) {
      if (!canvas || !finePointer.matches || reducedMotion.matches || event.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = (event.clientX - rect.left) * width / rect.width;
      pointer.y = (event.clientY - rect.top) * height / rect.height;
      pointer.active = true;
      wake();
    }

    function leave() {
      pointer.active = false;
      wake();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(frame);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    });
    intersectionObserver.observe(frame);
    frame.addEventListener("pointermove", move, { passive: true });
    frame.addEventListener("pointerleave", leave);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    reducedMotion.addEventListener("change", reset);
    finePointer.addEventListener("change", reset);

    source.src = portrait.source;
    Promise.all([
      source.decode(),
      document.fonts.load('500 12px "JetBrains Mono Variable"'),
    ]).then(() => {
      if (disposed) return;
      loaded = true;
      resize();
    }).catch(() => {
      // Keep the static portrait if image decoding or canvas initialization fails.
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      frame.removeEventListener("pointermove", move);
      frame.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      reducedMotion.removeEventListener("change", reset);
      finePointer.removeEventListener("change", reset);
    };
  }, [active, mode, portrait]);

  return (
    <figure ref={frameRef} className={`${styles.portrait} ${styles[mode]}`} role="img" aria-label={portrait.label}>
      <Image src={portrait.fallback} alt="" width={1536} height={1024} unoptimized loading={active ? "eager" : "lazy"} fetchPriority={active ? "high" : "auto"} className={ready ? styles.fallbackHidden : styles.fallback} />
      <canvas ref={canvasRef} className={ready ? styles.canvasReady : styles.canvas} aria-hidden="true" />
    </figure>
  );
}
