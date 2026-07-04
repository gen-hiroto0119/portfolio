import type { GraphEdgeKind, GraphNodeKind } from "@/lib/content-graph";

export type SimNode = {
  id: string;
  kind: GraphNodeKind;
  title: string;
  href: string;
  status?: "seedling" | "budding" | "evergreen";
  degree: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
  alpha: number;
};

export type SimEdge = {
  source: string;
  target: string;
  kind: GraphEdgeKind;
};

export const PHYSICS = {
  repulsion: 1400,
  centerGravity: 0.018,
  damping: 0.85,
  relatedRest: 72,
  relatedStiffness: 0.1,
  tagRest: 136,
  tagStiffness: 0.035,
  idleThreshold: 0.35,
  maxVelocity: 14,
  alphaFadeRate: 0.14,
} as const;

export function mulberry32(seed: number): () => number {
  let state = seed;

  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedPosition(
  rand: () => number,
  width: number,
  height: number,
): { x: number; y: number } {
  const cx = width / 2;
  const cy = height / 2;
  const angle = rand() * Math.PI * 2;
  const radius = rand() * Math.min(width, height) * 0.28;

  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

export function stepSimulation(
  nodes: SimNode[],
  edges: SimEdge[],
  width: number,
  height: number,
  activeIds: Set<string>,
): number {
  const cx = width / 2;
  const cy = height / 2;
  const activeNodes = nodes.filter((node) => activeIds.has(node.id));

  const forceX = new Map<string, number>();
  const forceY = new Map<string, number>();

  for (const node of activeNodes) {
    forceX.set(node.id, 0);
    forceY.set(node.id, 0);
  }

  for (let i = 0; i < activeNodes.length; i += 1) {
    for (let j = i + 1; j < activeNodes.length; j += 1) {
      const a = activeNodes[i];
      const b = activeNodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      let distSq = dx * dx + dy * dy;
      if (distSq < 1) {
        distSq = 1;
      }
      const dist = Math.sqrt(distSq);
      const force = PHYSICS.repulsion / distSq;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      forceX.set(a.id, (forceX.get(a.id) ?? 0) + fx);
      forceY.set(a.id, (forceY.get(a.id) ?? 0) + fy);
      forceX.set(b.id, (forceX.get(b.id) ?? 0) - fx);
      forceY.set(b.id, (forceY.get(b.id) ?? 0) - fy);
    }
  }

  const nodeById = new Map(activeNodes.map((node) => [node.id, node]));

  for (const edge of edges) {
    if (!activeIds.has(edge.source) || !activeIds.has(edge.target)) {
      continue;
    }

    const a = nodeById.get(edge.source);
    const b = nodeById.get(edge.target);
    if (!a || !b) {
      continue;
    }

    const restLength =
      edge.kind === "related" ? PHYSICS.relatedRest : PHYSICS.tagRest;
    const stiffness =
      edge.kind === "related"
        ? PHYSICS.relatedStiffness
        : PHYSICS.tagStiffness;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    if (dist < 0.1) {
      dist = 0.1;
    }

    const displacement = dist - restLength;
    const force = stiffness * displacement;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    forceX.set(a.id, (forceX.get(a.id) ?? 0) + fx);
    forceY.set(a.id, (forceY.get(a.id) ?? 0) + fy);
    forceX.set(b.id, (forceX.get(b.id) ?? 0) - fx);
    forceY.set(b.id, (forceY.get(b.id) ?? 0) - fy);
  }

  let energy = 0;

  for (const node of activeNodes) {
    if (node.pinned) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }

    const gx = (cx - node.x) * PHYSICS.centerGravity;
    const gy = (cy - node.y) * PHYSICS.centerGravity;
    const ax = (forceX.get(node.id) ?? 0) + gx;
    const ay = (forceY.get(node.id) ?? 0) + gy;

    node.vx = (node.vx + ax) * PHYSICS.damping;
    node.vy = (node.vy + ay) * PHYSICS.damping;

    const speed = Math.hypot(node.vx, node.vy);
    if (speed > PHYSICS.maxVelocity) {
      node.vx = (node.vx / speed) * PHYSICS.maxVelocity;
      node.vy = (node.vy / speed) * PHYSICS.maxVelocity;
    }

    node.x += node.vx;
    node.y += node.vy;
    energy += node.vx * node.vx + node.vy * node.vy;
  }

  return energy;
}

export function reheatNodes(nodes: SimNode[], activeIds: Set<string>): void {
  for (const node of nodes) {
    if (!activeIds.has(node.id)) {
      continue;
    }
    node.vx += (Math.random() - 0.5) * 3;
    node.vy += (Math.random() - 0.5) * 3;
  }
}

export function updateNodeAlpha(
  nodes: SimNode[],
  targetAlpha: Map<string, number>,
): boolean {
  let settling = false;

  for (const node of nodes) {
    const target = targetAlpha.get(node.id) ?? 0;
    const delta = target - node.alpha;

    if (Math.abs(delta) < 0.01) {
      node.alpha = target;
      continue;
    }

    settling = true;
    node.alpha += Math.sign(delta) * PHYSICS.alphaFadeRate;
    node.alpha = Math.max(0, Math.min(1, node.alpha));
  }

  return settling;
}
