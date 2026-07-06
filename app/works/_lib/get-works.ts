import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { works } from "@/app/works/_entries";

import type { Work, WorkWithContent } from "./schema";

const ENTRIES_DIR = path.join(process.cwd(), "app/works/_entries");

function compareByDateDesc(leftDate: string, rightDate: string): number {
  return rightDate.localeCompare(leftDate);
}

function isPublished(work: Work): boolean {
  return work.published;
}

export async function getAllWorks(): Promise<Work[]> {
  return works
    .filter(isPublished)
    .sort((left, right) => {
      if (left.featured !== right.featured) {
        return left.featured ? -1 : 1;
      }
      return compareByDateDesc(left.date, right.date);
    });
}

async function readCaseStudy(slug: string): Promise<string> {
  const filePath = path.join(ENTRIES_DIR, `${slug}.case.md`);

  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return "";
    }
    throw error;
  }
}

export async function getWork(slug: string): Promise<WorkWithContent | null> {
  const work = works.find((entry) => entry.slug === slug);

  if (!work || !work.published) {
    return null;
  }

  const content = await readCaseStudy(slug);

  return {
    ...work,
    content,
  };
}
