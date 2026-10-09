import assert from "node:assert/strict";
import { test } from "node:test";
import { FatalError } from "workflow";
import { reconcilePagesAndCleanup } from "./workflows";

test("reconciliation cleanup runs even if a page sync fails", async () => {
  const order: string[] = [];
  await assert.rejects(reconcilePagesAndCleanup(
    ["withdrawn", "invalid"],
    async (id) => {
      order.push(`sync:${id}`);
      if (id === "invalid") throw new Error("page failed");
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
