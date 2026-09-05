import { getMediaForRequest } from "@/lib/cms/media";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await getMediaForRequest(id);
  if (!media) return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return new Response(null, { status: 307, headers: { Location: media.signedUrl, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
