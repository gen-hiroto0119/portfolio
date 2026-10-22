import { readSnapshot } from "@/storage";
import type { PublishedAsset } from "./domain";

export { getMedia as readMedia } from "@/storage";

export async function findPublishedAsset(assetId: string) {
  const { snapshot } = await readSnapshot();
  return snapshot.posts
    .flatMap((post) => post.assets)
    .find((asset) => asset.id === assetId);
}

export async function isAssetPublished(asset: PublishedAsset) {
  return (await readSnapshot()).snapshot.posts.some((post) =>
    post.assets.some(
      (item) =>
        item.id === asset.id &&
        item.pathname === asset.pathname &&
        item.contentType === asset.contentType,
    ),
  );
}
