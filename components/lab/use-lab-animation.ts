"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type LabAnimationOptions = {
  onFrame: (timestamp: number) => void;
  onStaticFrame?: () => void;
};

export function useLabAnimation({
  onFrame,
  onStaticFrame,
}: LabAnimationOptions): RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  const onFrameRef = useRef(onFrame);
  const onStaticFrameRef = useRef(onStaticFrame);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    onFrameRef.current = onFrame;
    onStaticFrameRef.current = onStaticFrame;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      setReducedMotion(mediaQuery.matches);
    };

    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      onStaticFrameRef.current?.();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? false;

        if (visibleRef.current && frameRef.current === null) {
          const tick = (timestamp: number) => {
            if (!visibleRef.current) {
              frameRef.current = null;
              return;
            }
            onFrameRef.current(timestamp);
            frameRef.current = requestAnimationFrame(tick);
          };
          frameRef.current = requestAnimationFrame(tick);
        }

        if (!visibleRef.current && frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [reducedMotion]);

  return containerRef;
}
