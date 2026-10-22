import type { z } from "zod";
import type { assetSchema } from "./schema";

export type PublishedAsset = z.infer<typeof assetSchema>;

export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;
export const MEDIA_CHUNK_BYTES = 64 * 1024;
