import "server-only";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { requireOwner } from "@/lib/cms/auth";
import { mediaPath } from "@/lib/cms/document";
import { CmsError, databaseError } from "@/lib/cms/errors";
import type { MediaAssetRow } from "@/lib/supabase/database.types";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const MEDIA_BUCKET = "portfolio-media";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export type MediaAsset = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  createdAt: string;
  src: string;
  previewUrl: string;
};
export type MediaUrl = { id: string; signedUrl: string; mimeType: string };
export type PreparedMediaUpload = { id: string; path: string; token: string; signedUrl: string; bucket: string };
const MIME_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" } as const;
const imageDetailsSchema = z.object({
  alt: z.string().max(1_000).default(""),
  width: z.number().int().min(1).max(50_000).optional(),
  height: z.number().int().min(1).max(50_000).optional(),
});

function mediaAsset(row: MediaAssetRow, previewUrl: string): MediaAsset {
  return {
    id: row.id, filename: row.filename, mimeType: row.mime_type, sizeBytes: row.size_bytes,
    width: row.width, height: row.height, alt: row.alt, createdAt: row.created_at,
    src: mediaPath(row.id), previewUrl,
  };
}

export async function listMedia(options: { limit?: number; offset?: number } = {}): Promise<MediaAsset[]> {
  const { supabase, user } = await requireOwner();
  const limit = Math.min(100, Math.max(1, Math.trunc(options.limit ?? 60)));
  const offset = Math.max(0, Math.trunc(options.offset ?? 0));
  const { data, error } = await supabase.from("media_assets").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw databaseError(error);
  if (!data.length) return [];
  const signed = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(data.map((asset) => asset.storage_path), 3_600);
  if (signed.error) throw new CmsError("DATABASE", "画像を読み込めませんでした。");
  const urls = new Map(signed.data.map((asset) => [asset.path, asset.signedUrl]));
  return data.map((asset) => mediaAsset(asset, urls.get(asset.storage_path) || mediaPath(asset.id)));
}

function imageType(bytes: Uint8Array): { mime: string; extension: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", extension: "jpg" };
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)) return { mime: "image/png", extension: "png" };
  const prefix = new TextDecoder("ascii").decode(bytes.slice(0, 12));
  if (prefix.startsWith("GIF87a") || prefix.startsWith("GIF89a")) return { mime: "image/gif", extension: "gif" };
  if (prefix.startsWith("RIFF") && prefix.slice(8, 12) === "WEBP") return { mime: "image/webp", extension: "webp" };
  return null;
}

export async function prepareMediaUpload(input: { name: string; mimeType: string; size: number }): Promise<PreparedMediaUpload> {
  const { supabase, user } = await requireOwner();
  const parsed = z.object({
    name: z.string().trim().min(1).max(255),
    mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
    size: z.number().int().min(1).max(MAX_IMAGE_BYTES),
  }).safeParse(input);
  if (!parsed.success) throw new CmsError("VALIDATION", "10 MB 以下の JPEG・PNG・GIF・WebP 画像を選択してください。");
  const id = randomUUID();
  const path = `${user.id}/${id}.${MIME_EXTENSIONS[parsed.data.mimeType]}`;
  const signed = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path, { upsert: false });
  if (signed.error) throw new CmsError("DATABASE", "画像のアップロードを準備できませんでした。");
  return { id, path, token: signed.data.token, signedUrl: signed.data.signedUrl, bucket: MEDIA_BUCKET };
}

export async function completeMediaUpload(input: { id: string; path: string; name: string; alt?: string; width?: number; height?: number }): Promise<MediaAsset> {
  const { supabase, user } = await requireOwner();
  const parsed = imageDetailsSchema.extend({ id: z.uuid(), path: z.string(), name: z.string().trim().min(1).max(255) }).safeParse(input);
  if (!parsed.success) throw new CmsError("VALIDATION", "画像の情報が正しくありません。");
  const { id, path, name, ...details } = parsed.data;
  if (!Object.values(MIME_EXTENSIONS).some((extension) => path === `${user.id}/${id}.${extension}`)) {
    throw new CmsError("VALIDATION", "画像の保存先が正しくありません。");
  }
  const existing = await supabase.from("media_assets").select("*").eq("id", id).maybeSingle();
  if (existing.error) throw databaseError(existing.error);
  if (existing.data) {
    if (existing.data.owner_id !== user.id || existing.data.storage_path !== path) throw new CmsError("FORBIDDEN", "この画像は保存できません。");
    const signed = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 3_600);
    return mediaAsset(existing.data, signed.data?.signedUrl ?? mediaPath(id));
  }
  // Download directly from Storage on the server; the browser request only carries metadata.
  const downloaded = await supabase.storage.from(MEDIA_BUCKET).download(path);
  if (downloaded.error) throw new CmsError("DATABASE", "アップロードした画像を確認できませんでした。もう一度お試しください。");
  const file = downloaded.data;
  const type = file.size > 0 && file.size <= MAX_IMAGE_BYTES ? imageType(new Uint8Array(await file.arrayBuffer())) : null;
  if (!type || !path.endsWith(`.${type.extension}`) || file.type.split(";")[0] !== type.mime) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    throw new CmsError("VALIDATION", "画像の形式または容量が正しくありません。10 MB 以下の JPEG・PNG・GIF・WebP を選択してください。");
  }
  const inserted = await supabase.from("media_assets").insert({
    id, owner_id: user.id, storage_path: path, filename: name, mime_type: type.mime, size_bytes: file.size,
    width: details.width ?? null, height: details.height ?? null, alt: details.alt,
  }).select("*").single();
  if (inserted.error) {
    // Keep the object for a safe retry, including concurrent completion requests.
    if (inserted.error.code === "23505") {
      const retry = await supabase.from("media_assets").select("*").eq("id", id).eq("owner_id", user.id).eq("storage_path", path).maybeSingle();
      if (retry.data) {
        const signed = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 3_600);
        return mediaAsset(retry.data, signed.data?.signedUrl ?? mediaPath(id));
      }
    }
    throw databaseError(inserted.error);
  }
  const signed = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 3_600);
  return mediaAsset(inserted.data, signed.data?.signedUrl ?? mediaPath(id));
}

export async function uploadMedia(file: File, input: { alt?: string; width?: number; height?: number } = {}): Promise<MediaAsset> {
  const { supabase, user } = await requireOwner();
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new CmsError("VALIDATION", "画像は 10 MB 以下のファイルを選択してください。");
  }
  const parsed = z.object({
    alt: z.string().max(1_000).default(""),
    width: z.number().int().min(1).max(50_000).optional(),
    height: z.number().int().min(1).max(50_000).optional(),
  }).safeParse(input);
  if (!parsed.success) throw new CmsError("VALIDATION", "画像の情報が正しくありません。");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) throw new CmsError("VALIDATION", "JPEG・PNG・GIF・WebP の画像を選択してください。");
  const id = randomUUID();
  const storagePath = `${user.id}/${id}.${type.extension}`;
  const uploaded = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, bytes, { contentType: type.mime, cacheControl: "3600", upsert: false });
  if (uploaded.error) throw new CmsError("DATABASE", "画像のアップロードに失敗しました。もう一度お試しください。");

  const inserted = await supabase.from("media_assets").insert({
    id, owner_id: user.id, storage_path: storagePath, filename: file.name.slice(0, 255) || `${id}.${type.extension}`,
    mime_type: type.mime, size_bytes: file.size, width: parsed.data.width ?? null, height: parsed.data.height ?? null, alt: parsed.data.alt,
  }).select("*").single();
  if (inserted.error) {
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    throw databaseError(inserted.error);
  }
  const signed = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(storagePath, 3_600);
  // A URL failure does not discard an upload which has already been saved.
  return mediaAsset(inserted.data, signed.data?.signedUrl ?? mediaPath(id));
}

export async function getPublicMedia(id: string): Promise<MediaUrl | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("media_assets").select("id,storage_path,mime_type").eq("id", id).maybeSingle();
  if (error) throw databaseError(error);
  if (!data) return null;
  const signed = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(data.storage_path, 60);
  if (signed.error) throw new CmsError("DATABASE", "画像を読み込めませんでした。");
  return { id: data.id, signedUrl: signed.data.signedUrl, mimeType: data.mime_type };
}

// Use in GET /media/[id]. Owners can preview draft images with their auth cookie;
// anonymous visitors can only resolve images referenced by a publication.
export async function getMediaForRequest(id: string): Promise<MediaUrl | null> {
  if (!z.uuid().safeParse(id).success) return null;
  try {
    const { supabase } = await requireOwner();
    const { data, error } = await supabase.from("media_assets").select("id,storage_path,mime_type").eq("id", id).maybeSingle();
    if (error) throw databaseError(error);
    if (!data) return null;
    const signed = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(data.storage_path, 60);
    if (signed.error) throw new CmsError("DATABASE", "画像を読み込めませんでした。");
    return { id: data.id, signedUrl: signed.data.signedUrl, mimeType: data.mime_type };
  } catch (error) {
    if (error instanceof CmsError && ["UNAUTHENTICATED", "FORBIDDEN"].includes(error.code)) return getPublicMedia(id);
    throw error;
  }
}
