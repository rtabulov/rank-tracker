import type { Action } from "./machine.ts";

/** Official Npcap download page — never bundle the free installer. */
export const NPCAP_DOWNLOAD_URL = "https://npcap.com/#download";

export type NpcapProbeFacts = {
  present: boolean;
  /** True when Npcap install signaled reboot-required (e.g. exit 3010). */
  rebootRequired: boolean;
};

export type NpcapProbeContext = "checklist" | "post_install";

/**
 * Map OS probe facts to lifecycle actions.
 * - checklist: initial / setup_remaining presence check
 * - post_install: after user ran the official installer (may need reboot)
 */
export function interpretNpcapProbe(
  facts: NpcapProbeFacts,
  context: NpcapProbeContext = "checklist",
): Action {
  if (!facts.present) {
    return { type: "NPCAP_MISSING" };
  }
  if (context === "post_install") {
    return { type: "NPCAP_DETECTED", rebootRequired: facts.rebootRequired };
  }
  return { type: "NPCAP_ALREADY_PRESENT" };
}
