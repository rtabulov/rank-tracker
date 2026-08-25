import { describe, expect, test } from "vite-plus/test";
import { initialState, legalActions, readyToCapture, reduce, trayBalloon } from "../src/index.ts";

function throughSetupRemaining(): ReturnType<typeof initialState> {
  let state = initialState();
  state = reduce(state, { type: "ACCEPT_RISK" });
  state = reduce(state, { type: "UAC_ALLOW" });
  state = reduce(state, { type: "MSI_OK" });
  return state;
}

function throughReady(): ReturnType<typeof initialState> {
  let state = throughSetupRemaining();
  state = reduce(state, { type: "NPCAP_ALREADY_PRESENT" });
  state = reduce(state, { type: "GAME_RESTARTED" });
  return state;
}

describe("consent", () => {
  test("declining risk quits with disclaimer message", () => {
    const next = reduce(initialState(), { type: "DECLINE_RISK" });
    expect(next.quit).toBe(true);
    expect(next.errorDetail).toContain("declined");
  });

  test("consent balloon warns Embark is not approved and ban is possible", () => {
    const balloon = trayBalloon(initialState());
    expect(balloon.body).toMatch(/Nexon|Embark/i);
    expect(balloon.body).toMatch(/rules|ban/i);
  });
});

describe("variant C setup", () => {
  test("MSI ok lands on setup_remaining with SSLKEYLOG prepared", () => {
    const state = throughSetupRemaining();
    expect(state.phase).toBe("setup_remaining");
    expect(state.sslKeyLogPrepared).toBe(true);
    expect(state.variant).toBe("C");
  });

  test("game restart before Npcap stays on setup_remaining", () => {
    let state = throughSetupRemaining();
    state = reduce(state, { type: "GAME_RESTARTED" });
    expect(state.phase).toBe("setup_remaining");
    expect(state.gameRestartedAfterEnv).toBe(true);
    expect(state.npcapPresent).toBe(false);
  });

  test("Npcap before game restart stays on setup_remaining", () => {
    let state = throughSetupRemaining();
    state = reduce(state, { type: "NPCAP_ALREADY_PRESENT" });
    expect(state.phase).toBe("setup_remaining");
    expect(state.npcapPresent).toBe(true);
    expect(state.gameRestartedAfterEnv).toBe(false);
  });

  test("Npcap and game restart in either order reaches ready", () => {
    let npcapFirst = throughSetupRemaining();
    npcapFirst = reduce(npcapFirst, { type: "NPCAP_ALREADY_PRESENT" });
    npcapFirst = reduce(npcapFirst, { type: "GAME_RESTARTED" });
    expect(npcapFirst.phase).toBe("ready");
    expect(readyToCapture(npcapFirst)).toBe(true);

    let gameFirst = throughSetupRemaining();
    gameFirst = reduce(gameFirst, { type: "GAME_RESTARTED" });
    gameFirst = reduce(gameFirst, { type: "NPCAP_ALREADY_PRESENT" });
    expect(gameFirst.phase).toBe("ready");
    expect(readyToCapture(gameFirst)).toBe(true);
  });
});

describe("capture phases", () => {
  test("start capture moves ready to waiting_for_game", () => {
    const ready = throughReady();
    const waiting = reduce(ready, { type: "START_CAPTURE" });
    expect(waiting.phase).toBe("waiting_for_game");
  });

  test("game detected then RS captured reaches rs_ready", () => {
    let state = throughReady();
    state = reduce(state, { type: "START_CAPTURE" });
    state = reduce(state, { type: "GAME_DETECTED" });
    expect(state.phase).toBe("capturing");
    state = reduce(state, { type: "RS_CAPTURED", rs: 25_644 });
    expect(state.phase).toBe("rs_ready");
    expect(state.lastRs).toBe(25_644);
  });

  test("PWA connected then entry saved reaches idle", () => {
    let state = throughReady();
    state = reduce(state, { type: "START_CAPTURE" });
    state = reduce(state, { type: "GAME_DETECTED" });
    state = reduce(state, { type: "RS_CAPTURED", rs: 12_345 });
    state = reduce(state, { type: "PWA_CONNECTED" });
    expect(state.phase).toBe("awaiting_pwa_save");
    state = reduce(state, { type: "ENTRY_SAVED" });
    expect(state.phase).toBe("idle");
  });
});

describe("tray actions", () => {
  test("ready phase exposes start capture", () => {
    expect(legalActions("ready")).toContain("START_CAPTURE");
  });
});
