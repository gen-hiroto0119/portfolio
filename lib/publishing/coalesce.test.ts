import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import { isCurrentSyncMarker, registerSyncMarker, type SyncMarkerPorts } from "./coalesce";
import { ConcurrentPublicationError, type SyncMarker } from "./model";

function fakeMarkerStore() {
  const stored = new Map<string, { marker: SyncMarker; etag: string }>();
  const ports: SyncMarkerPorts = {
    read: async (pageId) => {
      const entry = stored.get(pageId);
      return { marker: entry ? structuredClone(entry.marker) : null, etag: entry?.etag ?? null };
    },
    write: async (marker, etag) => {
      const entry = stored.get(marker.pageId);
      if ((entry?.etag ?? null) !== etag) throw new ConcurrentPublicationError();
      stored.set(marker.pageId, { marker: structuredClone(marker), etag: randomUUID() });
    },
  };
  return { ports, stored };
}

test("a burst of public notifications leaves only the latest owner registered", async () => {
  const id = randomUUID();
  const { ports, stored } = fakeMarkerStore();
  assert.equal(await registerSyncMarker(id, "run-a", "2026-01-01T00:00:00.000Z", ports), "accepted");
  assert.equal(await registerSyncMarker(id, "run-b", "2026-01-01T00:00:05.000Z", ports), "accepted");
  assert.equal(stored.get(id)?.marker.token, "run-b");
  assert.equal(await isCurrentSyncMarker(id, "run-a", ports.read), false);
  assert.equal(await isCurrentSyncMarker(id, "run-b", ports.read), true);
});

test("a delayed older registration never replaces a newer one", async () => {
  const id = randomUUID();
  const { ports, stored } = fakeMarkerStore();
  await registerSyncMarker(id, "run-b", "2026-01-01T00:00:05.000Z", ports);
  assert.equal(await registerSyncMarker(id, "run-a", "2026-01-01T00:00:00.000Z", ports), "superseded");
  // Same-millisecond arrivals still reach one deterministic verdict.
  assert.equal(await registerSyncMarker(id, "run-a", "2026-01-01T00:00:05.000Z", ports), "superseded");
  assert.equal(await registerSyncMarker(id, "run-c", "2026-01-01T00:00:05.000Z", ports), "accepted");
  assert.equal(stored.get(id)?.marker.token, "run-c");
});

test("retrying a registration with the same token writes once", async () => {
  const id = randomUUID();
  const { ports, stored } = fakeMarkerStore();
  let writes = 0;
  const counted: SyncMarkerPorts = { read: ports.read, write: async (marker, etag) => { writes++; await ports.write(marker, etag); } };
  for (let attempt = 0; attempt < 3; attempt++) {
    assert.equal(await registerSyncMarker(id, "run-a", "2026-01-01T00:00:00.000Z", counted), "accepted");
  }
  assert.equal(writes, 1);
  assert.deepEqual(stored.get(id)?.marker, {
    version: 1, pageId: id, token: "run-a", requestedAt: "2026-01-01T00:00:00.000Z",
  });
});
