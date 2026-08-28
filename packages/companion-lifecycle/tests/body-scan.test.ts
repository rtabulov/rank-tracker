import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";
import { bodyScanForRs, DEFAULT_RS_FIELD_ALIASES } from "../src/body-scan.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../docs/research/fixtures/live-tls-rs",
);

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as unknown;
}

describe("DEFAULT_RS_FIELD_ALIASES", () => {
  test("includes shipped alias table from spec", () => {
    expect(DEFAULT_RS_FIELD_ALIASES).toEqual(
      expect.arrayContaining(["rankScore", "rankPoints", "RankScore"]),
    );
  });
});

describe("bodyScanForRs", () => {
  const leagueRankBody = loadFixture("v1-discovery-leagues-league-rank.json");

  test("finds rankScore on es-dis host when siblings present", () => {
    expect(
      bodyScanForRs({
        host: "api-gateway.europe.es-dis.net",
        body: leagueRankBody,
      }),
    ).toEqual({ ok: true, rs: 25_644, field: "rankScore" });
  });

  test("accepts rankPoints alias with sibling validation", () => {
    expect(
      bodyScanForRs({
        host: "api-gateway.europe.es-dis.net",
        body: { rankPoints: 18_000, highestLeagueRankIndex: 3 },
      }),
    ).toEqual({ ok: true, rs: 18_000, field: "rankPoints" });
  });

  test("rejects non es-dis hosts", () => {
    expect(
      bodyScanForRs({
        host: "id.embark.games",
        body: { rankScore: 1000, leagueRankIndex: 1 },
      }),
    ).toEqual({ ok: false, reason: "host_not_eligible" });
  });

  test("rejects body missing sibling validation fields", () => {
    expect(
      bodyScanForRs({
        host: "api-gateway.europe.es-dis.net",
        body: { rankScore: 1000, progress: 10 },
      }),
    ).toEqual({ ok: false, reason: "missing_siblings" });
  });

  test("merges manifest-added aliases", () => {
    expect(
      bodyScanForRs({
        host: "api-gateway.europe.es-dis.net",
        body: { customRsField: 9000, leagueRankIndex: 2 },
        extraFieldAliases: ["customRsField"],
      }),
    ).toEqual({ ok: true, rs: 9000, field: "customRsField" });
  });
});
