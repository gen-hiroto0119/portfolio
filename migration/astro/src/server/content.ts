import 'server-only';
import { createContentReaders } from '@/lib/content/readers';
import { isBlobConfigured, readSnapshot } from '@/lib/publishing/blob';

// Readers belong to one HTTP request. No process or CDN cache can retain a withdrawal.
export function contentForRequest() {
  let snapshot: ReturnType<typeof readSnapshot> | undefined;
  return createContentReaders(async () => {
    if (!isBlobConfigured()) return null;
    snapshot ??= readSnapshot();
    return snapshot;
  });
}
