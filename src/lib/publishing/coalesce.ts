import { uuid, type SyncMarker, type SyncMarkerRead } from "./model";

export type SyncMarkerPorts = {
  read: (pageId: string) => Promise<SyncMarkerRead>;
  write: (marker: SyncMarker, etag: string | null) => Promise<void>;
};

export type SyncRegistration = "accepted" | "superseded";

// Equal receipt timestamps are broken by token so every run reaches the same verdict.
export function supersedes(incoming: SyncMarker, stored: SyncMarker) {
  const incomingTime = Date.parse(incoming.requestedAt);
  const storedTime = Date.parse(stored.requestedAt);
  if (incomingTime !== storedTime) return incomingTime > storedTime;
  if (incoming.token === stored.token) return true;
  return incoming.token > stored.token;
}

export async function registerSyncMarker(
  pageId: string,
  token: string,
  requestedAt: string,
  ports: SyncMarkerPorts,
): Promise<SyncRegistration> {
  const marker: SyncMarker = { version: 1, pageId: uuid.parse(pageId), token, requestedAt };
  const { marker: stored, etag } = await ports.read(marker.pageId);
  if (stored && !supersedes(marker, stored)) return "superseded";
  if (stored?.token === marker.token && stored.requestedAt === marker.requestedAt) return "accepted";
  await ports.write(marker, etag);
  return "accepted";
}

export async function isCurrentSyncMarker(
  pageId: string,
  token: string,
  read: SyncMarkerPorts["read"],
) {
  const { marker } = await read(uuid.parse(pageId));
  return marker?.token === token;
}

export async function syncPageIfCurrentMarker<T extends { action: string; needsInvalidation: boolean }>(
  pageId: string,
  token: string,
  read: SyncMarkerPorts["read"],
  sync: () => Promise<T>,
): Promise<T | { action: "superseded"; needsInvalidation: false }> {
  if (!(await isCurrentSyncMarker(pageId, token, read))) {
    return { action: "superseded", needsInvalidation: false };
  }
  return sync();
}
