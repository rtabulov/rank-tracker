import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";
import {
  EMBEDDED_DEFAULT_CARRIER,
  extractRsFromHttpJson,
  hostMatchesPattern,
  type HttpJsonFrame,
} from "../src/rs-carrier.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../docs/research/fixtures/live-tls-rs",
);

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as unknown;
}

const leagueRankFixture = loadFixture("v1-discovery-leagues-league-rank.json");

describe("EMBEDDED_DEFAULT_CARRIER", () => {
  test("matches the locked live-capture carrier from #106", () => {
    expect(EMBEDDED_DEFAULT_CARRIER).toEqual({
      id: "league-rank-v1",
      priority: 10,
      hostPattern: "*.es-dis.net",
      method: "POST",
      pathContains: "/v1/discovery/leagues/league-rank",
      field: "rankScore",
      requiredSiblings: ["leagueRankIndex", "highestLeagueRankIndex"],
      enabled: true,
    });
  });
});

describe("hostMatchesPattern", () => {
  test("matches Europe discovery gateway under *.es-dis.net", () => {
    expect(hostMatchesPattern("api-gateway.europe.es-dis.net", "*.es-dis.net")).toBe(true);
  });

  test("rejects unrelated hosts", () => {
    expect(hostMatchesPattern("id.embark.games", "*.es-dis.net")).toBe(false);
  });
});

describe("extractRsFromHttpJson", () => {
  const matchingFrame: HttpJsonFrame = {
    host: "api-gateway.europe.es-dis.net",
    method: "POST",
    path: "/v1/discovery/leagues/league-rank",
    body: leagueRankFixture,
  };

  test("extracts rankScore 25644 from the live TLS fixture", () => {
    expect(extractRsFromHttpJson(matchingFrame)).toEqual({
      ok: true,
      rs: 25_644,
      carrierId: "league-rank-v1",
    });
  });

  test("rejects wrong method", () => {
    expect(extractRsFromHttpJson({ ...matchingFrame, method: "GET" })).toEqual({
      ok: false,
      reason: "no_carrier_match",
    });
  });

  test("rejects path that does not contain league-rank", () => {
    expect(
      extractRsFromHttpJson({
        ...matchingFrame,
        path: "/v1/discovery/roundstatsummary",
      }),
    ).toEqual({ ok: false, reason: "no_carrier_match" });
  });

  test("rejects body missing rankScore", () => {
    expect(
      extractRsFromHttpJson({
        ...matchingFrame,
        body: { leagueRankIndex: 11, highestLeagueRankIndex: 11 },
      }),
    ).toEqual({ ok: false, reason: "invalid_rank_score" });
  });

  test("rejects body missing both required siblings", () => {
    expect(
      extractRsFromHttpJson({
        ...matchingFrame,
        body: { rankScore: 25_644, progress: 25 },
      }),
    ).toEqual({ ok: false, reason: "missing_siblings" });
  });

  test("accepts when only one required sibling is present", () => {
    expect(
      extractRsFromHttpJson({
        ...matchingFrame,
        body: { rankScore: 12_345, leagueRankIndex: 4 },
      }),
    ).toEqual({ ok: true, rs: 12_345, carrierId: "league-rank-v1" });
  });

  test("rejects non-integer rankScore", () => {
    expect(
      extractRsFromHttpJson({
        ...matchingFrame,
        body: { rankScore: 25644.5, leagueRankIndex: 11 },
      }),
    ).toEqual({ ok: false, reason: "invalid_rank_score" });
  });
});
