import "server-only";

import type { Work } from "@/app/works/_lib/schema";
import type { BlogPost, IdeaNote } from "@/lib/content/schema";

export type GraphNodeKind = "idea" | "blog" | "works";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  title: string;
  href: string;
  status?: "seedling" | "budding" | "evergreen";
  tags: string[];
  degree: number;
};

export type GraphEdgeKind = "related" | "tag";

export type GraphEdge = {
  source: string;
  target: string;
  kind: GraphEdgeKind;
};

export type ContentGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

function ideaId(slug: string): string {
  return `idea:${slug}`;
}

function blogId(slug: string): string {
  return `blog:${slug}`;
}

function worksId(slug: string): string {
  return `works:${slug}`;
}

function undirectedPairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function buildContentGraph(
  notes: IdeaNote[],
  posts: BlogPost[],
  works: Work[],
): ContentGraph {
  const nodes: GraphNode[] = [];
  const nodeIds = new Set<string>();

  for (const note of notes) {
    const id = ideaId(note.slug);
    nodeIds.add(id);
    nodes.push({
      id,
      kind: "idea",
      title: note.title,
      href: `/idea/${note.slug}`,
      status: note.status,
      tags: note.tags,
      degree: 0,
    });
  }

  for (const post of posts) {
    const id = blogId(post.slug);
    nodeIds.add(id);
    nodes.push({
      id,
      kind: "blog",
      title: post.title,
      href: `/blog/${post.slug}`,
      tags: post.tags,
      degree: 0,
    });
  }

  for (const work of works) {
    const id = worksId(work.slug);
    nodeIds.add(id);
    nodes.push({
      id,
      kind: "works",
      title: work.title,
      href: `/works/${work.slug}`,
      tags: [],
      degree: 0,
    });
  }

  const edges: GraphEdge[] = [];
  const relatedPairs = new Set<string>();

  for (const note of notes) {
    const sourceId = ideaId(note.slug);

    for (const relatedSlug of note.related) {
      const targetId = ideaId(relatedSlug);
      if (!nodeIds.has(targetId)) {
        continue;
      }

      const key = undirectedPairKey(sourceId, targetId);
      if (relatedPairs.has(key)) {
        continue;
      }

      relatedPairs.add(key);
      edges.push({ source: sourceId, target: targetId, kind: "related" });
    }
  }

  const tagBuckets = new Map<string, string[]>();

  for (const node of nodes) {
    const seen = new Set<string>();

    for (const tag of node.tags) {
      const normalized = tag.toLowerCase();
      if (seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);

      const bucket = tagBuckets.get(normalized) ?? [];
      bucket.push(node.id);
      tagBuckets.set(normalized, bucket);
    }
  }

  const tagPairs = new Set<string>();

  for (const bucket of tagBuckets.values()) {
    for (let i = 0; i < bucket.length; i += 1) {
      for (let j = i + 1; j < bucket.length; j += 1) {
        const a = bucket[i];
        const b = bucket[j];
        const key = undirectedPairKey(a, b);

        if (relatedPairs.has(key) || tagPairs.has(key)) {
          continue;
        }

        tagPairs.add(key);
        edges.push({ source: a, target: b, kind: "tag" });
      }
    }
  }

  const degreeMap = new Map<string, number>();

  for (const edge of edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
  }

  for (const node of nodes) {
    node.degree = degreeMap.get(node.id) ?? 0;
  }

  return { nodes, edges };
}
