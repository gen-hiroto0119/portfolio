import { appendFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { isAbsolute, relative, resolve, sep } from "node:path";

const require = createRequire(import.meta.url);
const { MockAgent, setGlobalDispatcher } = require("undici");

const testRoot = resolve(process.env.ISR_TEST_ROOT ?? "");
const fixturePath = resolve(process.env.ISR_FIXTURE_PATH ?? "");
const readsPath = resolve(process.env.ISR_READS_PATH ?? "");
const token = process.env.BLOB_READ_WRITE_TOKEN ?? "";
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
const appOrigin = new URL(process.env.ISR_BASE_URL ?? "");

function isChildPath(path) {
  const rel = relative(testRoot, path);
  return rel !== ""
    && rel !== ".."
    && !rel.startsWith(`..${sep}`)
    && !isAbsolute(rel);
}

if (
  !process.env.ISR_TEST_ROOT
  || !process.env.ISR_FIXTURE_PATH
  || !process.env.ISR_READS_PATH
  || !isChildPath(fixturePath)
  || !isChildPath(readsPath)
) {
  throw new Error("Delivery fixture paths must be inside the isolated test root");
}

if (!/^vercel_blob_rw_ci_[a-f0-9]{64}$/.test(token)) {
  throw new Error("Delivery Blob token must be generated dummy-only credentials");
}

if (
  siteUrl.protocol !== "http:"
  || !["127.0.0.1", "localhost", "[::1]"].includes(siteUrl.hostname)
  || !siteUrl.port
  || siteUrl.username
  || siteUrl.password
  || siteUrl.pathname !== "/"
  || siteUrl.search
  || siteUrl.hash
  || appOrigin.origin !== siteUrl.origin
  || !["127.0.0.1", "localhost", "[::1]"].includes(appOrigin.hostname)
  || !appOrigin.port
  || appOrigin.username
  || appOrigin.password
  || appOrigin.pathname !== "/"
  || appOrigin.search
  || appOrigin.hash
  || process.env.BLOG_SYNC_ENABLED !== "true"
  || !/^[a-f0-9]{64}$/.test(process.env.BLOG_SYNC_SECRET ?? "")
  || process.env.BLOG_SYNC_SECRET !== process.env.ISR_TEST_SECRET
  || process.env.VERCEL
  || process.env.VERCEL_TOKEN
  || process.env.NOTION_API_KEY
) {
  throw new Error("Delivery preload requires an isolated loopback-only dummy environment");
}

const storeId = token.split("_")[3];
const blobOrigin = `https://${storeId}.private.blob.vercel-storage.com`;
const agent = new MockAgent();
agent.disableNetConnect();

agent
  .get(blobOrigin)
  .intercept({ method: "GET", path: "/blog/snapshot.json?cache=0" })
  .reply(() => {
    const data = readFileSync(fixturePath);
    const snapshot = JSON.parse(data.toString("utf8"));
    appendFileSync(
      readsPath,
      `${JSON.stringify({ pid: process.pid, generation: snapshot.generation })}\n`,
    );
    return {
      statusCode: 200,
      data,
      responseOptions: {
        headers: {
          "cache-control": "private, no-store",
          "content-length": String(data.byteLength),
          "content-type": "application/json",
          etag: `"${snapshot.generation}"`,
          "x-vercel-id": "mock-local",
        },
      },
    };
  })
  .persist();

setGlobalDispatcher(agent);
