import "server-only";

import type { ComponentType } from "react";

import { parseWork, type Work } from "@/app/(legacy)/works/_lib/schema";

import { insertWork } from "./insert.meta";
import { InsertContent } from "./insert";

export type WorkEntry = {
  meta: Work;
  Content: ComponentType;
};

// Register each work's metadata and page together. Only metadata is passed to
// client-side lists; the content component stays on the server.
export const workEntries: readonly WorkEntry[] = [
  {
    meta: parseWork(insertWork, "insert.meta.ts"),
    Content: InsertContent,
  },
];
