import type { Metadata } from "next";

import { GardenView } from "@/components/garden/garden-view";
import { SectionPageHeader } from "@/components/garden/section-page-header";
import { getAllNotes, getAllPosts, getAllWorks } from "@/lib/content";
import { buildContentGraph } from "@/lib/content-graph";
import { getConnectionCount } from "@/lib/garden-graph";

export const metadata: Metadata = {
  title: "Garden",
  description:
    "アイデアをブレストし、つなげて、育てる場所。メモは互いにリンクし、時間をかけて成長します。",
};

export default async function GardenPage() {
  const [notes, posts, works] = await Promise.all([
    getAllNotes(),
    getAllPosts(),
    getAllWorks(),
  ]);

  const graph = buildContentGraph(notes, posts, works);

  const connectionCounts = Object.fromEntries(
    notes.map((note) => [note.slug, getConnectionCount(note.slug, notes)]),
  );

  return (
    <>
      <SectionPageHeader
        label="Garden"
        title="育てているアイデアのメモ。"
        description="アイデアをブレストし、つなげて、育てる場所。メモは互いにリンクし、時間をかけて成長します。"
      />
      <GardenView
        notes={notes}
        connectionCounts={connectionCounts}
        graph={graph}
      />
    </>
  );
}
