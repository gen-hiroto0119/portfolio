"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { useTheme } from "@/components/theme/theme-provider";
import type { ContentGraph, GraphNodeKind } from "@/lib/content-graph";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  maxWidth,
  motion,
  radius,
  spacing,
} from "@/lib/theme/tokens.stylex";

import { GRAPH_PALETTE, type GraphPalette } from "./graph-colors";
import { GraphLegend } from "./graph-legend";
import {
  mulberry32,
  PHYSICS,
  reheatNodes,
  seedPosition,
  stepSimulation,
  updateNodeAlpha,
  type SimEdge,
  type SimNode,
} from "./graph-physics";

const REDUCED_MOTION_STEPS = 300;
const LABEL_TRUNCATE = 12;
const HIT_RADIUS_PAD = 4;

type GraphMode = "garden" | "all";

const styles = stylex.create({
  shell: {
    position: "relative",
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    marginBottom: spacing.xl,
    paddingInline: spacing.lg,
  },
  frame: {
    position: "relative",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgSubtle,
    overflow: "hidden",
  },
  cornerLabel: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.md,
    zIndex: 1,
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
    pointerEvents: "none",
  },
  toolbar: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.md,
    zIndex: 1,
    gap: spacing.md,
  },
  tab: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingBlock: spacing.xxs,
    paddingInline: 0,
    cursor: "pointer",
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.fg,
    },
  },
  tabSelected: {
    color: colors.accent,
  },
  canvasWrap: {
    height: "26rem",
    "@media (max-width: 640px)": {
      height: "20rem",
    },
  },
});

function truncateTitle(title: string, maxLen: number): string {
  if (title.length <= maxLen) {
    return title;
  }
  return `${title.slice(0, maxLen - 1)}…`;
}

function nodeRadius(degree: number, maxDegree: number): number {
  if (maxDegree <= 0) {
    return 5;
  }
  const t = degree / maxDegree;
  return 4 + t * 5;
}

function isActiveInMode(kind: GraphNodeKind, mode: GraphMode): boolean {
  if (mode === "all") {
    return true;
  }
  return kind === "garden";
}

function edgeVisible(
  sourceKind: GraphNodeKind,
  targetKind: GraphNodeKind,
  mode: GraphMode,
): boolean {
  if (mode === "all") {
    return true;
  }
  return sourceKind === "garden" && targetKind === "garden";
}

type ContentGraphProps = {
  graph: ContentGraph;
};

export function ContentGraph({ graph }: ContentGraphProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mode, setMode] = useState<GraphMode>("garden");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simEdgesRef = useRef<SimEdge[]>(graph.edges);
  const sizeRef = useRef({ width: 0, height: 0 });
  const frameRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  const draggingRef = useRef<string | null>(null);
  const modeRef = useRef<GraphMode>("garden");
  const hoveredRef = useRef<string | null>(null);
  const maxDegreeRef = useRef(1);
  const targetAlphaRef = useRef<Map<string, number>>(new Map());
  const activeIdsRef = useRef<Set<string>>(new Set());
  const paletteRef = useRef<GraphPalette>(GRAPH_PALETTE.dark);

  const maxDegree = useMemo(
    () => Math.max(1, ...graph.nodes.map((node) => node.degree)),
    [graph.nodes],
  );

  useEffect(() => {
    maxDegreeRef.current = maxDegree;
  }, [maxDegree]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const syncTargetAlpha = useCallback((nextMode: GraphMode) => {
    const targets = new Map<string, number>();
    const active = new Set<string>();

    for (const node of simNodesRef.current) {
      const visible = isActiveInMode(node.kind, nextMode);
      targets.set(node.id, visible ? 1 : 0);
      if (visible) {
        active.add(node.id);
      }
    }

    targetAlphaRef.current = targets;
    activeIdsRef.current = active;
  }, []);

  const initSimNodes = useCallback(
    (width: number, height: number) => {
      const rand = mulberry32(graph.nodes.length * 7919 + 17);

      simNodesRef.current = graph.nodes.map((node) => {
        const { x: px, y: py } = seedPosition(rand, width, height);
        const active = isActiveInMode(node.kind, modeRef.current);

        return {
          id: node.id,
          kind: node.kind,
          title: node.title,
          href: node.href,
          status: node.status,
          degree: node.degree,
          x: px,
          y: py,
          vx: 0,
          vy: 0,
          pinned: false,
          alpha: active ? 1 : 0,
        };
      });

      simEdgesRef.current = graph.edges;
      syncTargetAlpha(modeRef.current);
    },
    [graph.nodes, graph.edges, syncTargetAlpha],
  );

  const getNeighborIds = useCallback((nodeId: string): Set<string> => {
    const neighbors = new Set<string>([nodeId]);
    const currentMode = modeRef.current;

    for (const edge of simEdgesRef.current) {
      const source = simNodesRef.current.find((n) => n.id === edge.source);
      const target = simNodesRef.current.find((n) => n.id === edge.target);
      if (!source || !target) {
        continue;
      }
      if (
        !edgeVisible(source.kind, target.kind, currentMode) &&
        currentMode === "garden"
      ) {
        continue;
      }

      if (edge.source === nodeId) {
        neighbors.add(edge.target);
      }
      if (edge.target === nodeId) {
        neighbors.add(edge.source);
      }
    }

    return neighbors;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const { width, height } = sizeRef.current;
    const palette = paletteRef.current;
    const currentMode = modeRef.current;
    const hoverId = hoveredRef.current;
    const highlightIds = hoverId ? getNeighborIds(hoverId) : null;
    const maxDeg = maxDegreeRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = palette.bgSubtle;
    ctx.fillRect(0, 0, width, height);

    const nodeById = new Map(simNodesRef.current.map((node) => [node.id, node]));

    const drawEdge = (
      edge: SimEdge,
      dimmed: boolean,
      sourceAlpha: number,
      targetAlpha: number,
    ) => {
      const a = nodeById.get(edge.source);
      const b = nodeById.get(edge.target);
      if (!a || !b || a.alpha < 0.02 || b.alpha < 0.02) {
        return;
      }

      const alpha = Math.min(a.alpha, b.alpha) * sourceAlpha * targetAlpha;
      if (alpha < 0.02) {
        return;
      }

      const baseAlpha = dimmed ? 0.12 : edge.kind === "related" ? 0.55 : 0.28;
      ctx.globalAlpha = alpha * baseAlpha;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      if (edge.kind === "related") {
        ctx.strokeStyle = palette.border;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = palette.fgFaint;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 4]);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    };

    for (const edge of simEdgesRef.current) {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) {
        continue;
      }
      if (!edgeVisible(source.kind, target.kind, currentMode)) {
        continue;
      }

      const dimmed =
        highlightIds !== null &&
        (!highlightIds.has(edge.source) || !highlightIds.has(edge.target));

      drawEdge(edge, dimmed, 1, 1);
    }

    for (const node of simNodesRef.current) {
      if (node.alpha < 0.02) {
        continue;
      }
      if (!isActiveInMode(node.kind, currentMode) && node.alpha < 0.98) {
        continue;
      }
      if (!isActiveInMode(node.kind, currentMode)) {
        continue;
      }

      const r = nodeRadius(node.degree, maxDeg);
      const dimmed = highlightIds !== null && !highlightIds.has(node.id);
      const isHovered = hoverId === node.id;
      ctx.globalAlpha = node.alpha * (dimmed ? 0.22 : 1);

      if (node.kind === "works") {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = palette.bg;
        ctx.fill();
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        if (node.kind === "garden") {
          ctx.fillStyle =
            node.status === "evergreen" ? palette.accent : palette.fg;
        } else {
          ctx.fillStyle = palette.fgMuted;
        }
        ctx.fill();
      }

      const label = isHovered
        ? node.title
        : truncateTitle(node.title, LABEL_TRUNCATE);
      ctx.font = "10px JetBrains Mono Variable, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = palette.fg;
      ctx.globalAlpha = node.alpha * (dimmed ? 0.2 : isHovered ? 0.95 : 0.45);
      ctx.fillText(label, node.x, node.y + r + 4);
    }

    ctx.globalAlpha = 1;
  }, [getNeighborIds]);

  useEffect(() => {
    paletteRef.current = GRAPH_PALETTE[resolvedTheme];
    draw();
  }, [resolvedTheme, draw]);

  useEffect(() => {
    hoveredRef.current = hoveredId;
    if (reducedMotion) {
      draw();
    }
  }, [hoveredId, reducedMotion, draw]);

  const stopFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const simulateStep = useCallback(() => {
    const { width, height } = sizeRef.current;
    const alphaSettling = updateNodeAlpha(
      simNodesRef.current,
      targetAlphaRef.current,
    );
    const energy = stepSimulation(
      simNodesRef.current,
      simEdgesRef.current,
      width,
      height,
      activeIdsRef.current,
    );
    draw();
    return { energy, alphaSettling };
  }, [draw]);

  const startLoop = useCallback(() => {
    if (reducedMotion) {
      return;
    }

    if (frameRef.current !== null) {
      return;
    }

    const tick = () => {
      if (!visibleRef.current || document.hidden) {
        stopFrame();
        return;
      }

      const { energy, alphaSettling } = simulateStep();
      const isDragging = draggingRef.current !== null;

      if (
        !isDragging &&
        !alphaSettling &&
        energy < PHYSICS.idleThreshold
      ) {
        stopFrame();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [reducedMotion, simulateStep, stopFrame]);

  const reheat = useCallback(() => {
    reheatNodes(simNodesRef.current, activeIdsRef.current);
    startLoop();
  }, [startLoop]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    sizeRef.current = { width, height };
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (simNodesRef.current.length === 0) {
      initSimNodes(width, height);
    }

    if (reducedMotion) {
      for (let i = 0; i < REDUCED_MOTION_STEPS; i += 1) {
        simulateStep();
      }
    } else {
      reheat();
    }
  }, [initSimNodes, reheat, reducedMotion, simulateStep]);

  const hitTest = useCallback((clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const xPos = clientX - rect.left;
    const yPos = clientY - rect.top;
    const maxDeg = maxDegreeRef.current;
    const currentMode = modeRef.current;

    let hit: string | null = null;
    let bestDist = Infinity;

    for (const node of simNodesRef.current) {
      if (node.alpha < 0.5 || !isActiveInMode(node.kind, currentMode)) {
        continue;
      }

      const r = nodeRadius(node.degree, maxDeg) + HIT_RADIUS_PAD;
      const dist = Math.hypot(node.x - xPos, node.y - yPos);
      if (dist <= r && dist < bestDist) {
        bestDist = dist;
        hit = node.id;
      }
    }

    return hit;
  }, []);

  const handleModeChange = useCallback(
    (nextMode: GraphMode) => {
      setMode(nextMode);
      modeRef.current = nextMode;
      syncTargetAlpha(nextMode);

      const nodes = simNodesRef.current;
      const { width, height } = sizeRef.current;

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        const shouldShow = isActiveInMode(node.kind, nextMode);
        if (shouldShow && node.alpha < 0.1) {
          const rand = mulberry32(node.id.length * 131);
          const pos = seedPosition(rand, width, height);
          nodes[i] = {
            ...node,
            x: pos.x,
            y: pos.y,
            vx: 0,
            vy: 0,
          };
        }
      }

      simNodesRef.current = nodes;
      reheat();
    },
    [reheat, syncTargetAlpha],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    resize();
    const onResize = () => {
      resize();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? false;
        if (visibleRef.current && !document.hidden && !reducedMotion) {
          startLoop();
        } else {
          stopFrame();
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [reducedMotion, startLoop, stopFrame]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopFrame();
      } else if (visibleRef.current && !reducedMotion) {
        startLoop();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reducedMotion, startLoop, stopFrame]);

  useEffect(() => {
    return () => stopFrame();
  }, [stopFrame]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const hit = hitTest(event.clientX, event.clientY);
    if (!hit) {
      return;
    }

    draggingRef.current = hit;
    const node = simNodesRef.current.find((n) => n.id === hit);
    if (node) {
      node.pinned = true;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    reheat();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const hit = hitTest(event.clientX, event.clientY);
    setHoveredId(hit);

    if (draggingRef.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const node = simNodesRef.current.find(
        (n) => n.id === draggingRef.current,
      );
      if (node) {
        node.x = event.clientX - rect.left;
        node.y = event.clientY - rect.top;
      }
      draw();
      reheat();
      return;
    }

    if (reducedMotion) {
      draw();
    } else if (frameRef.current === null) {
      startLoop();
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const wasDragging = draggingRef.current;
    if (wasDragging) {
      const node = simNodesRef.current.find((n) => n.id === wasDragging);
      if (node) {
        node.pinned = false;
      }
      draggingRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      reheat();
      return;
    }

    const hit = hitTest(event.clientX, event.clientY);
    if (hit) {
      const node = simNodesRef.current.find((n) => n.id === hit);
      if (node) {
        router.push(node.href);
      }
    }
  };

  const handlePointerLeave = () => {
    setHoveredId(null);
    if (reducedMotion) {
      draw();
    }
  };

  return (
    <section {...stylex.props(styles.shell)} aria-label="Idea graph">
      <div {...stylex.props(styles.frame)}>
        <span
          {...stylex.props(styles.cornerLabel, x.textTransform.uppercase)}
        >
          Idea Graph
        </span>
        <div
          role="tablist"
          aria-label="Graph scope"
          {...stylex.props(
            styles.toolbar,
            x.display.flex,
            x.alignItems.center,
          )}
        >
          {(["garden", "all"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              {...stylex.props(
                styles.tab,
                x.textTransform.uppercase,
                mode === tab && styles.tabSelected,
              )}
              onClick={() => handleModeChange(tab)}
            >
              {tab === "garden" ? "GARDEN" : "ALL"}
            </button>
          ))}
        </div>
        <div ref={containerRef} {...stylex.props(styles.canvasWrap)}>
          <canvas
            ref={canvasRef}
            aria-label="Interactive content graph"
            role="img"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              cursor: hoveredId ? "pointer" : "default",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerUp}
          />
        </div>
        <GraphLegend />
      </div>
    </section>
  );
}
