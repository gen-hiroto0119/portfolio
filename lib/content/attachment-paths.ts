import path from "node:path";

export const ATTACHMENTS_URL_PREFIX = "/attachments";

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

export type AttachmentIndex = {
  /** basename → relative path under attachments/ */
  byBasename: Map<string, string>;
  /** relative path → true */
  byRelativePath: Set<string>;
};

export function isImageExtension(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export function getAttachmentMimeType(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXTENSION[ext] ?? null;
}

export function toPosixRelative(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

function normalizeAttachmentRef(ref: string): string {
  return ref.trim().replace(/\\/g, "/").replace(/^\/+/, "");
}

/**
 * Strip leading `attachments/` (or `./attachments/`, `../attachments/`) so
 * refs become paths relative to content/attachments/.
 */
export function stripAttachmentsPrefix(ref: string): string {
  let normalized = normalizeAttachmentRef(ref);

  while (normalized.startsWith("../")) {
    normalized = normalized.slice(3);
  }
  while (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  if (normalized.startsWith("attachments/")) {
    normalized = normalized.slice("attachments/".length);
  }

  return normalized;
}

export function toAttachmentPublicUrl(relativePath: string): string {
  const normalized = toPosixRelative(relativePath).replace(/^\/+/, "");
  return `${ATTACHMENTS_URL_PREFIX}/${normalized}`;
}

/**
 * Resolve an Obsidian-style or relative attachment ref to a public URL.
 * Accepts: `hero.png`, `blog/post/hero.png`, `attachments/hero.png`,
 * `../attachments/hero.png`, `/attachments/hero.png`.
 */
export function resolveAttachmentRef(
  ref: string,
  index: AttachmentIndex,
): string | null {
  const trimmed = ref.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith(`${ATTACHMENTS_URL_PREFIX}/`)) {
    const relative = trimmed.slice(ATTACHMENTS_URL_PREFIX.length + 1);
    return index.byRelativePath.has(relative)
      ? toAttachmentPublicUrl(relative)
      : null;
  }

  const withoutPrefix = stripAttachmentsPrefix(trimmed);
  if (!withoutPrefix || withoutPrefix.includes("..")) {
    return null;
  }

  if (index.byRelativePath.has(withoutPrefix)) {
    return toAttachmentPublicUrl(withoutPrefix);
  }

  const basename = path.posix.basename(withoutPrefix);
  const fromBasename = index.byBasename.get(basename);
  if (fromBasename && !withoutPrefix.includes("/")) {
    return toAttachmentPublicUrl(fromBasename);
  }

  return null;
}

/**
 * Map URL path segments under `/attachments/...` to a path relative to the
 * attachments root. Returns null on traversal or non-image extensions.
 */
export function resolveAttachmentRelativePath(
  urlPathSegments: string[],
): string | null {
  if (urlPathSegments.length === 0) {
    return null;
  }

  if (
    urlPathSegments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    return null;
  }

  const relativePath = urlPathSegments.join("/");
  if (relativePath.includes("\0") || !isImageExtension(relativePath)) {
    return null;
  }

  return relativePath;
}

const WIKI_IMAGE_RE = /!\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Rewrite Obsidian `![[file]]` embeds and relative attachment markdown images
 * into public `/attachments/...` URLs.
 */
export function rewriteContentImages(
  source: string,
  index: AttachmentIndex,
): string {
  let output = source.replace(
    WIKI_IMAGE_RE,
    (raw, target: string, alt?: string) => {
      const resolved = resolveAttachmentRef(target, index);
      if (!resolved) {
        return raw;
      }
      const caption = (
        alt?.trim() || path.posix.basename(target.trim())
      ).replace(/[[\]]/g, "");
      return `![${caption}](${resolved})`;
    },
  );

  output = output.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (raw, alt: string, src: string, title?: string) => {
      const trimmedSrc = src.trim();
      if (/^https?:\/\//i.test(trimmedSrc) || trimmedSrc.startsWith("data:")) {
        return raw;
      }

      const resolved = resolveAttachmentRef(trimmedSrc, index);
      if (!resolved || resolved === trimmedSrc) {
        return raw;
      }

      const titlePart = title ? ` "${title}"` : "";
      return `![${alt}](${resolved}${titlePart})`;
    },
  );

  return output;
}

export function resolveCoverRef(
  cover: string | undefined,
  index: AttachmentIndex,
): string | undefined {
  if (!cover) {
    return undefined;
  }

  const trimmed = cover.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return resolveAttachmentRef(trimmed, index) ?? undefined;
}
