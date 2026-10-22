import { MAX_MEDIA_BYTES, MEDIA_CHUNK_BYTES } from "./domain";
import { findPublishedAsset, isAssetPublished, readMedia } from "./repository";

function authorizedStream(
  source: ReadableStream<Uint8Array>,
  isPublished: () => Promise<boolean>,
  signal: AbortSignal,
) {
  const reader = source.getReader();
  let stopped = false;
  let pending: Uint8Array = new Uint8Array();
  let offset = 0;
  let total = 0;
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const stop = async (reason?: unknown) => {
    if (stopped) return;
    stopped = true;
    pending = new Uint8Array();
    signal.removeEventListener("abort", abort);
    await reader.cancel(reason).catch(() => {});
    reader.releaseLock();
  };
  const abort = () => {
    if (stopped) return;
    controller.error(new Error("Media request aborted."));
    void stop();
  };
  return new ReadableStream<Uint8Array>(
    {
      start(value) {
        controller = value;
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
      },
      async pull() {
        try {
          if (offset === pending.byteLength) {
            const next = await reader.read();
            if (stopped) return;
            if (next.done) {
              stopped = true;
              signal.removeEventListener("abort", abort);
              reader.releaseLock();
              controller.close();
              return;
            }
            total += next.value.byteLength;
            if (total > MAX_MEDIA_BYTES)
              throw new Error("Media size exceeded.");
            pending = next.value;
            offset = 0;
          }
          const published = await isPublished();
          if (stopped) return;
          if (!published) throw new Error("Media is no longer published.");
          const end = Math.min(offset + MEDIA_CHUNK_BYTES, pending.byteLength);
          controller.enqueue(pending.slice(offset, end));
          offset = end;
        } catch {
          if (!stopped) {
            controller.error(new Error("Media unavailable."));
            await stop();
          }
        }
      },
      cancel: stop,
    },
    { highWaterMark: 0 },
  );
}

export async function readPublishedMedia(assetId: string, signal: AbortSignal) {
  let source: ReadableStream<Uint8Array> | null = null;
  try {
    const asset = await findPublishedAsset(assetId);
    if (!asset) return null;
    const result = await readMedia(asset);
    source = result?.stream ?? null;
    if (
      !result ||
      result.statusCode !== 200 ||
      result.blob.size === null ||
      result.blob.size > MAX_MEDIA_BYTES ||
      !source
    ) {
      throw new Error("Media unavailable.");
    }
    const isPublished = () => isAssetPublished(asset);
    if (!(await isPublished())) {
      await source.cancel().catch(() => {});
      return null;
    }
    return { asset, stream: authorizedStream(source, isPublished, signal) };
  } catch (error) {
    await source?.cancel().catch(() => {});
    throw error;
  }
}
