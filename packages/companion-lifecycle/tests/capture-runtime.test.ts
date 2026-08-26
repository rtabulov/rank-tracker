import { describe, expect, test } from "vite-plus/test";
import {
  autoPickInterface,
  interpretCaptureObservation,
  type CaptureInterface,
  type CaptureObservation,
} from "../src/capture-runtime.ts";

const ifaces: CaptureInterface[] = [
  { id: "\\Device\\NPF_Loopback", name: "Adapter for loopback traffic capture", isLoopback: true },
  { id: "\\Device\\NPF_{AAA}", name: "Ethernet", isLoopback: false },
  { id: "\\Device\\NPF_{BBB}", name: "Wi-Fi", isLoopback: false },
];

describe("autoPickInterface", () => {
  test("prefers a still-valid saved interface id", () => {
    expect(autoPickInterface(ifaces, "\\Device\\NPF_{BBB}")).toBe("\\Device\\NPF_{BBB}");
  });

  test("ignores stale saved id and picks first non-loopback", () => {
    expect(autoPickInterface(ifaces, "\\Device\\NPF_{GONE}")).toBe("\\Device\\NPF_{AAA}");
  });

  test("returns null when only loopback exists", () => {
    expect(autoPickInterface([ifaces[0]!], null)).toBeNull();
  });
});

describe("interpretCaptureObservation", () => {
  test("rs ready maps to RS_CAPTURED", () => {
    const obs: CaptureObservation = { kind: "rs_extracted", rs: 25_644 };
    expect(interpretCaptureObservation(obs, "capturing")).toEqual({
      type: "RS_CAPTURED",
      rs: 25_644,
    });
  });

  test("discovery traffic while waiting advances with GAME_DETECTED", () => {
    expect(interpretCaptureObservation({ kind: "discovery_traffic" }, "waiting_for_game")).toEqual({
      type: "GAME_DETECTED",
    });
  });

  test("empty keylog timeout yields RETRY from waiting_for_game (error_keylog path)", () => {
    expect(
      interpretCaptureObservation({ kind: "timeout_empty_keylog" }, "waiting_for_game"),
    ).toEqual({ type: "RETRY" });
  });

  test("no-game timeout yields GAME_LOST (back to ready with Leagues hint)", () => {
    expect(interpretCaptureObservation({ kind: "timeout_no_game" }, "waiting_for_game")).toEqual({
      type: "GAME_LOST",
    });
  });

  test("no packets timeout yields NEED_INTERFACE (error_interface path)", () => {
    expect(interpretCaptureObservation({ kind: "timeout_no_packets" }, "capturing")).toEqual({
      type: "NEED_INTERFACE",
    });
  });

  test("does not map transient issues to a broken/update-needed action", () => {
    const observations: CaptureObservation[] = [
      { kind: "timeout_empty_keylog" },
      { kind: "timeout_no_packets" },
      { kind: "timeout_no_game" },
    ];
    for (const observation of observations) {
      const action = interpretCaptureObservation(observation, "waiting_for_game");
      expect(action?.type).not.toBe("error_capture");
      expect(JSON.stringify(action)).not.toMatch(/update needed/i);
    }
  });
});
