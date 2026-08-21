type WikiContentKind = "blog" | "idea";

export type NoteIndex = {
  /** Unique slug → collection. Ambiguous slugs (in both collections) are omitted. */
  bySlug: Map<string, WikiContentKind>;
  blogSlugs: Set<string>;
  ideaSlugs: Set<string>;
};

export function buildNoteIndex(
  blogSlugs: readonly string[],
  ideaSlugs: readonly string[],
): NoteIndex {
  const blogSet = new Set(blogSlugs);
  const ideaSet = new Set(ideaSlugs);
  const bySlug = new Map<string, WikiContentKind>();

  for (const slug of blogSet) {
    if (!ideaSet.has(slug)) {
      bySlug.set(slug, "blog");
    }
  }

  for (const slug of ideaSet) {
    if (!blogSet.has(slug)) {
      bySlug.set(slug, "idea");
    }
  }

  return { bySlug, blogSlugs: blogSet, ideaSlugs: ideaSet };
}

function hrefForKind(kind: WikiContentKind, slug: string): string {
  switch (kind) {
    case "blog":
      return `/blog/${slug}`;
    case "idea":
      return `/idea/${slug}`;
    default: {
      const exhaustive: never = kind;
      throw new Error(`Unknown content kind: ${exhaustive}`);
    }
  }
}

function parseWikiTarget(
  target: string,
): { kind?: WikiContentKind; slug: string } | null {
  let normalized = target.trim().replace(/\\/g, "/");

  while (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  normalized = normalized.replace(/\.(mdx|md)$/i, "");

  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.includes("\0")
  ) {
    return null;
  }

  const segments = normalized.split("/").filter((segment) => segment.length > 0);
  const [first, second] = segments;

  if (segments.length === 1 && first) {
    return { slug: first };
  }

  if (
    segments.length === 2 &&
    (first === "blog" || first === "idea") &&
    second
  ) {
    return { kind: first, slug: second };
  }

  return null;
}

/**
 * Resolve an Obsidian WikiLink target to a public content URL.
 * Accepts `slug`, `blog/slug`, `idea/slug` (optional `.md` / `.mdx`).
 */
export function resolveWikiLink(
  target: string,
  index: NoteIndex,
): string | null {
  const parsed = parseWikiTarget(target);
  if (!parsed) {
    return null;
  }

  const { kind, slug } = parsed;

  if (kind) {
    switch (kind) {
      case "blog":
        return index.blogSlugs.has(slug) ? hrefForKind(kind, slug) : null;
      case "idea":
        return index.ideaSlugs.has(slug) ? hrefForKind(kind, slug) : null;
      default: {
        const exhaustive: never = kind;
        throw new Error(`Unknown content kind: ${exhaustive}`);
      }
    }
  }

  const inferred = index.bySlug.get(slug);
  if (!inferred) {
    return null;
  }

  return hrefForKind(inferred, slug);
}

function displayLabel(target: string, label?: string): string {
  const explicit = label?.trim();
  if (explicit) {
    return explicit.replace(/[[\]]/g, "");
  }

  const parsed = parseWikiTarget(target);
  const fallback = parsed?.slug ?? target.trim();
  return fallback.replace(/[[\]]/g, "");
}

const WIKI_LINK_RE =
  /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;

/**
 * Rewrite Obsidian `[[note]]` / `[[note|label]]` to markdown links.
 * Unknown or ambiguous notes are left as the raw wiki syntax (same as
 * unresolved `![[image]]` embeds). Image embeds (`![[file]]`) are skipped.
 */
export function rewriteWikiLinks(source: string, index: NoteIndex): string {
  return source.replace(
    WIKI_LINK_RE,
    (raw, target: string, label: string | undefined, offset: number) => {
      if (offset > 0 && source[offset - 1] === "!") {
        return raw;
      }

      const href = resolveWikiLink(target, index);
      if (!href) {
        return raw;
      }

      return `[${displayLabel(target, label)}](${href})`;
    },
  );
}
