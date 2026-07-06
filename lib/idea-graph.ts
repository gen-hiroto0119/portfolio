import "server-only";

import type { IdeaNote } from "@/lib/content/schema";

export type NoteConnections = {
  related: IdeaNote[];
  backlinks: IdeaNote[];
  sameTags: IdeaNote[];
};

function compareByTendedDesc(left: IdeaNote, right: IdeaNote): number {
  return right.tended.localeCompare(left.tended);
}

function resolveRelatedSlugs(
  slug: string,
  allNotes: IdeaNote[],
): IdeaNote[] {
  const noteBySlug = new Map(allNotes.map((note) => [note.slug, note]));
  const current = noteBySlug.get(slug);

  if (!current) {
    return [];
  }

  return current.related
    .map((relatedSlug) => noteBySlug.get(relatedSlug))
    .filter((note): note is IdeaNote => note !== undefined);
}

function getBacklinks(
  slug: string,
  allNotes: IdeaNote[],
  excludeSlugs: Set<string>,
): IdeaNote[] {
  return allNotes
    .filter(
      (note) =>
        note.slug !== slug &&
        note.related.includes(slug) &&
        !excludeSlugs.has(note.slug),
    )
    .sort(compareByTendedDesc);
}

function getSameTags(
  slug: string,
  allNotes: IdeaNote[],
  excludeSlugs: Set<string>,
): IdeaNote[] {
  const current = allNotes.find((note) => note.slug === slug);

  if (!current || current.tags.length === 0) {
    return [];
  }

  const currentTags = new Set(current.tags);

  return allNotes
    .filter((note) => {
      if (note.slug === slug || excludeSlugs.has(note.slug)) {
        return false;
      }
      return note.tags.some((tag) => currentTags.has(tag));
    })
    .sort(compareByTendedDesc)
    .slice(0, 3);
}

export function getConnections(
  slug: string,
  allNotes: IdeaNote[],
): NoteConnections {
  const related = resolveRelatedSlugs(slug, allNotes);
  const excludeSlugs = new Set(related.map((note) => note.slug));

  const backlinks = getBacklinks(slug, allNotes, excludeSlugs);
  for (const note of backlinks) {
    excludeSlugs.add(note.slug);
  }

  const sameTags = getSameTags(slug, allNotes, excludeSlugs);

  return { related, backlinks, sameTags };
}

export function getConnectionCount(
  slug: string,
  allNotes: IdeaNote[],
): number {
  const { related, backlinks } = getConnections(slug, allNotes);
  return related.length + backlinks.length;
}
