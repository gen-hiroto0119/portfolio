import type { Metadata } from "next";

import { IdeaView } from "@/components/idea/idea-view";
import { SectionPageHeader } from "@/components/idea/section-page-header";
import { getAllWorks } from "@/app/works/_lib/get-works";
import { getAllIdeas, getAllPosts } from "@/lib/content";
import { buildContentGraph } from "@/lib/content-graph";
import { getConnectionCount } from "@/lib/idea-graph";

export const metadata: Metadata = {
  title: "Idea",
  description:
    "アイデアをブレストし、つなげて、育てる場所。メモは互いにリンクし、時間をかけて成長します。",
};

export default async function IdeaPage() {
  const [notes, posts, works] = await Promise.all([
    getAllIdeas(),
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
        label="Idea"
        title="育てているアイデアのメモ。"
        description="アイデアをブレストし、つなげて、育てる場所。メモは互いにリンクし、時間をかけて成長します。"
      />
      <IdeaView
        notes={notes}
        connectionCounts={connectionCounts}
        graph={graph}
      />
    </>
  );
}
