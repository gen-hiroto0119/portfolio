import type { APIRoute } from 'astro';
import { getMedia, readSnapshot } from '@/lib/publishing/blob';
import { createMediaHandler } from '@/lib/publishing/media-handler';
const handler = createMediaHandler(readSnapshot, getMedia);
export const GET: APIRoute = ({ request, params }) => handler(request, { params: Promise.resolve({ assetId: params.assetId ?? '' }) });
