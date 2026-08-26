import { describe, expect, test } from "vite-plus/test";
import { interpretNpcapProbe, readyToCapture, reduce, initialState } from "companion-lifecycle";

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
});
