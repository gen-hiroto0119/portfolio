import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const baseUrl = process.env.ISR_BASE_URL;
if (!baseUrl) throw new Error("ISR_BASE_URL must be explicitly provided by the delivery runner");
const base = new URL(baseUrl);
const baseOrigin = base.origin;
const fixturePath = process.env.ISR_FIXTURE_PATH;
const readsPath = process.env.ISR_READS_PATH;
const secret = process.env.ISR_TEST_SECRET;
const ogpFailures = [];

const articleId = "00000000-0000-4000-8000-000000000001";
const baselineSlug = "isr-runtime-entry";
const renamedSlug = "isr-runtime-renamed";
const publicationDate = "2026-01-02";
const publicationTimestamp = "2026-01-02T00:00:00+09:00";
const baselineSourceEditedAt = "2026-01-02T03:04:05.000Z";
const editedSourceEditedAt = "2026-02-03T04:05:06.000Z";
const renamedSourceEditedAt = "2026-03-04T05:06:07.000Z";
const republishedSourceEditedAt = "2026-04-05T06:07:08.000Z";

if (!fixturePath || !readsPath || !secret) {
  throw new Error("ISR fixture, read-counter, and test-secret paths are required");
}
if (
  base.protocol !== "http:"
  || !["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)
  || !base.port
  || base.username
  || base.password
  || base.pathname !== "/"
  || base.search
  || base.hash
) {
  throw new Error("ISR_BASE_URL must be an HTTP loopback origin with an explicit port");
}

function post({
  slug,
  title,
  heading,
  paragraph,
  sourceEditedAt,
}) {
  return {
    id: articleId,
    slug,
    title,
    description: `${title} description`,
    date: publicationDate,
    category: "tech",
    tags: ["fixture"],
    published: true,
    publishedAt: publicationTimestamp,
    revision: 1,
    sourceEditedAt,
    body: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: heading }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: paragraph }],
        },
      ],
    },
    assets: [],
  };
}

function snapshot(postValue) {
  return {
    version: 1,
    generation: randomUUID(),
    posts: postValue ? [postValue] : [],
    garbage: [],
  };
}

function writeSnapshot(postValue) {
  writeFileSync(fixturePath, `${JSON.stringify(snapshot(postValue))}\n`);
}

function readCount() {
  try {
    const value = readFileSync(readsPath, "utf8").trim();
    return value ? value.split("\n").length : 0;
  } catch {
    return 0;
  }
}

function report(name, details = {}) {
  console.log(JSON.stringify({ check: name, ...details }));
}

async function response(path, options = {}) {
  const url = new URL(path, baseUrl);
  assert.equal(url.origin, baseOrigin, "HTTP requests must remain on the local test origin");
  const result = await fetch(url, {
    redirect: "manual",
    ...options,
  });
  const bytes = new Uint8Array(await result.arrayBuffer());
  return {
    status: result.status,
    headers: result.headers,
    bytes,
    text: new TextDecoder().decode(bytes),
  };
}

function requireStatus(result, status, name) {
  assert.equal(result.status, status, `${name} status`);
}

function requireText(result, text, name) {
  assert.ok(result.text.includes(text), `${name} contains expected text`);
}

function requireAbsent(result, text, name) {
  assert.ok(!result.text.includes(text), `${name} omits unexpected text`);
}

function isNoIndex(result) {
  const tag = result.text.match(/<meta[^>]*name="robots"[^>]*>/i)?.[0] ?? "";
  return /noindex/i.test(tag);
}

function requireNotFoundPage(result, name, unexpectedText) {
  assert.ok(
    result.text.includes("ページが見つかりませんでした。"),
    `${name} not-found content`,
  );
  assert.ok(isNoIndex(result), `${name} noindex`);
  requireAbsent(result, unexpectedText, name);
}

function rssDate(timestamp) {
  return new Date(timestamp).toUTCString();
}

function rssPublicationDate() {
  return new Date(`${publicationDate}T00:00:00+09:00`).toUTCString();
}

async function invalidate(authenticated, name) {
  const result = await response("/api/notion/revalidate", {
    method: "POST",
    headers: authenticated ? { authorization: `Bearer ${secret}` } : {},
  });
  requireStatus(result, authenticated ? 200 : 401, authenticated ? "authorized invalidation" : "unauthorized invalidation");
  if (authenticated) {
    assert.deepEqual(JSON.parse(result.text), { ok: true });
  }
  report(name ?? (authenticated ? "authorized-invalidation" : "unauthorized-invalidation"), {
    status: result.status,
  });
}

function ogImagePath(detail) {
  const tag = detail.text.match(/<meta[^>]*property="og:image"[^>]*>/i)?.[0];
  const value = tag?.match(/content="([^"]+)"/i)?.[1];
  if (!value) return { url: null, reason: "metadata URL unavailable" };

  try {
    const url = new URL(value.replaceAll("&amp;", "&"), baseUrl);
    if (url.origin !== baseOrigin || url.username || url.password) {
      return { url: null, reason: "metadata URL was not same-origin" };
    }
    return { url: url.toString(), reason: null };
  } catch {
    return { url: null, reason: "metadata URL was invalid" };
  }
}

async function inspectOgp(name, candidate, expectedStatus) {
  if (!candidate?.url) {
    ogpFailures.push({ check: name, reason: candidate?.reason ?? "metadata URL unavailable" });
    report(name, {
      status: null,
      expectedStatus,
      noStore: false,
      ok: false,
      reason: candidate?.reason ?? "metadata URL unavailable",
    });
    return { url: null, status: null, noStore: false, ok: false };
  }

  try {
    const result = await response(candidate.url);
    const noStore = /no-store/i.test(result.headers.get("cache-control") ?? "");
    const contentType = result.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    const pngSignature = result.bytes.length >= 8
      && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
        .every((value, index) => result.bytes[index] === value);
    const checks = [];
    if (result.status !== expectedStatus) checks.push(`expected HTTP ${expectedStatus}`);
    if (expectedStatus === 200) {
      if (contentType !== "image/png") checks.push("expected image/png");
      if (!result.bytes.length || !pngSignature) checks.push("invalid PNG payload");
      if (!noStore) checks.push("missing no-store cache control");
    }
    const ok = checks.length === 0;
    if (!ok) ogpFailures.push({ check: name, failures: checks });
    report(name, {
      status: result.status,
      expectedStatus,
      contentType,
      bytes: result.bytes.length,
      pngSignature,
      noStore,
      ok,
    });
    return { url: candidate.url, status: result.status, noStore, ok };
  } catch {
    ogpFailures.push({ check: name, reason: "request failed" });
    report(name, {
      status: null,
      expectedStatus,
      noStore: false,
      ok: false,
      reason: "request failed",
    });
    return { url: candidate.url, status: null, noStore: false, ok: false };
  }
}

async function seed() {
  writeSnapshot(
    post({
      slug: baselineSlug,
      title: "ISR Fixture Title v1",
      heading: "Fixture heading v1",
      paragraph: "Fixture paragraph v1",
      sourceEditedAt: baselineSourceEditedAt,
    }),
  );
}

if (process.argv.includes("--seed")) {
  await seed();
  process.exit(0);
}

const prerenderManifest = JSON.parse(
  readFileSync(new URL("../../.next/prerender-manifest.json", import.meta.url), "utf8"),
);
assert.equal(
  Object.hasOwn(prerenderManifest.routes, "/sitemap.xml"),
  false,
  "sitemap must be rendered dynamically instead of emitted as a static asset",
);

await seed();
await invalidate(true, "baseline-reset");
const startingReads = readCount();
const home = await response("/");
const list = await response("/blog");
const baselineDetail = await response(`/blog/${baselineSlug}`);
const baselineFeed = await response("/feed.xml");
const baselineSitemap = await response("/sitemap.xml");

for (const [name, result] of [
  ["home", home],
  ["blog-list", list],
  ["detail", baselineDetail],
  ["feed", baselineFeed],
  ["sitemap", baselineSitemap],
]) {
  requireStatus(result, 200, `baseline ${name}`);
}

for (const [name, result] of [
  ["home", home],
  ["blog-list", list],
  ["detail", baselineDetail],
  ["feed", baselineFeed],
]) {
  requireText(result, "ISR Fixture Title v1", `baseline ${name}`);
  requireAbsent(result, "ISR Fixture Title v2", `baseline ${name}`);
}
requireText(baselineDetail, "Fixture heading v1", "baseline detail");
requireText(baselineDetail, "Fixture paragraph v1", "baseline detail");
const footerHtml = baselineDetail.text.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] ?? "";
requireText({ text: footerHtml }, "HirotoFurugen", "baseline footer");
requireAbsent({ text: footerHtml }, "Follow Me", "baseline footer");
requireText(baselineFeed, `/blog/${baselineSlug}`, "baseline feed");
requireText(baselineSitemap, `/blog/${baselineSlug}`, "baseline sitemap");
requireText(baselineFeed, `<lastBuildDate>${rssDate(baselineSourceEditedAt)}</lastBuildDate>`, "baseline feed");
requireText(baselineFeed, `<pubDate>${rssPublicationDate()}</pubDate>`, "baseline feed");

const baselineOgp = await inspectOgp("baseline-ogp", ogImagePath(baselineDetail), 200);
const warmedReads = readCount();
report("baseline", {
  statuses: [home.status, list.status, baselineDetail.status, baselineFeed.status, baselineSitemap.status, baselineOgp.status],
  blobReads: warmedReads - startingReads,
});

const repeatedFeed = await response("/feed.xml");
requireStatus(repeatedFeed, 200, "repeated feed");
requireText(repeatedFeed, "ISR Fixture Title v1", "repeated feed");
assert.equal(readCount(), warmedReads, "repeated cached read avoids Blob fetch");

writeSnapshot(
  post({
    slug: baselineSlug,
    title: "ISR Fixture Title v2",
    heading: "Fixture heading v2",
    paragraph: "Fixture paragraph v2",
    sourceEditedAt: editedSourceEditedAt,
  }),
);
await invalidate(false);
const unauthorizedFeed = await response("/feed.xml");
requireStatus(unauthorizedFeed, 200, "unauthorized follow-up feed");
requireText(unauthorizedFeed, "ISR Fixture Title v1", "unauthorized follow-up feed");
requireAbsent(unauthorizedFeed, "ISR Fixture Title v2", "unauthorized follow-up feed");
assert.equal(readCount(), warmedReads, "unauthorized invalidation preserves cached Blob read");
report("unauthorized-preserves-cache", { blobReads: readCount() });

await invalidate(true);
const editedFeed = await response("/feed.xml");
requireStatus(editedFeed, 200, "edited feed");
requireText(editedFeed, "ISR Fixture Title v2", "edited feed");
requireAbsent(editedFeed, "ISR Fixture Title v1", "edited feed");
requireText(editedFeed, `<lastBuildDate>${rssDate(editedSourceEditedAt)}</lastBuildDate>`, "edited feed");
requireText(editedFeed, `<pubDate>${rssPublicationDate()}</pubDate>`, "edited feed");
const afterEditReads = readCount();
assert.equal(afterEditReads, warmedReads + 1, "authenticated invalidation refreshes Blob snapshot once");

const editedHome = await response("/");
const editedList = await response("/blog");
const editedDetail = await response(`/blog/${baselineSlug}`);
const editedSitemap = await response("/sitemap.xml");
for (const [name, result] of [
  ["home", editedHome],
  ["blog-list", editedList],
  ["detail", editedDetail],
]) {
  requireStatus(result, 200, `edited ${name}`);
  requireText(result, "ISR Fixture Title v2", `edited ${name}`);
  requireAbsent(result, "ISR Fixture Title v1", `edited ${name}`);
}
requireStatus(editedSitemap, 200, "edited sitemap");
requireText(editedDetail, "Fixture heading v2", "edited detail");
requireText(editedDetail, "Fixture paragraph v2", "edited detail");
requireText(editedSitemap, `/blog/${baselineSlug}`, "edited sitemap");
assert.equal(readCount(), afterEditReads, "edited routes reuse refreshed snapshot");
const editedOgp = await inspectOgp("edited-ogp", ogImagePath(editedDetail), 200);
const afterEditedOgpReads = readCount();
report("authenticated-edit", {
  statuses: [editedHome.status, editedList.status, editedDetail.status, editedFeed.status, editedSitemap.status, editedOgp.status],
  blobReads: afterEditedOgpReads,
  ogpBlobReads: afterEditedOgpReads - afterEditReads,
});

writeSnapshot(
  post({
    slug: renamedSlug,
    title: "ISR Fixture Title v3",
    heading: "Fixture heading v3",
    paragraph: "Fixture paragraph v3",
    sourceEditedAt: renamedSourceEditedAt,
  }),
);
await invalidate(true);
const oldPath = await response(`/blog/${baselineSlug}`);
requireNotFoundPage(oldPath, "renamed old detail", "ISR Fixture Title v2");
const renamedDetail = await response(`/blog/${renamedSlug}`);
const renamedList = await response("/blog");
const renamedFeed = await response("/feed.xml");
const renamedSitemap = await response("/sitemap.xml");
for (const [name, result] of [
  ["detail", renamedDetail],
  ["blog-list", renamedList],
  ["feed", renamedFeed],
]) {
  requireStatus(result, 200, `renamed ${name}`);
  requireText(result, "ISR Fixture Title v3", `renamed ${name}`);
  requireAbsent(result, "ISR Fixture Title v2", `renamed ${name}`);
  requireAbsent(result, `/blog/${baselineSlug}`, `renamed ${name}`);
}
requireStatus(renamedSitemap, 200, "renamed sitemap");
requireText(renamedSitemap, `/blog/${renamedSlug}`, "renamed sitemap");
requireAbsent(renamedSitemap, `/blog/${baselineSlug}`, "renamed sitemap");
requireText(renamedDetail, "Fixture heading v3", "renamed detail");
requireText(renamedDetail, "Fixture paragraph v3", "renamed detail");
const routeRenameReads = readCount();
assert.equal(routeRenameReads, afterEditedOgpReads + 1, "rename invalidation refreshes Blob snapshot once");
const renamedOgp = await inspectOgp("renamed-ogp", ogImagePath(renamedDetail), 200);
const afterRenameReads = readCount();
report("slug-rename", {
  oldStatus: oldPath.status,
  newStatus: renamedDetail.status,
  blobReads: afterRenameReads,
  ogpBlobReads: afterRenameReads - routeRenameReads,
});

writeFileSync(fixturePath, `${JSON.stringify(snapshot(null))}\n`);
await invalidate(true);
const withdrawnHome = await response("/");
const withdrawnList = await response("/blog");
const withdrawnFeed = await response("/feed.xml");
const withdrawnSitemap = await response("/sitemap.xml");
const withdrawnDetail = await response(`/blog/${renamedSlug}`);
for (const [name, result] of [
  ["home", withdrawnHome],
  ["blog-list", withdrawnList],
  ["feed", withdrawnFeed],
  ["sitemap", withdrawnSitemap],
]) {
  requireStatus(result, 200, `withdrawn ${name}`);
  requireAbsent(result, "ISR Fixture Title v3", `withdrawn ${name}`);
  requireAbsent(result, `/blog/${renamedSlug}`, `withdrawn ${name}`);
}
requireNotFoundPage(withdrawnDetail, "withdrawn detail", "ISR Fixture Title v3");
const routeWithdrawalReads = readCount();
assert.equal(routeWithdrawalReads, afterRenameReads + 1, "withdrawal invalidation refreshes Blob snapshot once");
const withdrawnOgp = await inspectOgp("withdrawn-ogp", { url: renamedOgp.url }, 404);
const afterWithdrawalReads = readCount();
report("withdrawal", {
  detailStatus: withdrawnDetail.status,
  ogpStatus: withdrawnOgp.status,
  blobReads: afterWithdrawalReads,
  ogpBlobReads: afterWithdrawalReads - routeWithdrawalReads,
});

writeSnapshot(
  post({
    slug: renamedSlug,
    title: "ISR Fixture Title v4",
    heading: "Fixture heading v4",
    paragraph: "Fixture paragraph v4",
    sourceEditedAt: republishedSourceEditedAt,
  }),
);
await invalidate(true);
const republishedDetail = await response(`/blog/${renamedSlug}`);
const republishedList = await response("/blog");
const republishedFeed = await response("/feed.xml");
const republishedSitemap = await response("/sitemap.xml");
for (const [name, result] of [
  ["detail", republishedDetail],
  ["blog-list", republishedList],
  ["feed", republishedFeed],
]) {
  requireStatus(result, 200, `republished ${name}`);
  requireText(result, "ISR Fixture Title v4", `republished ${name}`);
  requireAbsent(result, "ISR Fixture Title v3", `republished ${name}`);
}
requireStatus(republishedSitemap, 200, "republished sitemap");
requireText(republishedDetail, "Fixture heading v4", "republished detail");
requireText(republishedDetail, "Fixture paragraph v4", "republished detail");
requireText(republishedFeed, `<lastBuildDate>${rssDate(republishedSourceEditedAt)}</lastBuildDate>`, "republished feed");
requireText(republishedFeed, `<pubDate>${rssPublicationDate()}</pubDate>`, "republished feed");
requireText(republishedSitemap, `/blog/${renamedSlug}`, "republished sitemap");
const routeRepublishReads = readCount();
assert.equal(routeRepublishReads, afterWithdrawalReads + 1, "republish invalidation refreshes Blob snapshot once");
await inspectOgp("republished-ogp", ogImagePath(republishedDetail), 200);
const finalReads = readCount();
report("negative-cache-republish", {
  detailStatus: republishedDetail.status,
  blobReads: finalReads,
  ogpBlobReads: finalReads - routeRepublishReads,
});

if (ogpFailures.length) {
  console.error(JSON.stringify({ check: "ogp-failures", failures: ogpFailures }));
  process.exitCode = 1;
} else {
  report("ogp-checks", { ok: true });
}
