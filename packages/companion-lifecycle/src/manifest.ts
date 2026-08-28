import { EMBEDDED_DEFAULT_CARRIER, type RsCarrier } from "./rs-carrier.ts";

export const COMPANION_MANIFEST_URL = "https://rank.rtabulov.dev/companion-manifest.json";
export const COMPANION_KNOWN_ISSUES_URL = "https://github.com/rtabulov/rank-tracker/releases";

export type KnownBroken = {
  gamePatch: string;
  message: string;
};

export type CompanionManifestMeta = {
  knownBroken: KnownBroken | null;
  minCompanionVersion: string | null;
};

export type CompanionManifest = CompanionManifestMeta & {
  rsCarriers: RsCarrier[];
};

export type CompanionManifestJson = {
  rs_carriers?: RemoteRsCarrierJson[];
  known_broken?: { game_patch?: string; message?: string } | null;
  min_companion_version?: string | null;
};

export type RemoteRsCarrierJson = {
  id: string;
  priority: number;
  host_pattern: string;
  method: "POST" | "GET";
  path_contains: string;
  field: string;
  field_aliases?: string[];
  required_siblings: string[];
  enabled: boolean;
};

export function parseRemoteCarrier(json: RemoteRsCarrierJson): RsCarrier {
  return {
    id: json.id,
    priority: json.priority,
    hostPattern: json.host_pattern,
    method: json.method,
    pathContains: json.path_contains,
    field: json.field,
    fieldAliases: json.field_aliases,
    requiredSiblings: json.required_siblings,
    enabled: json.enabled,
  };
}

export function parseCompanionManifest(json: CompanionManifestJson): CompanionManifest {
  const rsCarriers = (json.rs_carriers ?? []).map(parseRemoteCarrier);
  const knownBroken =
    json.known_broken?.message != null && json.known_broken.message.length > 0
      ? {
          gamePatch: json.known_broken.game_patch ?? "",
          message: json.known_broken.message,
        }
      : null;
  return {
    rsCarriers,
    knownBroken,
    minCompanionVersion: json.min_companion_version ?? null,
  };
}

/** Remote carriers merge by id; remote wins on conflict. */
export function mergeRsCarriers(
  embedded: readonly RsCarrier[],
  remote: readonly RsCarrier[],
): RsCarrier[] {
  const byId = new Map<string, RsCarrier>();
  for (const carrier of embedded) {
    byId.set(carrier.id, carrier);
  }
  for (const carrier of remote) {
    byId.set(carrier.id, carrier);
  }
  return [...byId.values()];
}

export function compareSemver(a: string, b: string): number {
  const partsA = a.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const partsB = b.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}

export function manifestTrayWarnings(
  meta: CompanionManifestMeta,
  companionVersion: string,
  manifestStale: boolean,
): string[] {
  const warnings: string[] = [];
  if (manifestStale) {
    warnings.push("Manifest offline — using embedded carriers");
  }
  if (meta.knownBroken) {
    warnings.push(meta.knownBroken.message);
  }
  if (meta.minCompanionVersion && compareSemver(companionVersion, meta.minCompanionVersion) < 0) {
    warnings.push(`Companion ${companionVersion} is below minimum ${meta.minCompanionVersion}`);
  }
  return warnings;
}

export function defaultMergedCarriers(remote: readonly RsCarrier[] = []): RsCarrier[] {
  return mergeRsCarriers([EMBEDDED_DEFAULT_CARRIER], remote);
}
