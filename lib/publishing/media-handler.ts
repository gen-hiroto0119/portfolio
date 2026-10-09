import type { PublishedAsset, SnapshotRead } from "./model";
import { assetSchema } from "./model";

type MediaResult = {
  statusCode: number;
  blob: { size: number | null };
  stream: ReadableStream<Uint8Array> | null;
};

type ReadSnapshot = () => Promise<SnapshotRead>;
type ReadMedia = (asset: PublishedAsset) => Promise<MediaResult | null>;

export function createMediaHandler(readSnapshot: ReadSnapshot, readMedia: ReadMedia) {
  return async function GET(_request: Request, context: { params: Promise<{ assetId: string }> }) {
    const { assetId } = await context.params;
    const parsed = assetSchema.shape.id.safeParse(assetId);
    if (!parsed.success) return new Response("Not Found", { status: 404 });
    try {
      const { snapshot } = await readSnapshot();
      const asset = snapshot.posts.flatMap((post) => post.assets).find((item) => item.id === parsed.data);
      if (!asset) return new Response("Not Found", { status: 404 });
      const result = await readMedia(asset);
      if (!result || result.statusCode !== 200 || result.blob.size === null ||
          result.blob.size > 4 * 1024 * 1024 || !result.stream) {
        return new Response("Media unavailable", { status: 503 });
      }
      const latest = await readSnapshot();
      if (!latest.snapshot.posts.some((post) => post.assets.some((item) => item.id === asset.id))) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response(result.stream, {
        headers: {
          "Content-Type": asset.contentType,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return new Response("Media unavailable", { status: 503 });
    }
  };
}
