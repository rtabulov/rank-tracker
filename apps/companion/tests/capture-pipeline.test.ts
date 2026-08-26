import { describe, expect, test } from "vite-plus/test";
import { extractRsFromHttpJson, interpretCaptureObservation } from "companion-lifecycle";

/** Mirrors docs/research/fixtures/live-tls-rs/v1-discovery-leagues-league-rank.json */
const leagueRankFixture = {
  completedRounds: 210,
  highestLeagueRankIndex: 11,
  leagueRankIndex: 11,
  progress: 25,
  rankScore: 25_644,
  requiredPlacementRounds: 4,
};

describe("capture pipeline seam", () => {
  test("fixture frame extracts RS then maps to RS_CAPTURED for capturing phase", () => {
    const extracted = extractRsFromHttpJson({
      host: "api-gateway.europe.es-dis.net",
      method: "POST",
      path: "/v1/discovery/leagues/league-rank",
      body: leagueRankFixture,
    });
    expect(extracted.ok).toBe(true);
    if (!extracted.ok) {
      return;
    }
    expect(
      interpretCaptureObservation({ kind: "rs_extracted", rs: extracted.rs }, "capturing"),
    ).toEqual({
      type: "RS_CAPTURED",
      rs: 25_644,
    });
  });

  test("empty keylog timeout stays on actionable RETRY path", () => {
    expect(
      interpretCaptureObservation({ kind: "timeout_empty_keylog" }, "waiting_for_game"),
    ).toEqual({ type: "RETRY" });
  });
});
