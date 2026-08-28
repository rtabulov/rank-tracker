import { describe, expect, test } from "vite-plus/test";
import { buildCaptureDebugInfo } from "../src/debug-info.ts";
import { isQualifiedCaptureAttempt, shouldReportCaptureBroken } from "../src/break-detection.ts";

describe("isQualifiedCaptureAttempt", () => {
  test("requires game traffic, non-empty keylog, and capturing-phase timeout", () => {
    expect(
      isQualifiedCaptureAttempt({
        sawDiscoveryTraffic: true,
        keylogNonEmpty: true,
        phaseAtTimeout: "capturing",
      }),
    ).toBe(true);
  });

  test("waiting_for_game timeout without game is not qualified", () => {
    expect(
      isQualifiedCaptureAttempt({
        sawDiscoveryTraffic: false,
        keylogNonEmpty: true,
        phaseAtTimeout: "waiting_for_game",
      }),
    ).toBe(false);
  });

  test("empty keylog is not qualified", () => {
    expect(
      isQualifiedCaptureAttempt({
        sawDiscoveryTraffic: true,
        keylogNonEmpty: false,
        phaseAtTimeout: "capturing",
      }),
    ).toBe(false);
  });
});

describe("shouldReportCaptureBroken", () => {
  test("broken when qualified attempt and extraction found no RS", () => {
    expect(
      shouldReportCaptureBroken(
        isQualifiedCaptureAttempt({
          sawDiscoveryTraffic: true,
          keylogNonEmpty: true,
          phaseAtTimeout: "capturing",
        }),
        { ok: false, reason: "no_match" },
      ),
    ).toBe(true);
  });

  test("not broken when RS was extracted", () => {
    expect(
      shouldReportCaptureBroken(
        isQualifiedCaptureAttempt({
          sawDiscoveryTraffic: true,
          keylogNonEmpty: true,
          phaseAtTimeout: "capturing",
        }),
        { ok: true, rs: 25_644, source: "carrier", carrierId: "league-rank-v1" },
      ),
    ).toBe(false);
  });

  test("not broken for transient waiting_for_game timeout", () => {
    expect(
      shouldReportCaptureBroken(
        isQualifiedCaptureAttempt({
          sawDiscoveryTraffic: false,
          keylogNonEmpty: true,
          phaseAtTimeout: "waiting_for_game",
        }),
        { ok: false, reason: "no_match" },
      ),
    ).toBe(false);
  });
});

describe("buildCaptureDebugInfo", () => {
  test("includes version and phase without tokens or raw traffic", () => {
    const info = buildCaptureDebugInfo({
      companionVersion: "0.1.0",
      phase: "error_capture_broken",
      manifestStale: true,
      manifestWarnings: ["Manifest offline — using embedded carriers"],
      carrierIds: ["league-rank-v1"],
      frameCount: 12,
      sawDiscoveryTraffic: true,
      keylogPresent: true,
    });

    expect(info).toContain("0.1.0");
    expect(info).toContain("error_capture_broken");
    expect(info).toContain("league-rank-v1");
    expect(info).not.toMatch(/Bearer|token|sslkeys/i);
    expect(info).not.toMatch(/rankScore.*25644/);
  });
});
