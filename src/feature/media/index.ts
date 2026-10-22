import { Hono } from "hono";
import { assetSchema } from "./schema";
import { readPublishedMedia } from "./service";

const media = new Hono().get("/:assetId", async (c) => {
  const id = assetSchema.shape.id.safeParse(c.req.param("assetId"));
  if (!id.success) return c.text("Not Found", 404);
  try {
    const result = await readPublishedMedia(id.data, c.req.raw.signal);
    if (!result) return c.text("Not Found", 404);
    return new Response(result.stream, {
      headers: {
        "Content-Type": result.asset.contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return c.text("Media unavailable", 503);
  }
});

export default media;
