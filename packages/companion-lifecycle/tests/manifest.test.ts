import { describe, expect, test } from "vite-plus/test";
import { EMBEDDED_DEFAULT_CARRIER } from "../src/rs-carrier.ts";
import {
  COMPANION_MANIFEST_URL,
  compareSemver,
  manifestTrayWarnings,
  mergeRsCarriers,
  parseCompanionManifest,
} from "../src/manifest.ts";

describe("parseCompanionManifest", () => {
  test("maps snake_case rs_carriers into RsCarrier shape", () => {
    const parsed = parseCompanionManifest({
      rs_carriers: [
        {
          id: "league-rank-v2",
          priority: 20,
          host_pattern: "*.es-dis.net",
          method: "POST",
          path_contains: "/v2/league-rank",
          field: "rankPoints",
          field_aliases: ["rankScore"],
          required_siblings: ["leagueRankIndex"],
          enabled: true,
        },
      ],
      known_broken: { game_patch: "8.0.0", message: "RS path moved — update companion" },
      min_companion_version: "0.2.0",
    });

    expect(parsed.rsCarriers[0]).toEqual({
      id: "league-rank-v2",
      priority: 20,
      hostPattern: "*.es-dis.net",
      method: "POST",
      pathContains: "/v2/league-rank",
      field: "rankPoints",
      fieldAliases: ["rankScore"],
      requiredSiblings: ["leagueRankIndex"],
      enabled: true,
    });
    expect(parsed.knownBroken).toEqual({
      gamePatch: "8.0.0",
      message: "RS path moved — update companion",
    });
    expect(parsed.minCompanionVersion).toBe("0.2.0");
  });
});

describe("mergeRsCarriers", () => {
  test("remote entry with same id overrides embedded defaults", () => {
    const merged = mergeRsCarriers(
      [EMBEDDED_DEFAULT_CARRIER],
      [
        {
          ...EMBEDDED_DEFAULT_CARRIER,
          pathContains: "/v2/discovery/leagues/league-rank",
          priority: 15,
        },
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.pathContains).toBe("/v2/discovery/leagues/league-rank");
    expect(merged[0]?.priority).toBe(15);
  });

  test("remote carriers extend embedded by id", () => {
    const extra = {
      id: "alt-rank",
      priority: 5,
      hostPattern: "*.es-dis.net",
      method: "POST" as const,
      pathContains: "/alt",
      field: "rankScore",
      requiredSiblings: ["leagueRankIndex"],
      enabled: true,
    };
    const merged = mergeRsCarriers([EMBEDDED_DEFAULT_CARRIER], [extra]);
    expect(merged.map((c) => c.id).sort()).toEqual(["alt-rank", "league-rank-v1"]);
  });
});

describe("manifestTrayWarnings", () => {
  test("warns when companion is below min_companion_version", () => {
    const warnings = manifestTrayWarnings(
      { knownBroken: null, minCompanionVersion: "0.2.0" },
      "0.1.0",
      false,
    );
    expect(warnings.some((w) => /below minimum/i.test(w))).toBe(true);
  });

  test("includes known_broken message without blocking capture", () => {
    const warnings = manifestTrayWarnings(
      {
        knownBroken: { gamePatch: "8.0.0", message: "Capture may fail on patch 8.0.0" },
        minCompanionVersion: null,
      },
      "0.1.0",
      false,
    );
    expect(warnings).toContain("Capture may fail on patch 8.0.0");
  });

  test("adds stale/offline warning when manifest fetch failed", () => {
    const warnings = manifestTrayWarnings(
      { knownBroken: null, minCompanionVersion: null },
      "0.1.0",
      true,
    );
    expect(warnings.some((w) => /offline|stale/i.test(w))).toBe(true);
  });
});

describe("compareSemver", () => {
  test("orders dotted versions", () => {
    expect(compareSemver("0.1.0", "0.2.0")).toBeLessThan(0);
    expect(compareSemver("1.0.0", "0.9.9")).toBeGreaterThan(0);
    expect(compareSemver("0.1.0", "0.1.0")).toBe(0);
  });
});

describe("COMPANION_MANIFEST_URL", () => {
  test("points at hosted Rank Tracker manifest", () => {
    expect(COMPANION_MANIFEST_URL).toMatch(/^https:\/\//);
    expect(COMPANION_MANIFEST_URL).toContain("companion-manifest.json");
  });
});
