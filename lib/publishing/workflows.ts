import { FatalError, RetryableError, getStepMetadata, getWorkflowMetadata, sleep } from "workflow";

import { cleanRetiredAssets, syncPage } from "./sync";
import { ConcurrentPublicationError, PublicationError, pageMetadata } from "./model";
import { BlobConfigurationError, readSnapshot, readSyncMarker, writeSnapshot, writeSyncMarker } from "./blob";
import { publishingPorts } from "./ports";
import { queryPages } from "./notion";
import { registerSyncMarker, syncPageIfCurrentMarker, type SyncRegistration } from "./coalesce";
import { CacheInvalidationConfigurationError, cacheInvalidationConfig, invalidateBlogCacheIfPending, requestBlogCacheInvalidation } from "./cache-invalidation";

// Writing in Notion produces a burst of notifications; only the last one should publish.
export const PUBLIC_SYNC_DEBOUNCE = "60s";

function delay() {
  return Math.min(30_000, 10_000 * Math.max(1, getStepMetadata().attempt));
}

function syncFailure(error: unknown): never {
  if (error instanceof FatalError) throw error;
  if (error instanceof CacheInvalidationConfigurationError) throw new FatalError(error.message);
  if (error instanceof PublicationError || (error instanceof Error && ["ZodError", "CmsError", "BlobConfigurationError"].includes(error.name))) {
    throw new FatalError(error instanceof PublicationError ? error.message : "Notion の公開データ形式を確認してください。");
  }
  if (error instanceof ConcurrentPublicationError) throw new RetryableError("公開スナップショットが競合しました。", { retryAfter: delay() });
  throw new RetryableError("記事同期を再試行します。", { retryAfter: delay() });
}

async function syncPageStep(id: string) {
  "use step";
  try {
    cacheInvalidationConfig();
    const result = await syncPage(id, publishingPorts());
    console.info("blog sync page", { id, action: result.action });
    return { action: result.action, needsInvalidation: result.needsInvalidation };
  } catch (error) {
    syncFailure(error);
  }
}
syncPageStep.maxRetries = 5;

// The token is re-read inside the same step so a retry cannot publish a superseded body.
async function syncCurrentPageStep(id: string, token: string) {
  "use step";
  try {
    cacheInvalidationConfig();
    const result = await syncPageIfCurrentMarker(id, token, readSyncMarker, async () => {
      const synced = await syncPage(id, publishingPorts());
      console.info("blog sync page", { id, action: synced.action });
      return { action: synced.action, needsInvalidation: synced.needsInvalidation };
    });
    if (result.action === "superseded") {
      console.info("blog sync page", { id, action: "superseded" });
    }
    return result;
  } catch (error) {
    syncFailure(error);
  }
}
syncCurrentPageStep.maxRetries = 5;

async function classifyPageStep(id: string) {
  "use step";
  try {
    cacheInvalidationConfig();
    const ports = publishingPorts();
    const page = await ports.page(id);
    return { published: Boolean(page && pageMetadata(page, ports.dataSourceId)) };
  } catch (error) {
    syncFailure(error);
  }
}
classifyPageStep.maxRetries = 5;

async function registerSyncMarkerStep(id: string, token: string, requestedAt: string): Promise<SyncRegistration> {
  "use step";
  try {
    return await registerSyncMarker(id, token, requestedAt, { read: readSyncMarker, write: writeSyncMarker });
  } catch (error) {
    syncFailure(error);
  }
}
registerSyncMarkerStep.maxRetries = 5;

async function invalidateBlogCacheStep() {
  "use step";
  try {
    await invalidateBlogCacheIfPending({
      read: readSnapshot, write: writeSnapshot, invalidate: () => requestBlogCacheInvalidation(),
    }, true);
  } catch (error) {
    if (error instanceof CacheInvalidationConfigurationError) throw new FatalError(error.message);
    throw new RetryableError("記事キャッシュの失効を再試行します。", { retryAfter: delay() });
  }
}
invalidateBlogCacheStep.maxRetries = 5;

// Heals an earlier write whose cache invalidation failed, without forcing a new request.
async function healBlogCacheStep() {
  "use step";
  try {
    await invalidateBlogCacheIfPending({
      read: readSnapshot, write: writeSnapshot, invalidate: () => requestBlogCacheInvalidation(),
    });
  } catch (error) {
    if (error instanceof CacheInvalidationConfigurationError) throw new FatalError(error.message);
    throw new RetryableError("記事キャッシュの失効を再試行します。", { retryAfter: delay() });
  }
}
healBlogCacheStep.maxRetries = 5;

async function reconcileIdsStep() {
  "use step";
  try {
    const [pages, previous] = await Promise.all([queryPages(), readSnapshot()]);
    return [...new Set([...pages.map((page) => page.id), ...previous.snapshot.posts.map((post) => post.id)])];
  } catch (error) {
    if (error instanceof PublicationError || error instanceof BlobConfigurationError) {
      throw new FatalError(error instanceof PublicationError ? error.message : "公開ストレージの設定を確認してください。");
    }
    throw new RetryableError("Notion の記事一覧を再取得します。", { retryAfter: delay() });
  }
}
reconcileIdsStep.maxRetries = 5;

async function cleanupStep() {
  "use step";
  try {
    await cleanRetiredAssets(publishingPorts());
  } catch (error) {
    if (error instanceof PublicationError || error instanceof BlobConfigurationError) {
      throw new FatalError(error instanceof PublicationError ? error.message : "公開ストレージの設定を確認してください。");
    }
    throw new RetryableError("古い画像の cleanup を再試行します。", { retryAfter: delay() });
  }
}
cleanupStep.maxRetries = 5;

export async function reconcilePagesAndCleanup(
  ids: string[],
  sync: (id: string) => Promise<{ needsInvalidation: boolean }>,
  cleanup: () => Promise<void>,
  invalidate: () => Promise<void>,
) {
  const failures: string[] = [];
  for (const id of ids) {
    try {
      // A pending flag also heals an earlier withdrawal whose invalidation failed.
      if ((await sync(id)).needsInvalidation) await invalidate();
    } catch {
      failures.push(id);
    }
  }
  await cleanup();
  if (failures.length) throw new FatalError(`記事同期に失敗しました (${failures.length}件)。`);
  if (!ids.length) await invalidate();
  return { count: ids.length };
}

export async function reconcileBlogWorkflow(targetPageId?: string) {
  "use workflow";
  const ids = targetPageId ? [targetPageId] : await reconcileIdsStep();
  return reconcilePagesAndCleanup(ids, syncPageStep, cleanupStep, invalidateBlogCacheStep);
}

export type PageNotificationSteps = {
  classify: (id: string, eventType: string) => Promise<{ published: boolean }>;
  heal: () => Promise<void>;
  register: (id: string, token: string, requestedAt: string) => Promise<SyncRegistration>;
  wait: () => Promise<unknown>;
  syncCurrent: (id: string, token: string) => Promise<{ action: string; needsInvalidation: boolean }>;
  sync: (id: string) => Promise<{ action: string; needsInvalidation: boolean }>;
  cleanup: () => Promise<void>;
  invalidate: () => Promise<void>;
};

export async function coalescePageNotification(
  pageId: string,
  eventType: string,
  token: string,
  requestedAt: string,
  steps: PageNotificationSteps,
) {
  const state = await steps.classify(pageId, eventType);
  const published = state.published && !["page.deleted", "page.moved"].includes(eventType);
  let result: { action: string; needsInvalidation: boolean };
  if (published) {
    // Heal pending invalidation before sleeping or exiting as superseded.
    await steps.heal();
    if ((await steps.register(pageId, token, requestedAt)) === "superseded") {
      return { action: "superseded" as const };
    }
    await steps.wait();
    result = await steps.syncCurrent(pageId, token);
    if (result.action === "superseded") return { action: "superseded" as const };
  } else {
    result = await steps.sync(pageId);
  }
  if (result.needsInvalidation) await steps.invalidate();
  await steps.cleanup();
  return { action: result.action };
}

export async function syncNotionPageWorkflow(pageId: string, eventType: string, requestedAt: string) {
  "use workflow";
  const { workflowRunId } = getWorkflowMetadata();
  return coalescePageNotification(pageId, eventType, workflowRunId, requestedAt, {
    classify: classifyPageStep,
    heal: healBlogCacheStep,
    register: registerSyncMarkerStep,
    wait: () => sleep(PUBLIC_SYNC_DEBOUNCE),
    syncCurrent: syncCurrentPageStep,
    sync: syncPageStep,
    cleanup: cleanupStep,
    invalidate: invalidateBlogCacheStep,
  });
}
