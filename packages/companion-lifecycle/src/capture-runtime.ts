import type { Action, Phase } from "./machine.ts";

/** Npcap/tshark interface row for auto-pick (ids are OS-stable when possible). */
export type CaptureInterface = {
  id: string;
  name: string;
  isLoopback: boolean;
};

/**
 * Choose a capture interface without opening a picker when possible.
 * Preference: saved id (if still listed) → first non-loopback → null.
 */
export function autoPickInterface(
  interfaces: readonly CaptureInterface[],
  savedInterfaceId: string | null | undefined,
): string | null {
  if (savedInterfaceId) {
    const saved = interfaces.find((iface) => iface.id === savedInterfaceId);
    if (saved && !saved.isLoopback) {
      return saved.id;
    }
  }
  const first = interfaces.find((iface) => !iface.isLoopback);
  return first?.id ?? null;
}

/**
 * Host-side capture observations mapped to lifecycle actions.
 * Transient failures become RETRY (→ error_keylog / error_interface), never a
 * "capture broken / update needed" signal (that lands in #116).
 */
export type CaptureObservation =
  | { kind: "rs_extracted"; rs: number }
  | { kind: "discovery_traffic" }
  | { kind: "timeout_empty_keylog" }
  | { kind: "timeout_no_packets" }
  | { kind: "timeout_no_game" };

export function interpretCaptureObservation(
  observation: CaptureObservation,
  phase: Phase,
): Action | null {
  switch (observation.kind) {
    case "rs_extracted":
      if (phase === "capturing" || phase === "waiting_for_game" || phase === "idle") {
        return { type: "RS_CAPTURED", rs: observation.rs };
      }
      return null;
    case "discovery_traffic":
      if (phase === "waiting_for_game") {
        return { type: "GAME_DETECTED" };
      }
      return null;
    case "timeout_empty_keylog":
      if (phase === "waiting_for_game") {
        return { type: "RETRY" };
      }
      return null;
    case "timeout_no_game":
      if (phase === "waiting_for_game") {
        return { type: "GAME_LOST" };
      }
      return null;
    case "timeout_no_packets":
      // Machine maps NEED_INTERFACE → error_interface (adapter picker).
      if (phase === "capturing" || phase === "waiting_for_game") {
        return { type: "NEED_INTERFACE" };
      }
      return null;
  }
}
