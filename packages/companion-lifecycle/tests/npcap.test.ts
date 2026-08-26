import { describe, expect, test } from "vite-plus/test";
import { NPCAP_DOWNLOAD_URL, interpretNpcapProbe } from "../src/npcap.ts";

describe("NPCAP_DOWNLOAD_URL", () => {
  test("points at the official Npcap download page", () => {
    expect(NPCAP_DOWNLOAD_URL).toBe("https://npcap.com/#download");
  });
});

describe("interpretNpcapProbe", () => {
  test("missing Npcap yields NPCAP_MISSING", () => {
    expect(interpretNpcapProbe({ present: false, rebootRequired: false })).toEqual({
      type: "NPCAP_MISSING",
    });
  });

  test("checklist context with present Npcap yields NPCAP_ALREADY_PRESENT", () => {
    expect(interpretNpcapProbe({ present: true, rebootRequired: false }, "checklist")).toEqual({
      type: "NPCAP_ALREADY_PRESENT",
    });
  });

  test("post_install with present and no reboot yields NPCAP_DETECTED", () => {
    expect(interpretNpcapProbe({ present: true, rebootRequired: false }, "post_install")).toEqual({
      type: "NPCAP_DETECTED",
      rebootRequired: false,
    });
  });

  test("post_install with reboot required yields NPCAP_DETECTED rebootRequired true", () => {
    expect(interpretNpcapProbe({ present: true, rebootRequired: true }, "post_install")).toEqual({
      type: "NPCAP_DETECTED",
      rebootRequired: true,
    });
  });

  test("missing wins over rebootRequired flag", () => {
    expect(interpretNpcapProbe({ present: false, rebootRequired: true }, "post_install")).toEqual({
      type: "NPCAP_MISSING",
    });
  });
});
