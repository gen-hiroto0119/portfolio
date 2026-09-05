"use server";
import { revalidatePath, updateTag } from "next/cache";
import { CmsError } from "@/lib/cms/errors";
import { saveDraft, publishPost, unpublishPost } from "@/lib/cms/posts";
import { prepareMediaUpload, completeMediaUpload, listMedia } from "@/lib/cms/media";

function failure(error: unknown) {
  return { ok: false as const, error: error instanceof CmsError ? error.message : "操作に失敗しました。もう一度お試しください。" };
}
function refreshPublicContent() {
  updateTag("cms-blog");
  revalidatePath("/", "layout");
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");
}
export async function saveDraftAction(input: unknown) {
  try { return { ok: true as const, data: await saveDraft(input) }; }
  catch (error) { return failure(error); }
}
export async function publishPostAction(id: string, revision: number) {
  try {
    const data = await publishPost(id, revision);
    refreshPublicContent();
    return { ok: true as const, data };
  } catch (error) { return failure(error); }
}
export async function unpublishPostAction(id: string) {
  try { const data = await unpublishPost(id); refreshPublicContent(); return { ok: true as const, data }; }
  catch (error) { return failure(error); }
}

export async function prepareMediaAction(input: { name: string; mimeType: string; size: number }) {
  try { return { ok: true as const, data: await prepareMediaUpload(input) }; } catch (error) { return failure(error); }
}
export async function completeMediaAction(input: { id: string; path: string; name: string }) {
  try { return { ok: true as const, data: await completeMediaUpload(input) }; } catch (error) { return failure(error); }
}
export async function loadMediaAction(offset: number) {
  try { return { ok: true as const, data: await listMedia({ offset, limit: 60 }) }; } catch (error) { return failure(error); }
}
