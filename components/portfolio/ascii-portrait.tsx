"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./ascii-portrait.module.css";

const GLYPHS = ".:-=+*TERA%#@";
const SCRAMBLE_INTERVAL = 110;
const PORTRAIT = {
  // SMK's photograph of the David head cast, KAS2232, released under CC0:
  // https://commons.wikimedia.org/wiki/File:Michelangelo_Buonarroti,_Hoved_fra_statuen_af_David,_,_KAS2232,_Statens_Museum_for_Kunst.jpg
  source: "/portfolio/david-photo.webp",
  fallback: "/portfolio/david-ascii.svg",
  ink: "#648cff",
  label: "写真の明暗を青いASCII文字に変換したダビデ像",
};
const INKS = [PORTRAIT.ink, "#7d9dff", "#968cff"];

type Letter = {
  x: number;
  y: number;
  glyph: number;
  displayGlyph: number;
  tint: number;
};

export function AsciiPortrait() {
  const frameRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
    let timer = 0;
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
          letter.displayGlyph * atlasSize, letter.tint * atlasSize, atlasSize, atlasSize,
          letter.x - size / 2,
          letter.y - size / 2,
          size, size,
        );
      }
    }

    function reset() {
      cancelAnimationFrame(animation);
      window.clearTimeout(timer);
      animation = 0;
      timer = 0;
      pointer.active = false;
      for (const letter of letters) {
        letter.displayGlyph = letter.glyph;
        letter.tint = 0;
      }
      paint();
    }

    function tick() {
      animation = 0;
      if (disposed || !visible || document.hidden || reducedMotion.matches || !finePointer.matches) return;
      const radius = Math.min(width * 0.16, 76);
      let nearby = false;
      let changed = false;

      for (const letter of letters) {
        const distance = Math.hypot(letter.x - pointer.x, letter.y - pointer.y);
        const influence = pointer.active ? Math.max(0, 1 - distance / radius) ** 2 : 0;
        let nextGlyph = letter.glyph;
        let nextTint = 0;
        if (influence > 0) {
          nearby = true;
          if (Math.random() < influence * 0.85) {
            // Stay near the original density to preserve the statue's shading.
            const shift = (Math.random() < 0.5 ? -1 : 1) * (influence > 0.5 ? 2 : 1);
            nextGlyph = Math.max(0, Math.min(GLYPHS.length - 1, letter.glyph + shift));
            nextTint = Math.random() < 0.7 ? 1 : 2;
          }
        }
        if (nextGlyph !== letter.displayGlyph || nextTint !== letter.tint) changed = true;
        letter.displayGlyph = nextGlyph;
        letter.tint = nextTint;
      }
      if (changed) paint();
      if (nearby) {
        timer = window.setTimeout(() => {
          timer = 0;
          wake();
        }, SCRAMBLE_INTERVAL);
      }
    }

    function wake() {
      if (!animation && !timer && !disposed && loaded && visible && !document.hidden && !reducedMotion.matches && finePointer.matches) {
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
      // Keep small glyphs crisp even on 1x screens.
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
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
          const luminance = (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) / 255;
          const coverage = Math.max(0, (luminance - 0.09) / 0.84);
          if (coverage < 0.035) continue;
          const tone = Math.min(1, coverage) ** 1.8;
          const glyph = Math.min(GLYPHS.length - 1, Math.floor(tone * GLYPHS.length));
          letters.push({
            x: (column + 0.5) * cellWidth,
            y: (row + 0.5) * cellHeight,
            glyph,
            displayGlyph: glyph,
            tint: 0,
          });
        }
      }

      // Rasterize the small alphabet once, rather than typesetting on every frame.
      atlasSize = Math.ceil(cellHeight * 1.45 * dpr);
      atlas = document.createElement("canvas");
      atlas.width = atlasSize * GLYPHS.length;
      atlas.height = atlasSize * INKS.length;
      const ink = atlas.getContext("2d");
      if (!ink) return;
      ink.font = `500 ${cellHeight * 1.16 * dpr}px "JetBrains Mono Variable", monospace`;
      ink.textAlign = "center";
      ink.textBaseline = "middle";
      for (let tint = 0; tint < INKS.length; tint++) {
        ink.fillStyle = INKS[tint];
        for (let index = 0; index < GLYPHS.length; index++) {
          ink.fillText(GLYPHS[index], (index + 0.5) * atlasSize, (tint + 0.5) * atlasSize);
        }
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
      reset();
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

    source.src = PORTRAIT.source;
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
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      frame.removeEventListener("pointermove", move);
      frame.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      reducedMotion.removeEventListener("change", reset);
      finePointer.removeEventListener("change", reset);
    };
  }, []);

  return (
    <figure ref={frameRef} className={styles.portrait} role="img" aria-label={PORTRAIT.label}>
      <Image src={PORTRAIT.fallback} alt="" width={1536} height={1024} unoptimized loading="eager" fetchPriority="high" className={ready ? styles.fallbackHidden : styles.fallback} />
      <canvas ref={canvasRef} className={ready ? styles.canvasReady : styles.canvas} aria-hidden="true" />
    </figure>
  );
}
