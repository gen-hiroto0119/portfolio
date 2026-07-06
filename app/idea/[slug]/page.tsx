import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoteDetail } from "@/components/idea/note-detail";
import { getAllIdeas, getIdea } from "@/lib/content";
import { getConnections } from "@/lib/idea-graph";

type IdeaNotePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const notes = await getAllIdeas();
  return notes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: IdeaNotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = await getIdea(slug);

  if (!note) {
    return {};
  }

  return {
    title: note.title,
    description: `Idea — ${note.status}, tended ${note.tended}`,
  };
}

export default async function IdeaNotePage({ params }: IdeaNotePageProps) {
  const { slug } = await params;
  const [note, allNotes] = await Promise.all([getIdea(slug), getAllIdeas()]);

  if (!note) {
    notFound();
  }

  const connections = getConnections(slug, allNotes);

  return <NoteDetail note={note} connections={connections} />;
}
