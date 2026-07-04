import type { Metadata } from "next";

import { SectionPageHeader } from "@/components/garden/section-page-header";
import { NoteGrid } from "@/components/garden/note-card";
import { getAllNotes } from "@/lib/content";

export const metadata: Metadata = {
  title: "Garden",
  description: "育てているアイデアのメモ。下書き、参照、実験的な思考の記録。",
};

export default async function GardenPage() {
  const notes = await getAllNotes();

  return (
    <>
      <SectionPageHeader
        label="Garden"
        title="育てているアイデアのメモ。"
        description="まだ芽生えたばかりの思考から、何度も手を入れて定着した知見まで。育成段階ごとに分類しています。"
      />
      <NoteGrid notes={notes} />
    </>
  );
}
