import "server-only";

import type { PublishedAsset, SnapshotRead } from "./model";
import { assetSchema } from "./model";

type MediaResult = {
  statusCode: number;
  blob: { size: number | null };
  stream: ReadableStream<Uint8Array> | null;
};

type ReadSnapshot = () => Promise<SnapshotRead>;
type ReadMedia = (asset: PublishedAsset) => Promise<MediaResult | null>;

const MAX_MEDIA_BYTES = 4 * 1024 * 1024;
const CHUNK_BYTES = 64 * 1024;

function authorizedStream(source: ReadableStream<Uint8Array>, isPublished: () => Promise<boolean>, signal: AbortSignal) {
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
  return new ReadableStream<Uint8Array>({
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
          if (total > MAX_MEDIA_BYTES) throw new Error("Media size exceeded.");
          pending = next.value;
          offset = 0;
        }
        const published = await isPublished();
        if (stopped) return;
        if (!published) throw new Error("Media is no longer published.");
        const end = Math.min(offset + CHUNK_BYTES, pending.byteLength);
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
  }, { highWaterMark: 0 });
}

export function createMediaHandler(readSnapshot: ReadSnapshot, readMedia: ReadMedia) {
  return async function GET(request: Request, context: { params: Promise<{ assetId: string }> }) {
    const { assetId } = await context.params;
    const parsed = assetSchema.shape.id.safeParse(assetId);
    if (!parsed.success) return new Response("Not Found", { status: 404 });
    let source: ReadableStream<Uint8Array> | null = null;
    try {
      const { snapshot } = await readSnapshot();
      const asset = snapshot.posts.flatMap((post) => post.assets).find((item) => item.id === parsed.data);
      if (!asset) return new Response("Not Found", { status: 404 });
      const result = await readMedia(asset);
      source = result?.stream ?? null;
      if (!result || result.statusCode !== 200 || result.blob.size === null ||
          result.blob.size > MAX_MEDIA_BYTES || !source) {
        await source?.cancel().catch(() => {});
        return new Response("Media unavailable", { status: 503 });
      }
      const isPublished = async () => (await readSnapshot()).snapshot.posts.some((post) =>
        post.assets.some((item) => item.id === asset.id && item.pathname === asset.pathname && item.contentType === asset.contentType));
      if (!await isPublished()) {
        await source.cancel().catch(() => {});
        return new Response("Not Found", { status: 404 });
      }
      return new Response(authorizedStream(source, isPublished, request.signal), {
        headers: {
          "Content-Type": asset.contentType,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      await source?.cancel().catch(() => {});
      return new Response("Media unavailable", { status: 503 });
    }
  };
}
