import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";
import { EMBEDDED_DEFAULT_CARRIER } from "../src/rs-carrier.ts";
import { extractBestRsFromFrames, type TimestampedHttpJsonFrame } from "../src/rs-extraction.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../docs/research/fixtures/live-tls-rs",
);

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as unknown;
}

const leagueRankBody = loadFixture("v1-discovery-leagues-league-rank.json");

describe("extractBestRsFromFrames", () => {
  const carrierFrame: TimestampedHttpJsonFrame = {
    capturedAt: "2026-01-01T10:00:00.000Z",
    host: "api-gateway.europe.es-dis.net",
    method: "POST",
    path: "/v1/discovery/leagues/league-rank",
    body: leagueRankBody,
  };

  test("carrier match wins over lower-priority carrier on older frame", () => {
    const highPriorityCarrier = {
      ...EMBEDDED_DEFAULT_CARRIER,
      id: "high",
      priority: 20,
      pathContains: "/v2/discovery/leagues/league-rank",
    };
    const lowCarrierFrame: TimestampedHttpJsonFrame = {
      ...carrierFrame,
      capturedAt: "2026-01-01T11:00:00.000Z",
      path: "/v1/discovery/leagues/league-rank",
      body: { rankScore: 99_999, leagueRankIndex: 1 },
    };
    const highCarrierFrame: TimestampedHttpJsonFrame = {
      ...carrierFrame,
      capturedAt: "2026-01-01T09:00:00.000Z",
      path: "/v2/discovery/leagues/league-rank",
      body: { rankScore: 12_345, leagueRankIndex: 1 },
    };

    const result = extractBestRsFromFrames(
      [lowCarrierFrame, highCarrierFrame],
      [EMBEDDED_DEFAULT_CARRIER, highPriorityCarrier],
      { qualifiedAttempt: false },
    );

    expect(result).toEqual({
      ok: true,
      rs: 12_345,
      source: "carrier",
      carrierId: "high",
    });
  });

  test("scan fallback runs only after qualified attempt with no carrier match", () => {
    const scanOnlyFrame: TimestampedHttpJsonFrame = {
      capturedAt: "2026-01-01T10:00:00.000Z",
      host: "api-gateway.europe.es-dis.net",
      method: "POST",
      path: "/v1/discovery/unknown-endpoint",
      body: { rankPoints: 42_000, highestLeagueRankIndex: 5 },
    };

    expect(
      extractBestRsFromFrames([scanOnlyFrame], [EMBEDDED_DEFAULT_CARRIER], {
        qualifiedAttempt: false,
      }),
    ).toEqual({ ok: false, reason: "no_match" });

    expect(
      extractBestRsFromFrames([scanOnlyFrame], [EMBEDDED_DEFAULT_CARRIER], {
        qualifiedAttempt: true,
      }),
    ).toEqual({
      ok: true,
      rs: 42_000,
      source: "scan",
      field: "rankPoints",
    });
  });

  test("scan ties break on most recent frame timestamp", () => {
    const older: TimestampedHttpJsonFrame = {
      capturedAt: "2026-01-01T09:00:00.000Z",
      host: "api-gateway.europe.es-dis.net",
      method: "POST",
      path: "/other",
      body: { rankScore: 10_000, leagueRankIndex: 1 },
    };
    const newer: TimestampedHttpJsonFrame = {
      capturedAt: "2026-01-01T11:00:00.000Z",
      host: "api-gateway.europe.es-dis.net",
      method: "POST",
      path: "/other",
      body: { rankScore: 20_000, leagueRankIndex: 1 },
    };

    const result = extractBestRsFromFrames([older, newer], [EMBEDDED_DEFAULT_CARRIER], {
      qualifiedAttempt: true,
    });

    expect(result).toEqual({
      ok: true,
      rs: 20_000,
      source: "scan",
      field: "rankScore",
    });
  });
});
