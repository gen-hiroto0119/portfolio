import "server-only";

import { del, get, put, BlobPreconditionFailedError, BlobNotFoundError } from "@vercel/blob";
import { randomUUID } from "node:crypto";

import { ConcurrentPublicationError, PublicationError, type PublishedAsset, snapshotSchema, type Snapshot, type SnapshotRead } from "./model";

export const SNAPSHOT_PATH = "blog/snapshot.json";
const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;

export class BlobConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlobConfigurationError";
  }
}

function configured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
}

export function isBlobConfigured() {
  return configured();
}

function emptySnapshot(): Snapshot {
  return { version: 1, generation: randomUUID(), posts: [], garbage: [] };
}

export async function readSnapshotWith(getBlob: typeof get): Promise<SnapshotRead> {
  if (!configured()) throw new BlobConfigurationError("公開スナップショットの保存先が設定されていません。");
  try {
    const result = await getBlob(SNAPSHOT_PATH, { access: "private", useCache: false });
    if (!result) return { snapshot: emptySnapshot(), etag: null };
    if (result.statusCode !== 200) throw new Error("Snapshot was not returned.");
    if (result.blob.size > MAX_SNAPSHOT_BYTES) throw new PublicationError("公開スナップショットが大きすぎます。");
    let raw: unknown;
    try { raw = await new Response(result.stream).json(); }
    catch { throw new PublicationError("公開スナップショットの形式が不正です。"); }
    try {
      return { snapshot: snapshotSchema.parse(raw), etag: result.blob.etag };
    } catch {
      throw new PublicationError("公開スナップショットの形式が不正です。");
    }
  } catch (error) {
    if (error instanceof BlobNotFoundError) return { snapshot: emptySnapshot(), etag: null };
    throw error;
  }
}

export async function readSnapshot(): Promise<SnapshotRead> {
  return readSnapshotWith(get);
}

export async function writeSnapshotWith(putBlob: typeof put, snapshot: Snapshot, etag: string | null): Promise<void> {
  if (!configured()) throw new BlobConfigurationError("公開スナップショットの保存先が設定されていません。");
  const checked = snapshotSchema.parse(snapshot);
  const body = JSON.stringify(checked);
  if (Buffer.byteLength(body) > MAX_SNAPSHOT_BYTES) throw new PublicationError("公開スナップショットが大きすぎます。");
  try {
    await putBlob(SNAPSHOT_PATH, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: etag !== null,
      ...(etag ? { ifMatch: etag } : {}),
      contentType: "application/json; charset=utf-8",
      cacheControlMaxAge: 60,
    });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || (error instanceof Error && /precondition|already exists|conflict/i.test(error.message))) {
      throw new ConcurrentPublicationError("公開スナップショットが別の処理で更新されました。");
    }
    throw error;
  }
}

export async function writeSnapshot(snapshot: Snapshot, etag: string | null): Promise<void> {
  return writeSnapshotWith(put, snapshot, etag);
}

export async function uploadAsset(data: Uint8Array, contentType: PublishedAsset["contentType"]): Promise<PublishedAsset> {
  if (!configured()) throw new BlobConfigurationError("公開スナップショットの保存先が設定されていません。");
  const id = randomUUID();
  const pathname = `blog/assets/${id}`;
  await put(pathname, Buffer.from(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType,
    cacheControlMaxAge: 31536000,
  });
  return { id, pathname, contentType };
}

export async function removeAssets(assets: PublishedAsset[]): Promise<void> {
  if (!assets.length) return;
  if (!configured()) throw new BlobConfigurationError("公開スナップショットの保存先が設定されていません。");
  await del(assets.map((asset) => asset.pathname));
}

export async function getMedia(asset: PublishedAsset) {
  if (!configured()) throw new BlobConfigurationError("公開スナップショットの保存先が設定されていません。");
  return get(asset.pathname, { access: "private", useCache: false });
}

export async function storeWebhookVerificationWith(
  token: string,
  putBlob: typeof put = put,
  createdAt = new Date().toISOString(),
  getBlob: typeof get = get,
): Promise<void> {
  if (!configured()) throw new BlobConfigurationError("公開スナップショットの保存先が設定されていません。");
  const pathname = "blog/setup/webhook-verification.json";
  const readCandidate = async () => {
    try {
      const result = await getBlob(pathname, { access: "private", useCache: false });
      if (!result) return null;
      if (result.statusCode !== 200 || result.blob.size > 4096) throw new Error("Invalid webhook verification candidate.");
      const value = await new Response(result.stream).json() as { token?: unknown };
      if (typeof value.token !== "string") throw new Error("Invalid webhook verification candidate.");
      return value.token;
    } catch (error) {
      if (error instanceof BlobNotFoundError) return null;
      throw error;
    }
  };
  const existing = await readCandidate();
  if (existing !== null) {
    if (existing === token) return;
    throw new WebhookVerificationConflictError();
  }
  try {
    await putBlob(pathname, JSON.stringify({ token, createdAt }), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
  } catch (error) {
    if (!(error instanceof BlobPreconditionFailedError || (error instanceof Error && /precondition|already exists|conflict/i.test(error.message)))) throw error;
    if (await readCandidate() === token) return;
    throw new WebhookVerificationConflictError();
  }
}

export class WebhookVerificationConflictError extends Error {
  constructor() {
    super("A different webhook verification token is already stored.");
    this.name = "WebhookVerificationConflictError";
  }
}
