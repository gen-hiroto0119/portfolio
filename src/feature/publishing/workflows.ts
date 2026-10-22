import {
  FatalError,
  RetryableError,
  getStepMetadata,
  getWorkflowMetadata,
  sleep,
} from "workflow";

import {
  cleanRetiredAssets,
  syncPage,
  registerSyncMarker,
  syncPageIfCurrentMarker,
  isPagePublished,
  reconciliationIds,
  type SyncRegistration,
} from "./service";
import {
  BlobConfigurationError,
  ConcurrentPublicationError,
  PublicationError,
} from "./domain";

// Writing in Notion produces a burst of notifications; only the last one should publish.
const PUBLIC_SYNC_DEBOUNCE = "60s";

function delay() {
  return Math.min(30_000, 10_000 * Math.max(1, getStepMetadata().attempt));
}

function syncFailure(error: unknown): never {
  if (error instanceof FatalError) throw error;
  if (
    error instanceof PublicationError ||
    (error instanceof Error &&
      ["ZodError", "CmsError", "BlobConfigurationError"].includes(error.name))
  ) {
    throw new FatalError(
      error instanceof PublicationError
        ? error.message
        : "Notion の公開データ形式を確認してください。",
    );
  }
  if (error instanceof ConcurrentPublicationError)
    throw new RetryableError("公開スナップショットが競合しました。", {
      retryAfter: delay(),
    });
  throw new RetryableError("記事同期を再試行します。", { retryAfter: delay() });
}

async function syncPageStep(id: string) {
  "use step";
  try {
    const result = await syncPage(id);
    console.info("blog sync page", { id, action: result.action });
    return { action: result.action };
  } catch (error) {
    syncFailure(error);
  }
}
syncPageStep.maxRetries = 5;

// The token is re-read inside the same step so a retry cannot publish a superseded body.
async function syncCurrentPageStep(id: string, token: string) {
  "use step";
  try {
    const result = await syncPageIfCurrentMarker(id, token);
    console.info("blog sync page", { id, action: result.action });
    return result;
  } catch (error) {
    syncFailure(error);
  }
}
syncCurrentPageStep.maxRetries = 5;

async function classifyPageStep(id: string) {
  "use step";
  try {
    return { published: await isPagePublished(id) };
  } catch (error) {
    syncFailure(error);
  }
}
classifyPageStep.maxRetries = 5;

async function registerSyncMarkerStep(
  id: string,
  token: string,
  requestedAt: string,
): Promise<SyncRegistration> {
  "use step";
  try {
    return await registerSyncMarker(id, token, requestedAt);
  } catch (error) {
    syncFailure(error);
  }
}
registerSyncMarkerStep.maxRetries = 5;

async function reconcileIdsStep() {
  "use step";
  try {
    return await reconciliationIds();
  } catch (error) {
    if (
      error instanceof PublicationError ||
      error instanceof BlobConfigurationError
    ) {
      throw new FatalError(
        error instanceof PublicationError
          ? error.message
          : "公開ストレージの設定を確認してください。",
      );
    }
    throw new RetryableError("Notion の記事一覧を再取得します。", {
      retryAfter: delay(),
    });
  }
}
reconcileIdsStep.maxRetries = 5;

async function cleanupStep() {
  "use step";
  try {
    await cleanRetiredAssets();
  } catch (error) {
    if (
      error instanceof PublicationError ||
      error instanceof BlobConfigurationError
    ) {
      throw new FatalError(
        error instanceof PublicationError
          ? error.message
          : "公開ストレージの設定を確認してください。",
      );
    }
    throw new RetryableError("古い画像の cleanup を再試行します。", {
      retryAfter: delay(),
    });
  }
}
cleanupStep.maxRetries = 5;

export async function reconcileBlogWorkflow(targetPageId?: string) {
  "use workflow";
  const ids = targetPageId ? [targetPageId] : await reconcileIdsStep();
  const failures: string[] = [];
  for (const id of ids) {
    try {
      await syncPageStep(id);
    } catch {
      failures.push(id);
    }
  }
  await cleanupStep();
  if (failures.length)
    throw new FatalError(`記事同期に失敗しました (${failures.length}件)。`);
  return { count: ids.length };
}

type PageNotificationSteps = {
  classify: (id: string, eventType: string) => Promise<{ published: boolean }>;
  register: (
    id: string,
    token: string,
    requestedAt: string,
  ) => Promise<SyncRegistration>;
  wait: () => Promise<unknown>;
  syncCurrent: (id: string, token: string) => Promise<{ action: string }>;
  sync: (id: string) => Promise<{ action: string }>;
  cleanup: () => Promise<void>;
};

async function coalescePageNotification(
  pageId: string,
  eventType: string,
  token: string,
  requestedAt: string,
  steps: PageNotificationSteps,
) {
  const state = await steps.classify(pageId, eventType);
  const published =
    state.published && !["page.deleted", "page.moved"].includes(eventType);
  let result: { action: string };
  if (published) {
    if ((await steps.register(pageId, token, requestedAt)) === "superseded") {
      return { action: "superseded" as const };
    }
    await steps.wait();
    result = await steps.syncCurrent(pageId, token);
    if (result.action === "superseded")
      return { action: "superseded" as const };
  } else {
    await steps.register(pageId, token, requestedAt);
    result = await steps.sync(pageId);
  }
  await steps.cleanup();
  return { action: result.action };
}

export async function syncNotionPageWorkflow(
  pageId: string,
  eventType: string,
  requestedAt: string,
) {
  "use workflow";
  const { workflowRunId } = getWorkflowMetadata();
  return coalescePageNotification(
    pageId,
    eventType,
    workflowRunId,
    requestedAt,
    {
      classify: classifyPageStep,
      register: registerSyncMarkerStep,
      wait: () => sleep(PUBLIC_SYNC_DEBOUNCE),
      syncCurrent: syncCurrentPageStep,
      sync: syncPageStep,
      cleanup: cleanupStep,
    },
  );
}
