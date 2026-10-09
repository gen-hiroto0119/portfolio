import assert from "node:assert/strict";
import { test } from "node:test";

import { BLOG_CACHE_TAG } from "@/lib/content/cache-policy";
import { createBlogCacheInvalidationHandler } from "./cache-handler";
import { CacheInvalidationConfigurationError, requestBlogCacheInvalidation } from "./cache-invalidation";

async function withConfig(run: () => Promise<void>) {
  const values = {
    BLOG_SYNC_ENABLED: "true",
    BLOG_SYNC_SECRET: "s".repeat(32),
    NEXT_PUBLIC_SITE_URL: "https://blog.example.com",
    VERCEL: "1",
  };
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  try { await run(); }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("the invalidation route authenticates and expires only the shared blog tag", async () => {
  await withConfig(async () => {
    const calls: unknown[][] = [];
    const handler = createBlogCacheInvalidationHandler((...args) => { calls.push(args); });
    const send = (token?: string) => handler(new Request("https://blog.example.com/api/notion/revalidate?tag=other", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }));
    assert.equal((await send()).status, 401);
    assert.equal((await send("wrong")).status, 401);
    assert.equal(calls.length, 0);
    const response = await send(process.env.BLOG_SYNC_SECRET);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { ok: true });
    assert.deepEqual(calls, [[BLOG_CACHE_TAG, { expire: 0 }]]);
    process.env.BLOG_SYNC_ENABLED = "false";
    assert.equal((await send(process.env.BLOG_SYNC_SECRET)).status, 503);
    process.env.BLOG_SYNC_ENABLED = "true";
    delete process.env.BLOG_SYNC_SECRET;
    assert.equal((await send()).status, 503);
    assert.equal(calls.length, 1);
  });
});

test("invalidation errors are not acknowledged as successful", async () => {
  await withConfig(async () => {
    const handler = createBlogCacheInvalidationHandler(() => { throw new Error("unavailable"); });
    const response = await handler(new Request("https://blog.example.com/api/notion/revalidate", {
      method: "POST", headers: { authorization: `Bearer ${process.env.BLOG_SYNC_SECRET}` },
    }));
    assert.equal(response.status, 503);
  });
});

test("the workflow callback uses authenticated POST without caching or redirects", async () => {
  await withConfig(async () => {
    let calls = 0;
    await requestBlogCacheInvalidation(async (input, options) => {
      calls++;
      assert.equal(String(input), "https://blog.example.com/api/notion/revalidate");
      assert.equal(options?.method, "POST");
      assert.deepEqual(options?.headers, { authorization: `Bearer ${process.env.BLOG_SYNC_SECRET}` });
      assert.equal(options?.cache, "no-store");
      assert.equal(options?.redirect, "error");
      assert.ok(options?.signal instanceof AbortSignal);
      return Response.json({ ok: true });
    });
    assert.equal(calls, 1);
    for (const response of [
      Response.json({ ok: false }),
      Response.json({ ok: true }, { status: 503 }),
      new Response(null, { status: 307, headers: { location: "https://other.example.com" } }),
      new Response("not JSON"),
    ]) {
      await assert.rejects(requestBlogCacheInvalidation(async () => response), /失効要求に失敗/);
    }
    await assert.rejects(requestBlogCacheInvalidation(async () => { throw new Error("network error"); }), /失効要求に失敗/);
  });
});

test("missing or unsafe callback configuration fails before sending credentials", async () => {
  await withConfig(async () => {
    const neverFetch: typeof fetch = async () => { assert.fail("must not send a request"); };
    for (const url of ["", "not-a-url", "http://blog.example.com", "http://localhost:3000", "https://user:password@example.com", "https://blog.example.com/subpath"]) {
      process.env.NEXT_PUBLIC_SITE_URL = url;
      await assert.rejects(requestBlogCacheInvalidation(neverFetch), CacheInvalidationConfigurationError);
    }
    process.env.NEXT_PUBLIC_SITE_URL = "https://blog.example.com";
    delete process.env.BLOG_SYNC_SECRET;
    await assert.rejects(requestBlogCacheInvalidation(neverFetch), CacheInvalidationConfigurationError);
  });
});
