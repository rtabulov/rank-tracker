import { hostMatchesPattern } from "./rs-carrier.ts";

export const DEFAULT_RS_FIELD_ALIASES = ["rankScore", "rankPoints", "RankScore"] as const;

const DEFAULT_REQUIRED_SIBLINGS = ["leagueRankIndex", "highestLeagueRankIndex"] as const;

const ES_DIS_HOST_PATTERN = "*.es-dis.net";

export type BodyScanInput = {
  host: string;
  body: unknown;
  extraFieldAliases?: readonly string[];
};

export type BodyScanOk = {
  ok: true;
  rs: number;
  field: string;
};

export type BodyScanFail = {
  ok: false;
  reason: "host_not_eligible" | "invalid_body" | "missing_siblings" | "invalid_rank_score";
};

export type BodyScanResult = BodyScanOk | BodyScanFail;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasAnySibling(body: Record<string, unknown>, siblings: readonly string[]): boolean {
  return siblings.some((key) => key in body);
}

function readIntegerField(body: Record<string, unknown>, field: string): number | null {
  const value = body[field];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }
  return value;
}

/**
 * Hunt alias RS fields on decrypted JSON bodies for `*.es-dis.net` hosts.
 * Sibling validation is required before accepting a value.
 */
export function bodyScanForRs(input: BodyScanInput): BodyScanResult {
  if (!hostMatchesPattern(input.host, ES_DIS_HOST_PATTERN)) {
    return { ok: false, reason: "host_not_eligible" };
  }
  if (!isPlainObject(input.body)) {
    return { ok: false, reason: "invalid_body" };
  }
  if (!hasAnySibling(input.body, DEFAULT_REQUIRED_SIBLINGS)) {
    return { ok: false, reason: "missing_siblings" };
  }

  const aliases = [...DEFAULT_RS_FIELD_ALIASES, ...(input.extraFieldAliases ?? [])];
  const seen = new Set<string>();
  for (const field of aliases) {
    if (seen.has(field)) {
      continue;
    }
    seen.add(field);
    const rs = readIntegerField(input.body, field);
    if (rs !== null) {
      return { ok: true, rs, field };
    }
  }

  return { ok: false, reason: "invalid_rank_score" };
}
