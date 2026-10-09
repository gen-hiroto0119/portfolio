import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { FatalError } from "workflow";
import { registerSyncMarker, syncPageIfCurrentMarker, type SyncMarkerPorts } from "./coalesce";
import { ConcurrentPublicationError, type SyncMarker } from "./model";
import { coalescePageNotification, reconcilePagesAndCleanup } from "./workflows";

test("reconciliation cleanup runs even if a page sync fails", async () => {
  const order: string[] = [];
  await assert.rejects(reconcilePagesAndCleanup(
    ["withdrawn", "invalid"],
    async (id) => {
      order.push(`sync:${id}`);
      if (id === "invalid") throw new Error("page failed");
      return { needsInvalidation: true };
    },
    async () => { order.push("cleanup"); },
    async () => { order.push("invalidate"); },
  ), FatalError);
  assert.deepEqual(order, ["sync:withdrawn", "invalidate", "sync:invalid", "cleanup"]);
});

test("invalidation failure fails synchronization but a subsequent unchanged sync heals the cache", async () => {
  const order: string[] = [];
  let withdrawn = false;
  let failInvalidation = true;
  const run = () => reconcilePagesAndCleanup(
    ["post"],
    async () => {
      order.push(withdrawn ? "unchanged" : "write:withdrawn");
      withdrawn = true;
      return { needsInvalidation: true };
    },
    async () => { order.push("cleanup"); },
    async () => {
      order.push("invalidate");
      if (failInvalidation) throw new Error("unavailable");
    },
  );
  await assert.rejects(run(), FatalError);
  failInvalidation = false;
  assert.deepEqual(await run(), { count: 1 });
  assert.deepEqual(order, ["write:withdrawn", "invalidate", "cleanup", "unchanged", "invalidate", "cleanup"]);
});

test("a draft no-op skips body work, writes, and invalidation", async () => {
  const calls: string[] = [];
  const result = await coalescePageNotification("page", "page.properties_updated", "run", "2026-01-01T00:00:00.000Z", {
    classify: async () => ({ published: false }),
    heal: async () => { calls.push("heal"); },
    register: async () => { calls.push("register"); return "accepted"; },
    wait: async () => { calls.push("wait"); },
    syncCurrent: async () => { calls.push("current-sync"); return { action: "published", needsInvalidation: false }; },
    sync: async () => { calls.push("sync"); return { action: "unchanged", needsInvalidation: false }; },
    cleanup: async () => { calls.push("cleanup"); },
    invalidate: async () => { calls.push("invalidate"); },
  });
  assert.deepEqual(result, { action: "unchanged" });
  assert.deepEqual(calls, ["register", "sync", "cleanup"]);
});

test("withdrawal bypasses a pending public timer and cannot be resurrected", async () => {
  const calls: string[] = [];
  const result = await coalescePageNotification("page", "page.properties_updated", "withdrawal", "2026-01-01T00:00:02.000Z", {
    classify: async () => ({ published: false }),
    heal: async () => { calls.push("heal"); },
    register: async () => { calls.push("register"); return "accepted"; },
    wait: async () => { calls.push("wait"); },
    syncCurrent: async () => { calls.push("stale-public-sync"); return { action: "published", needsInvalidation: false }; },
    sync: async () => { calls.push("withdrawal-sync"); return { action: "withdrawn", needsInvalidation: true }; },
    cleanup: async () => { calls.push("cleanup"); },
    invalidate: async () => { calls.push("invalidate"); },
  });
  assert.deepEqual(result, { action: "withdrawn" });
  assert.deepEqual(calls, ["register", "withdrawal-sync", "invalidate", "cleanup"]);
});

test("superseded public notifications heal pending cache before exiting", async () => {
  const calls: string[] = [];
  const result = await coalescePageNotification("page", "page.content_updated", "old", "2026-01-01T00:00:01.000Z", {
    classify: async () => ({ published: true }),
    heal: async () => { calls.push("heal"); },
    register: async () => { calls.push("register"); return "superseded"; },
    wait: async () => { calls.push("wait"); },
    syncCurrent: async () => { calls.push("sync-current"); return { action: "published", needsInvalidation: false }; },
    sync: async () => { calls.push("sync"); return { action: "unchanged", needsInvalidation: false }; },
    cleanup: async () => { calls.push("cleanup"); },
    invalidate: async () => { calls.push("invalidate"); },
  });
  assert.deepEqual(result, { action: "superseded" });
  assert.deepEqual(calls, ["heal", "register"]);
});

test("a superseded token discovered on wake never syncs or invalidates", async () => {
  const calls: string[] = [];
  const result = await coalescePageNotification("page", "page.content_updated", "stale", "2026-01-01T00:00:01.000Z", {
    classify: async () => ({ published: true }),
    heal: async () => { calls.push("heal"); },
    register: async () => { calls.push("register"); return "accepted"; },
    wait: async () => { calls.push("wait"); },
    syncCurrent: async () => { calls.push("sync-current"); return { action: "superseded", needsInvalidation: false }; },
    sync: async () => { calls.push("sync"); return { action: "unchanged", needsInvalidation: false }; },
    cleanup: async () => { calls.push("cleanup"); },
    invalidate: async () => { calls.push("invalidate"); },
  });
  assert.deepEqual(result, { action: "superseded" });
  assert.deepEqual(calls, ["heal", "register", "wait", "sync-current"]);
});

test("an A/B notification burst runs only the latest heavy sync after its wait", async () => {
  const pageId = randomUUID();
  const markers = new Map<string, { marker: SyncMarker; etag: string }>();
  const markerPorts: SyncMarkerPorts = {
    read: async (id) => {
      const stored = markers.get(id);
      return { marker: stored?.marker ?? null, etag: stored?.etag ?? null };
    },
    write: async (marker, etag) => {
      const stored = markers.get(marker.pageId);
      if ((stored?.etag ?? null) !== etag) throw new ConcurrentPublicationError();
      markers.set(marker.pageId, { marker: structuredClone(marker), etag: randomUUID() });
    },
  };
  const gate = () => {
    let resume!: () => void;
    let announce!: () => void;
    const started = new Promise<void>((resolve) => { announce = resolve; });
    const released = new Promise<void>((resolve) => { resume = resolve; });
    return { started, release: resume, wait: async () => { announce(); await released; } };
  };
  const aGate = gate();
  const bGate = gate();
  const heavySyncs: string[] = [];
  let invalidations = 0;
  const run = (token: string, requestedAt: string, timer: ReturnType<typeof gate>) =>
    coalescePageNotification(pageId, "page.content_updated", token, requestedAt, {
      classify: async () => ({ published: true }),
      heal: async () => {},
      register: (id, owner, at) => registerSyncMarker(id, owner, at, markerPorts),
      wait: timer.wait,
      syncCurrent: (id, owner) => syncPageIfCurrentMarker(id, owner, markerPorts.read, async () => {
        heavySyncs.push(owner);
        return { action: "published", needsInvalidation: true };
      }),
      sync: async () => { assert.fail("public notifications must wait"); },
      cleanup: async () => {},
      invalidate: async () => { invalidations++; },
    });

  const a = run("run-a", "2026-01-01T00:00:00.000Z", aGate);
  await aGate.started;
  const b = run("run-b", "2026-01-01T00:00:01.000Z", bGate);
  await bGate.started;
  assert.deepEqual(heavySyncs, []);

  aGate.release();
  assert.deepEqual(await a, { action: "superseded" });
  assert.deepEqual(heavySyncs, []);
  assert.equal(invalidations, 0);

  bGate.release();
  assert.deepEqual(await b, { action: "published" });
  assert.deepEqual(heavySyncs, ["run-b"]);
  assert.equal(invalidations, 1);
  assert.equal(markers.get(pageId)?.marker.token, "run-b");
});

test("an immediate withdrawal supersedes an older public wait across republish", async () => {
  const pageId = randomUUID();
  const markers = new Map<string, { marker: SyncMarker; etag: string }>();
  const markerPorts: SyncMarkerPorts = {
    read: async (id) => {
      const stored = markers.get(id);
      return { marker: stored?.marker ?? null, etag: stored?.etag ?? null };
    },
    write: async (marker, etag) => {
      const stored = markers.get(marker.pageId);
      if ((stored?.etag ?? null) !== etag) throw new ConcurrentPublicationError();
      markers.set(marker.pageId, { marker: structuredClone(marker), etag: randomUUID() });
    },
  };
  const gate = () => {
    let resume!: () => void;
    let announce!: () => void;
    const started = new Promise<void>((resolve) => { announce = resolve; });
    const released = new Promise<void>((resolve) => { resume = resolve; });
    return { started, release: resume, wait: async () => { announce(); await released; } };
  };
  const aGate = gate();
  const cGate = gate();
  let published = true;
  let invalidations = 0;
  const heavySyncs: string[] = [];
  const steps = (timer: ReturnType<typeof gate>) => ({
    classify: async () => ({ published }),
    heal: async () => {},
    register: (id: string, token: string, requestedAt: string) =>
      registerSyncMarker(id, token, requestedAt, markerPorts),
    wait: timer.wait,
    syncCurrent: (id: string, token: string) => syncPageIfCurrentMarker(
      id,
      token,
      markerPorts.read,
      async () => {
        assert.equal(published, true);
        heavySyncs.push(token);
        return { action: "published", needsInvalidation: true };
      },
    ),
    sync: async () => {
      assert.fail("a public notification must wait");
    },
    cleanup: async () => {},
    invalidate: async () => { invalidations++; },
  });

  const a = coalescePageNotification(
    pageId, "page.content_updated", "run-a", "2026-01-01T00:00:00.000Z", steps(aGate),
  );
  await aGate.started;
  assert.equal(markers.get(pageId)?.marker.token, "run-a");

  published = false;
  const withdrawal = await coalescePageNotification(
    pageId,
    "page.properties_updated",
    "run-b",
    "2026-01-01T00:00:01.000Z",
    {
      ...steps(aGate),
      classify: async () => ({ published: false }),
      wait: async () => { assert.fail("withdrawal must not wait"); },
      sync: async () => {
        assert.equal(published, false);
        assert.equal(markers.get(pageId)?.marker.token, "run-b");
        return { action: "withdrawn", needsInvalidation: true };
      },
    },
  );
  assert.deepEqual(withdrawal, { action: "withdrawn" });
  assert.equal(markers.get(pageId)?.marker.token, "run-b");
  assert.equal(invalidations, 1);

  published = true;
  aGate.release();
  assert.deepEqual(await a, { action: "superseded" });
  assert.deepEqual(heavySyncs, []);
  assert.equal(invalidations, 1);

  const c = coalescePageNotification(
    pageId, "page.content_updated", "run-c", "2026-01-01T00:00:02.000Z", steps(cGate),
  );
  await cGate.started;
  assert.deepEqual(heavySyncs, []);
  assert.equal(markers.get(pageId)?.marker.token, "run-c");
  assert.equal(invalidations, 1);

  cGate.release();
  assert.deepEqual(await c, { action: "published" });
  assert.deepEqual(heavySyncs, ["run-c"]);
  assert.equal(invalidations, 2);
});

test("delete notifications bypass debounce even if the lookup still appears public", async () => {
  const calls: string[] = [];
  const result = await coalescePageNotification("page", "page.deleted", "delete-run", "2026-01-01T00:00:00.000Z", {
    classify: async () => ({ published: true }),
    heal: async () => { calls.push("heal"); },
    register: async () => { calls.push("register"); return "accepted"; },
    wait: async () => { calls.push("wait"); },
    syncCurrent: async () => { calls.push("sync-current"); return { action: "published", needsInvalidation: false }; },
    sync: async () => { calls.push("immediate-sync"); return { action: "withdrawn", needsInvalidation: true }; },
    cleanup: async () => { calls.push("cleanup"); },
    invalidate: async () => { calls.push("invalidate"); },
  });
  assert.deepEqual(result, { action: "withdrawn" });
  assert.deepEqual(calls, ["register", "immediate-sync", "invalidate", "cleanup"]);
});

test("a stale public timer re-reads withdrawn state after immediate withdrawal sync", async () => {
  let published = true;
  let bodyWritten = false;
  let releaseSleep!: () => void;
  let sleepStarted!: () => void;
  const waiting = new Promise<void>((resolve) => { releaseSleep = resolve; });
  const started = new Promise<void>((resolve) => { sleepStarted = resolve; });
  const publicSteps = {
    classify: async () => ({ published }),
    heal: async () => {},
    register: async () => "accepted" as const,
    wait: async () => { sleepStarted(); await waiting; },
    syncCurrent: async () => {
      if (published) {
        bodyWritten = true;
        return { action: "published", needsInvalidation: true };
      }
      return { action: "unchanged", needsInvalidation: false };
    },
    sync: async () => ({ action: "unchanged", needsInvalidation: false }),
    cleanup: async () => {},
    invalidate: async () => {},
  };
  const pendingPublic = coalescePageNotification(
    "page", "page.content_updated", "public-run", "2026-01-01T00:00:00.000Z", publicSteps,
  );
  await started;
  published = false;
  const withdrawal = await coalescePageNotification("page", "page.properties_updated", "withdrawal-run", "2026-01-01T00:00:01.000Z", {
    ...publicSteps,
    classify: async () => ({ published: false }),
    wait: async () => { assert.fail("withdrawal must not wait"); },
    sync: async () => ({ action: "withdrawn", needsInvalidation: true }),
  });
  assert.deepEqual(withdrawal, { action: "withdrawn" });
  releaseSleep();
  assert.deepEqual(await pendingPublic, { action: "unchanged" });
  assert.equal(bodyWritten, false);
});

test("empty reconciliation still invalidates a previously cached list", async () => {
  const order: string[] = [];
  assert.deepEqual(await reconcilePagesAndCleanup(
    [],
    async () => { assert.fail("no pages to sync"); },
    async () => { order.push("cleanup"); },
    async () => { order.push("invalidate"); },
  ), { count: 0 });
  assert.deepEqual(order, ["cleanup", "invalidate"]);
});
