import type { RsCarrier } from "./rs-carrier.ts";
import { EMBEDDED_DEFAULT_CARRIER } from "./rs-carrier.ts";

/** First-run ordering locked by Wayfinder #108 — Variant C only in v1. */
export type Variant = "C";

export type Phase =
  | "consent"
  | "elevate"
  | "installing_msi"
  | "npcap_needed"
  | "npcap_waiting"
  | "reboot_prompt"
  | "restart_game"
  | "setup_remaining"
  | "ready"
  | "waiting_for_game"
  | "capturing"
  | "rs_ready"
  | "awaiting_pwa_save"
  | "idle"
  | "error_interface"
  | "error_keylog"
  | "error_npcap"
  | "error_capture"
  | "error_capture_broken";

export type Action =
  | { type: "ACCEPT_RISK" }
  | { type: "DECLINE_RISK" }
  | { type: "UAC_ALLOW" }
  | { type: "UAC_DENY" }
  | { type: "MSI_OK" }
  | { type: "MSI_FAIL" }
  | { type: "NPCAP_ALREADY_PRESENT" }
  | { type: "NPCAP_MISSING" }
  | { type: "NPCAP_OPEN_DOWNLOAD" }
  | { type: "NPCAP_DETECTED"; rebootRequired: boolean }
  | { type: "NPCAP_DETECT_TIMEOUT" }
  | { type: "REBOOT_DONE" }
  | { type: "GAME_RESTARTED" }
  | { type: "START_CAPTURE" }
  | { type: "GAME_DETECTED" }
  | { type: "GAME_LOST" }
  | { type: "RS_CAPTURED"; rs: number }
  | { type: "PWA_CONNECTED" }
  | { type: "ENTRY_SAVED" }
  | { type: "DISMISS_PROPOSAL" }
  | { type: "PICK_INTERFACE_OK" }
  | { type: "NEED_INTERFACE" }
  | { type: "RETRY" }
  | { type: "RESET" }
  | { type: "CAPTURE_BROKEN"; debugInfo: string }
  | {
      type: "MANIFEST_UPDATED";
      rsCarriers: RsCarrier[];
      manifestStale: boolean;
      manifestWarnings: string[];
    };

export type CompanionState = {
  variant: Variant;
  phase: Phase;
  sslKeyLogPrepared: boolean;
  npcapPresent: boolean;
  npcapRebootRequired: boolean;
  npcapRebootDone: boolean;
  gameRestartedAfterEnv: boolean;
  lastRs: number | null;
  pwaConnected: boolean;
  autoOpenRankTracker: boolean;
  errorDetail: string | null;
  rsCarriers: RsCarrier[];
  manifestStale: boolean;
  manifestWarnings: string[];
  captureDebugInfo: string | null;
  quit: boolean;
};

export function readyToCapture(state: CompanionState): boolean {
  return (
    state.sslKeyLogPrepared &&
    state.npcapPresent &&
    (!state.npcapRebootRequired || state.npcapRebootDone) &&
    state.gameRestartedAfterEnv
  );
}

export function initialState(variant: Variant = "C"): CompanionState {
  return {
    variant,
    phase: "consent",
    sslKeyLogPrepared: false,
    npcapPresent: false,
    npcapRebootRequired: false,
    npcapRebootDone: false,
    gameRestartedAfterEnv: false,
    lastRs: null,
    pwaConnected: false,
    autoOpenRankTracker: true,
    errorDetail: null,
    rsCarriers: [EMBEDDED_DEFAULT_CARRIER],
    manifestStale: true,
    manifestWarnings: [],
    captureDebugInfo: null,
    quit: false,
  };
}

function afterMsi(state: CompanionState): CompanionState {
  return {
    ...state,
    sslKeyLogPrepared: true,
    errorDetail: null,
    phase: "setup_remaining",
  };
}

function afterNpcapOk(state: CompanionState, rebootRequired: boolean): CompanionState {
  const next: CompanionState = {
    ...state,
    npcapPresent: true,
    npcapRebootRequired: rebootRequired,
    npcapRebootDone: !rebootRequired,
    errorDetail: null,
  };
  if (rebootRequired) {
    return { ...next, phase: "reboot_prompt" };
  }
  return advancePastNpcap(next);
}

function advancePastNpcap(state: CompanionState): CompanionState {
  if (!state.gameRestartedAfterEnv) {
    return { ...state, phase: "setup_remaining" };
  }
  return { ...state, phase: "ready" };
}

function afterGameRestart(state: CompanionState): CompanionState {
  const next = { ...state, gameRestartedAfterEnv: true, errorDetail: null };
  if (!next.npcapPresent) {
    return { ...next, phase: "setup_remaining" };
  }
  if (readyToCapture(next)) {
    return { ...next, phase: "ready" };
  }
  return { ...next, phase: "setup_remaining" };
}

function tryStartCapture(state: CompanionState): CompanionState {
  if (!state.npcapPresent) {
    return {
      ...state,
      phase: "npcap_needed",
      errorDetail: "Npcap required before capture",
    };
  }
  if (state.npcapRebootRequired && !state.npcapRebootDone) {
    return { ...state, phase: "reboot_prompt", errorDetail: "Finish Npcap reboot first" };
  }
  if (!state.gameRestartedAfterEnv) {
    return { ...state, phase: "restart_game", errorDetail: "Restart Steam + game first" };
  }
  if (!readyToCapture(state)) {
    return {
      ...state,
      phase: "error_capture",
      errorDetail: "Not ready — check Npcap + game restart",
    };
  }
  return { ...state, phase: "waiting_for_game", errorDetail: null };
}

export function reduce(state: CompanionState, action: Action): CompanionState {
  if (action.type === "RESET") {
    return initialState(state.variant);
  }
  if (action.type === "MANIFEST_UPDATED") {
    return {
      ...state,
      rsCarriers: action.rsCarriers,
      manifestStale: action.manifestStale,
      manifestWarnings: action.manifestWarnings,
    };
  }
  if (state.quit) {
    return state;
  }

  switch (state.phase) {
    case "consent":
      if (action.type === "ACCEPT_RISK") {
        return { ...state, phase: "elevate" };
      }
      if (action.type === "DECLINE_RISK") {
        return { ...state, quit: true, errorDetail: "User declined risk disclaimer" };
      }
      break;
    case "elevate":
      if (action.type === "UAC_ALLOW") {
        return { ...state, phase: "installing_msi" };
      }
      if (action.type === "UAC_DENY") {
        return {
          ...state,
          phase: "consent",
          errorDetail: "Elevation required for companion MSI (not Npcap)",
        };
      }
      break;
    case "installing_msi":
      if (action.type === "MSI_OK") {
        return afterMsi(state);
      }
      if (action.type === "MSI_FAIL") {
        return {
          ...state,
          phase: "error_capture",
          errorDetail: "Companion MSI / tshark payload failed",
        };
      }
      break;
    case "setup_remaining": {
      if (action.type === "NPCAP_ALREADY_PRESENT") {
        const withNpcap = {
          ...state,
          npcapPresent: true,
          npcapRebootRequired: false,
          npcapRebootDone: true,
        };
        if (withNpcap.gameRestartedAfterEnv) {
          return { ...withNpcap, phase: "ready" };
        }
        return { ...withNpcap, phase: "setup_remaining" };
      }
      if (action.type === "NPCAP_MISSING") {
        return { ...state, phase: "npcap_needed" };
      }
      if (action.type === "NPCAP_OPEN_DOWNLOAD") {
        return { ...state, phase: "npcap_waiting" };
      }
      if (action.type === "GAME_RESTARTED") {
        return afterGameRestart(state);
      }
      break;
    }
    case "npcap_needed":
      if (action.type === "NPCAP_ALREADY_PRESENT") {
        return afterNpcapOk(state, false);
      }
      if (action.type === "NPCAP_OPEN_DOWNLOAD") {
        return { ...state, phase: "npcap_waiting" };
      }
      if (action.type === "NPCAP_DETECTED") {
        return afterNpcapOk(state, action.rebootRequired);
      }
      break;
    case "npcap_waiting":
      if (action.type === "NPCAP_DETECTED") {
        return afterNpcapOk(state, action.rebootRequired);
      }
      if (action.type === "NPCAP_DETECT_TIMEOUT") {
        return {
          ...state,
          phase: "error_npcap",
          errorDetail: "Still no Npcap — finish the official installer, then retry",
        };
      }
      if (action.type === "NPCAP_OPEN_DOWNLOAD") {
        return state;
      }
      break;
    case "reboot_prompt":
      if (action.type === "REBOOT_DONE") {
        return advancePastNpcap({ ...state, npcapRebootDone: true });
      }
      break;
    case "restart_game":
      if (action.type === "GAME_RESTARTED") {
        return afterGameRestart(state);
      }
      break;
    case "ready":
      if (action.type === "START_CAPTURE") {
        return tryStartCapture(state);
      }
      break;
    case "waiting_for_game":
      if (action.type === "GAME_DETECTED") {
        return { ...state, phase: "capturing" };
      }
      if (action.type === "RS_CAPTURED") {
        return {
          ...state,
          phase: "rs_ready",
          lastRs: action.rs,
          errorDetail: null,
        };
      }
      if (action.type === "RETRY") {
        return {
          ...state,
          phase: "error_keylog",
          errorDetail: "No SSLKEYLOGFILE lines after timeout — relaunch game after env set?",
        };
      }
      if (action.type === "GAME_LOST") {
        return {
          ...state,
          phase: "ready",
          errorDetail: "No game discovery traffic — launch THE FINALS and open Career → Leagues",
        };
      }
      if (action.type === "NEED_INTERFACE") {
        return {
          ...state,
          phase: "error_interface",
          errorDetail: "No packets on selected adapter — pick interface",
        };
      }
      break;
    case "capturing":
      if (action.type === "RS_CAPTURED") {
        return {
          ...state,
          phase: "rs_ready",
          lastRs: action.rs,
          errorDetail: null,
        };
      }
      if (action.type === "GAME_LOST") {
        return { ...state, phase: "waiting_for_game" };
      }
      if (action.type === "RETRY" || action.type === "NEED_INTERFACE") {
        return {
          ...state,
          phase: "error_interface",
          errorDetail: "No packets on selected adapter — pick interface",
        };
      }
      break;
    case "rs_ready":
      if (action.type === "PWA_CONNECTED") {
        return { ...state, phase: "awaiting_pwa_save", pwaConnected: true };
      }
      if (action.type === "DISMISS_PROPOSAL") {
        return { ...state, phase: "idle", lastRs: state.lastRs };
      }
      break;
    case "awaiting_pwa_save":
      if (action.type === "ENTRY_SAVED") {
        return { ...state, phase: "idle", pwaConnected: true };
      }
      if (action.type === "DISMISS_PROPOSAL") {
        return { ...state, phase: "idle" };
      }
      break;
    case "idle":
      if (action.type === "START_CAPTURE") {
        return tryStartCapture(state);
      }
      if (action.type === "RS_CAPTURED") {
        return { ...state, phase: "rs_ready", lastRs: action.rs };
      }
      break;
    case "error_interface":
      if (action.type === "PICK_INTERFACE_OK") {
        return { ...state, phase: "capturing", errorDetail: null };
      }
      if (action.type === "RETRY") {
        return { ...state, phase: "ready", errorDetail: null };
      }
      break;
    case "error_npcap":
      if (action.type === "RETRY") {
        return { ...state, phase: "npcap_needed", errorDetail: null };
      }
      if (action.type === "NPCAP_OPEN_DOWNLOAD") {
        return { ...state, phase: "npcap_waiting" };
      }
      break;
    case "error_keylog":
    case "error_capture":
      if (action.type === "RETRY") {
        return {
          ...state,
          phase: readyToCapture(state) ? "ready" : "setup_remaining",
          errorDetail: null,
        };
      }
      break;
    case "error_capture_broken":
      if (action.type === "RETRY") {
        return {
          ...state,
          phase: "ready",
          errorDetail: null,
          captureDebugInfo: null,
        };
      }
      if (action.type === "CAPTURE_BROKEN") {
        return state;
      }
      break;
  }

  if (action.type === "CAPTURE_BROKEN") {
    return {
      ...state,
      phase: "error_capture_broken",
      errorDetail: "Capture broken / update needed",
      captureDebugInfo: action.debugInfo,
    };
  }

  return state;
}

export function legalActions(phase: Phase): Action["type"][] {
  switch (phase) {
    case "consent":
      return ["ACCEPT_RISK", "DECLINE_RISK"];
    case "elevate":
      return ["UAC_ALLOW", "UAC_DENY"];
    case "installing_msi":
      return ["MSI_OK", "MSI_FAIL"];
    case "setup_remaining":
      return ["NPCAP_MISSING", "NPCAP_ALREADY_PRESENT", "NPCAP_OPEN_DOWNLOAD", "GAME_RESTARTED"];
    case "npcap_needed":
      return ["NPCAP_OPEN_DOWNLOAD", "NPCAP_ALREADY_PRESENT", "NPCAP_DETECTED"];
    case "npcap_waiting":
      return ["NPCAP_DETECTED", "NPCAP_DETECT_TIMEOUT", "NPCAP_OPEN_DOWNLOAD"];
    case "reboot_prompt":
      return ["REBOOT_DONE"];
    case "restart_game":
      return ["GAME_RESTARTED"];
    case "ready":
      return ["START_CAPTURE"];
    case "waiting_for_game":
      return ["GAME_DETECTED", "RS_CAPTURED", "RETRY", "GAME_LOST", "NEED_INTERFACE"];
    case "capturing":
      return ["RS_CAPTURED", "GAME_LOST", "RETRY", "NEED_INTERFACE"];
    case "rs_ready":
      return ["PWA_CONNECTED", "DISMISS_PROPOSAL"];
    case "awaiting_pwa_save":
      return ["ENTRY_SAVED", "DISMISS_PROPOSAL"];
    case "idle":
      return ["START_CAPTURE", "RS_CAPTURED"];
    case "error_interface":
      return ["PICK_INTERFACE_OK", "RETRY"];
    case "error_npcap":
      return ["RETRY", "NPCAP_OPEN_DOWNLOAD"];
    case "error_keylog":
    case "error_capture":
      return ["RETRY"];
    case "error_capture_broken":
      return ["RETRY"];
  }
}
