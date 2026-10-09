import { randomUUID } from "node:crypto";
import type { TiptapDocument, TiptapNode } from "@/lib/cms/document";
import {
  ConcurrentPublicationError, PublicationError, pageMetadata, postSchema, uuid,
  type NotionPage, type PublishedAsset, type Snapshot, type SnapshotRead,
} from "./model";

export type SyncPorts = {
  dataSourceId: string;
  read: () => Promise<SnapshotRead>;
  write: (snapshot: Snapshot, etag: string | null) => Promise<void>;
  page: (id: string) => Promise<NotionPage | null>;
  body: (id: string) => Promise<{ body: TiptapDocument; assets: PublishedAsset[] }>;
  removeAssets: (assets: PublishedAsset[]) => Promise<void>;
};

function excerpt(node: TiptapNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return " ";
  const separator = ["paragraph", "heading"].includes(node.type) ? "" : " ";
  return (node.content ?? []).map(excerpt).join(separator);
}

// A conflicting write must restart from Notion, never replay an older prepared document.
export async function syncPage(id: string, ports: SyncPorts) {
  id = uuid.parse(id);
  const { snapshot, etag } = await ports.read();
  const old = snapshot.posts.find((post) => post.id === id);
  const page = await ports.page(id);
  const metadata = page ? pageMetadata(page, ports.dataSourceId) : null;
  if (!metadata && !old) return { action: "unchanged" as const };
  if (!metadata && old) {
    const confirmed = await ports.page(id);
    if (JSON.stringify(confirmed) !== JSON.stringify(page)) {
      throw new ConcurrentPublicationError("Notion changed during synchronization");
    }
  }

  let next = null;
  if (metadata && page) {
    if (snapshot.posts.some((post) => post.id !== id && post.slug === metadata.slug)) {
      throw new PublicationError("slug が別の公開記事と重複しています。");
    }
    const content = await ports.body(id);
    const confirmed = await ports.page(id);
    if (!confirmed || JSON.stringify(confirmed) !== JSON.stringify(page)) {
      throw new ConcurrentPublicationError("Notion changed during synchronization");
    }
    next = postSchema.parse({
      ...metadata, ...content, revision: Math.max(Date.now(), (old?.revision ?? 0) + 1),
      description: metadata.description.trim() || excerpt(content.body).replace(/\s+/g, " ").trim().slice(0, 160),
      sourceEditedAt: page.last_edited_time,
    });
  }

  const posts = snapshot.posts.filter((post) => post.id !== id);
  if (next) posts.push(next);
  const active = new Set(posts.flatMap((post) => post.assets.map((asset) => asset.id)));
  const garbage = [...snapshot.garbage, ...(old?.assets ?? [])].filter((asset) => !active.has(asset.id));
  await ports.write({ version: 1, generation: randomUUID(), posts, garbage }, etag);
  return { action: next ? "published" as const : "withdrawn" as const };
}

export async function cleanRetiredAssets(ports: Pick<SyncPorts, "read" | "write" | "removeAssets">) {
  const { snapshot, etag } = await ports.read();
  if (!snapshot.garbage.length) return;
  const active = new Set(snapshot.posts.flatMap((post) => post.assets.map((asset) => asset.id)));
  const retired = snapshot.garbage.filter((asset) => !active.has(asset.id));
  await ports.removeAssets(retired);
  await ports.write({ ...snapshot, generation: randomUUID(), garbage: [] }, etag);
}
