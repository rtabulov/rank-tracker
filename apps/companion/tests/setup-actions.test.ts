import { describe, expect, test } from "vite-plus/test";
import { initialState, interpretNpcapProbe, readyToCapture, reduce } from "companion-lifecycle";

describe("setup side-effect contracts", () => {
  test("post-install detect with reboot maps to reboot lifecycle path", () => {
    const action = interpretNpcapProbe({ present: true, rebootRequired: true }, "post_install");
    expect(action).toEqual({ type: "NPCAP_DETECTED", rebootRequired: true });
  });

  test("MSI_FAIL does not mark sslKeyLogPrepared", () => {
    let state = initialState();
    state = reduce(state, { type: "ACCEPT_RISK" });
    state = reduce(state, { type: "UAC_ALLOW" });
    state = reduce(state, { type: "MSI_FAIL" });
    expect(state.sslKeyLogPrepared).toBe(false);
    expect(readyToCapture(state)).toBe(false);
  });

  test("Npcap detect with rebootRequired lands on reboot_prompt until REBOOT_DONE", () => {
    let state = initialState();
    state = reduce(state, { type: "ACCEPT_RISK" });
    state = reduce(state, { type: "UAC_ALLOW" });
    state = reduce(state, { type: "MSI_OK" });
    state = reduce(state, { type: "NPCAP_OPEN_DOWNLOAD" });
    expect(state.phase).toBe("npcap_waiting");
    state = reduce(state, { type: "NPCAP_DETECTED", rebootRequired: true });
    expect(state.phase).toBe("reboot_prompt");
    expect(state.npcapRebootRequired).toBe(true);
    expect(state.npcapRebootDone).toBe(false);
    state = reduce(state, { type: "REBOOT_DONE" });
    expect(state.npcapRebootDone).toBe(true);
    expect(readyToCapture({ ...state, gameRestartedAfterEnv: true })).toBe(true);
  });
});
