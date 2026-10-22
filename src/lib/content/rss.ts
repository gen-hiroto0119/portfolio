type RssPostDates = {
  publishedAt: string;
  updatedAt?: string | null;
};

function timestamp(value: string | null | undefined): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function rssLastBuildDate(posts: readonly RssPostDates[]): string | null {
  const timestamps = posts
    .map((post) => timestamp(post.updatedAt) ?? timestamp(post.publishedAt))
    .filter((value): value is number => value !== null);
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toUTCString();
}
