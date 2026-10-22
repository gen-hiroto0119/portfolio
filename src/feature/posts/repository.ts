import { isBlobConfigured, readSnapshot } from "@/storage";

export async function loadPublishedSnapshot() {
  if (!isBlobConfigured()) return null;
  return (await readSnapshot()).snapshot;
}
