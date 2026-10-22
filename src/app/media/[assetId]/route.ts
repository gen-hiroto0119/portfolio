import { getMedia, readSnapshot } from "@/lib/publishing/blob";
import { createMediaHandler } from "@/lib/publishing/media-handler";

export const GET = createMediaHandler(readSnapshot, getMedia);
