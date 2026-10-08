import "server-only";

import { workEntries, type WorkEntry } from "@/app/(legacy)/works/_entries";

import type { Work } from "./schema";

function compareByDateDesc(leftDate: string | undefined, rightDate: string | undefined): number {
  return (rightDate ?? "").localeCompare(leftDate ?? "");
}

function isPublished(work: Work): boolean {
  return work.published;
}

export async function getAllWorks(): Promise<Work[]> {
  return workEntries
    .map((entry) => entry.meta)
    .filter(isPublished)
    .sort((left, right) => {
      if (left.featured !== right.featured) {
        return left.featured ? -1 : 1;
      }
      return compareByDateDesc(left.date, right.date);
    });
}

export async function getWorkEntry(slug: string): Promise<WorkEntry | null> {
  return workEntries.find((entry) => entry.meta.slug === slug && isPublished(entry.meta)) ?? null;
}

export async function getWork(slug: string): Promise<Work | null> {
  const entry = await getWorkEntry(slug);
  return entry?.meta ?? null;
}
