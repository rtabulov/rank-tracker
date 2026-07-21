import type { PublicSeasonIndex } from "@/lib/public-season";

const INDEX_STALE_MS = 5 * 60 * 1000;

const publicIndexCache = new Map<string, { at: number; value: PublicSeasonIndex }>();

export function clearPublicSeasonIndexCache() {
  publicIndexCache.clear();
}

export async function loadPublicSeasonIndex(
  getIndex: (displayName: string) => Promise<PublicSeasonIndex | null>,
  displayName: string,
): Promise<PublicSeasonIndex | null> {
  const key = displayName.toLowerCase();
  const cacheEnabled = import.meta.env.MODE !== "test";
  if (cacheEnabled) {
    const hit = publicIndexCache.get(key);
    if (hit !== undefined && Date.now() - hit.at < INDEX_STALE_MS) {
      return hit.value;
    }
  }

  const index = await getIndex(displayName);
  if (index === null) {
    publicIndexCache.delete(key);
    return null;
  }

  if (cacheEnabled) {
    publicIndexCache.set(key, { at: Date.now(), value: index });
  }
  return index;
}
