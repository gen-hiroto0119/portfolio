import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoteDetail } from "@/components/garden/note-detail";
import { getAllNotes, getNote } from "@/lib/content";
import { getConnections } from "@/lib/garden-graph";

type GardenNotePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const notes = await getAllNotes();
  return notes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: GardenNotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = await getNote(slug);

  if (!note) {
    return {};
  }

  return {
    title: note.title,
    description: `Garden note — ${note.status}, tended ${note.tended}`,
  };
}

export default async function GardenNotePage({ params }: GardenNotePageProps) {
  const { slug } = await params;
  const [note, allNotes] = await Promise.all([getNote(slug), getAllNotes()]);

  if (!note) {
    notFound();
  }

  const connections = getConnections(slug, allNotes);

  return <NoteDetail note={note} connections={connections} />;
}
