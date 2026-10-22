import { z } from "zod";

export const uuid = z.uuid().transform((id) => id.toLowerCase());
export const assetSchema = z.object({
  id: uuid,
  pathname: z.string().regex(/^blog\/assets\/[0-9a-f-]{36}$/),
  contentType: z.enum(["image/png", "image/jpeg", "image/gif", "image/webp"]),
});
