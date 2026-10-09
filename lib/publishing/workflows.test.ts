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
  ), FatalError);
  assert.deepEqual(order, ["sync:withdrawn", "sync:invalid", "cleanup"]);
});
