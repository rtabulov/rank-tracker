import {
  COMPANION_MANIFEST_URL,
  defaultMergedCarriers,
  manifestTrayWarnings,
  parseCompanionManifest,
  type CompanionManifestJson,
} from "companion-lifecycle";
import { dispatch } from "./store.ts";

export const COMPANION_VERSION = "0.1.0";
const MANIFEST_REFRESH_MS = 24 * 60 * 60 * 1000;

let refreshTimer: ReturnType<typeof setInterval> | null = null;

export async function fetchCompanionManifest(
  fetchImpl: typeof fetch = fetch,
): Promise<CompanionManifestJson> {
  const response = await fetchImpl(COMPANION_MANIFEST_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`manifest fetch failed: ${response.status}`);
  }
  return (await response.json()) as CompanionManifestJson;
}

export async function syncCompanionManifest(fetchImpl?: typeof fetch): Promise<void> {
  try {
    const json = await fetchCompanionManifest(fetchImpl);
    const parsed = parseCompanionManifest(json);
    const carriers = defaultMergedCarriers(parsed.rsCarriers);
    const warnings = manifestTrayWarnings(parsed, COMPANION_VERSION, false);
    dispatch({
      type: "MANIFEST_UPDATED",
      rsCarriers: carriers,
      manifestStale: false,
      manifestWarnings: warnings,
    });
  } catch {
    const warnings = manifestTrayWarnings(
      { knownBroken: null, minCompanionVersion: null },
      COMPANION_VERSION,
      true,
    );
    dispatch({
      type: "MANIFEST_UPDATED",
      rsCarriers: defaultMergedCarriers(),
      manifestStale: true,
      manifestWarnings: warnings,
    });
  }
}

export function startCompanionManifestRefresh(): void {
  if (refreshTimer != null) {
    return;
  }
  void syncCompanionManifest();
  refreshTimer = setInterval(() => {
    void syncCompanionManifest();
  }, MANIFEST_REFRESH_MS);
}

export function stopCompanionManifestRefresh(): void {
  if (refreshTimer != null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
