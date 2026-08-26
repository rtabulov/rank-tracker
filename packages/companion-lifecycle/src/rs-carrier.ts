/** Embedded default RS carrier from live TLS capture (#106 / #114). */

export type RsCarrier = {
  id: string;
  priority: number;
  hostPattern: string;
  method: "POST" | "GET";
  pathContains: string;
  field: string;
  /** At least one of these sibling fields must be present on the JSON object. */
  requiredSiblings: string[];
  enabled: boolean;
};

export const EMBEDDED_DEFAULT_CARRIER: RsCarrier = {
  id: "league-rank-v1",
  priority: 10,
  hostPattern: "*.es-dis.net",
  method: "POST",
  pathContains: "/v1/discovery/leagues/league-rank",
  field: "rankScore",
  requiredSiblings: ["leagueRankIndex", "highestLeagueRankIndex"],
  enabled: true,
};

export type HttpJsonFrame = {
  host: string;
  method: string;
  /** Request path or URI (query string optional). */
  path: string;
  body: unknown;
};

export type ExtractRsOk = {
  ok: true;
  rs: number;
  carrierId: string;
};

export type ExtractRsFail = {
  ok: false;
  reason: "no_carrier_match" | "invalid_rank_score" | "missing_siblings";
};

export type ExtractRsResult = ExtractRsOk | ExtractRsFail;

/**
 * Glob-style host match for carrier `hostPattern` values.
 * Only `*` as a single left-side label wildcard is supported (e.g. `*.es-dis.net`).
 */
export function hostMatchesPattern(host: string, pattern: string): boolean {
  const normalizedHost = host.trim().toLowerCase();
  const normalizedPattern = pattern.trim().toLowerCase();
  if (normalizedPattern.startsWith("*.")) {
    const suffix = normalizedPattern.slice(1); // ".es-dis.net"
    return normalizedHost === suffix.slice(1) || normalizedHost.endsWith(suffix);
  }
  return normalizedHost === normalizedPattern;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function carrierMatches(frame: HttpJsonFrame, carrier: RsCarrier): boolean {
  if (!carrier.enabled) {
    return false;
  }
  if (!hostMatchesPattern(frame.host, carrier.hostPattern)) {
    return false;
  }
  if (frame.method.toUpperCase() !== carrier.method) {
    return false;
  }
  return frame.path.includes(carrier.pathContains);
}

function readIntegerField(body: Record<string, unknown>, field: string): number | null {
  const value = body[field];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }
  return value;
}

function hasAnySibling(body: Record<string, unknown>, siblings: string[]): boolean {
  return siblings.some((key) => key in body);
}

/**
 * Match an HTTP JSON frame against embedded (or provided) carriers and extract Rank Score.
 * Pure — no I/O. Remote manifest / body-scan layers land in later tickets.
 */
export function extractRsFromHttpJson(
  frame: HttpJsonFrame,
  carriers: readonly RsCarrier[] = [EMBEDDED_DEFAULT_CARRIER],
): ExtractRsResult {
  const ordered = [...carriers].sort((a, b) => b.priority - a.priority);
  const carrier = ordered.find((c) => carrierMatches(frame, c));
  if (!carrier) {
    return { ok: false, reason: "no_carrier_match" };
  }
  if (!isPlainObject(frame.body)) {
    return { ok: false, reason: "invalid_rank_score" };
  }
  if (!hasAnySibling(frame.body, carrier.requiredSiblings)) {
    return { ok: false, reason: "missing_siblings" };
  }
  const rs = readIntegerField(frame.body, carrier.field);
  if (rs === null) {
    return { ok: false, reason: "invalid_rank_score" };
  }
  return { ok: true, rs, carrierId: carrier.id };
}
