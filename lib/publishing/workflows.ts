import { FatalError, RetryableError, getStepMetadata } from "workflow";

import { cleanRetiredAssets, syncPage } from "./sync";
import { ConcurrentPublicationError, PublicationError } from "./model";
import { BlobConfigurationError, readSnapshot } from "./blob";
import { publishingPorts } from "./ports";
import { queryPages } from "./notion";

function delay() {
  return Math.min(30_000, 10_000 * Math.max(1, getStepMetadata().attempt));
}

async function syncPageStep(id: string) {
  "use step";
  try {
    const result = await syncPage(id, publishingPorts());
    console.info("blog sync page", { id, action: result.action });
    return { ok: true as const, action: result.action };
  } catch (error) {
    if (error instanceof FatalError) throw error;
    if (error instanceof PublicationError || (error instanceof Error && ["ZodError", "CmsError", "BlobConfigurationError"].includes(error.name))) {
      throw new FatalError(error instanceof PublicationError ? error.message : "Notion の公開データ形式を確認してください。");
    }
    if (error instanceof ConcurrentPublicationError) throw new RetryableError("公開スナップショットが競合しました。", { retryAfter: delay() });
    throw new RetryableError("記事同期を再試行します。", { retryAfter: delay() });
  }
}
syncPageStep.maxRetries = 5;

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
  sync: (id: string) => Promise<unknown>,
  cleanup: () => Promise<void>,
) {
  const failures: string[] = [];
  for (const id of ids) {
    try {
      await sync(id);
    } catch {
      failures.push(id);
    }
  }
  await cleanup();
  if (failures.length) throw new FatalError(`記事同期に失敗しました (${failures.length}件)。`);
  return { count: ids.length };
}

export async function reconcileBlogWorkflow(targetPageId?: string) {
  "use workflow";
  const ids = targetPageId ? [targetPageId] : await reconcileIdsStep();
  return reconcilePagesAndCleanup(ids, syncPageStep, cleanupStep);
}
