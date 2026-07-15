import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import {
  isImageExtension,
  resolveAttachmentRelativePath,
  resolveCoverRef,
  rewriteContentImages,
  toPosixRelative,
  type AttachmentIndex,
} from "@/lib/content/attachment-paths";

export {
  ATTACHMENTS_URL_PREFIX,
  getAttachmentMimeType,
  resolveAttachmentRef,
  rewriteContentImages,
  toAttachmentPublicUrl,
  type AttachmentIndex,
} from "@/lib/content/attachment-paths";

export const ATTACHMENTS_DIR = path.join(
  process.cwd(),
  "content",
  "attachments",
);

export async function buildAttachmentIndex(): Promise<AttachmentIndex> {
  const byBasename = new Map<string, string>();
  const byRelativePath = new Set<string>();

  async function walk(directory: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }
      throw error;
    }

    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }
      if (!entry.isFile() || !isImageExtension(entry.name)) {
        continue;
      }

      const relativePath = toPosixRelative(
        path.relative(ATTACHMENTS_DIR, absolutePath),
      );
      byRelativePath.add(relativePath);

      const basename = entry.name;
      const existing = byBasename.get(basename);
      if (existing && existing !== relativePath) {
        throw new Error(
          `Duplicate attachment basename "${basename}": ${existing} and ${relativePath}. Use distinct filenames or full relative paths in embeds.`,
        );
      }
      byBasename.set(basename, relativePath);
    }
  }

  await walk(ATTACHMENTS_DIR);
  return { byBasename, byRelativePath };
}

let attachmentIndexPromise: Promise<AttachmentIndex> | null = null;

export function getAttachmentIndex(): Promise<AttachmentIndex> {
  if (!attachmentIndexPromise) {
    attachmentIndexPromise = buildAttachmentIndex();
  }
  return attachmentIndexPromise;
}

/** Test helper — clears the module-level index cache. */
export function resetAttachmentIndexCache(): void {
  attachmentIndexPromise = null;
}

/**
 * Map a public `/attachments/...` URL path to an absolute filesystem path.
 * Returns null on missing files or path traversal.
 */
export function resolveAttachmentFsPath(
  urlPathSegments: string[],
): string | null {
  const relativePath = resolveAttachmentRelativePath(urlPathSegments);
  if (!relativePath) {
    return null;
  }

  const candidate = path.resolve(ATTACHMENTS_DIR, relativePath);
  const root = path.resolve(ATTACHMENTS_DIR);
  const relative = path.relative(root, candidate);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return candidate;
}

export async function prepareContentImages(source: string): Promise<string> {
  const index = await getAttachmentIndex();
  return rewriteContentImages(source, index);
}

export async function resolveCoverImageUrl(
  cover: string | undefined,
): Promise<string | undefined> {
  const index = await getAttachmentIndex();
  return resolveCoverRef(cover, index);
}
