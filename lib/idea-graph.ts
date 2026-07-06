import "server-only";

import type { GardenNote } from "@/lib/content/schema";

export type NoteConnections = {
  related: GardenNote[];
  backlinks: GardenNote[];
  sameTags: GardenNote[];
};

function compareByTendedDesc(left: GardenNote, right: GardenNote): number {
  return right.tended.localeCompare(left.tended);
}

function resolveRelatedSlugs(
  slug: string,
  allNotes: GardenNote[],
): GardenNote[] {
  const noteBySlug = new Map(allNotes.map((note) => [note.slug, note]));
  const current = noteBySlug.get(slug);

  if (!current) {
    return [];
  }

  return current.related
    .map((relatedSlug) => noteBySlug.get(relatedSlug))
    .filter((note): note is GardenNote => note !== undefined);
}

function getBacklinks(
  slug: string,
  allNotes: GardenNote[],
  excludeSlugs: Set<string>,
): GardenNote[] {
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
  allNotes: GardenNote[],
  excludeSlugs: Set<string>,
): GardenNote[] {
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
  allNotes: GardenNote[],
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
  allNotes: GardenNote[],
): number {
  const { related, backlinks } = getConnections(slug, allNotes);
  return related.length + backlinks.length;
}
