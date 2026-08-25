/**
 * PROTOTYPE — throwaway. Do not ship.
 *
 * Question (Wayfinder #108): After dropping silent Npcap OEM, how should the
 * tray-native first-run (Variant C from #78) present official Npcap link-out +
 * detect — balloon copy, ordering vs risk / UAC / Steam restart, and
 * ready-to-capture criteria?
 *
 * Chrome is locked to tray-native. A/B/C are three *orderings* of Npcap vs
 * Steam restart. Pure lifecycle machine + balloon copy. TUI is in tui.ts.
 */

export type Variant = "A" | "B" | "C";

export const VARIANT_NAMES: Record<Variant, string> = {
  A: "Npcap early — before Steam restart",
  B: "Npcap late — gate Start capture",
  C: "Either-order checklist after MSI",
};

/**
 * Ready-to-capture (product predicate, all variants):
 * companion MSI done + Npcap detected + (Npcap reboot done if asked) +
 * Steam+THE FINALS restarted after SSLKEYLOGFILE was written.
 */
export type Phase =
  | "consent"
  | "elevate"
  | "installing_msi"
  | "npcap_needed"
  | "npcap_waiting"
  | "reboot_prompt"
  | "restart_game"
  | "setup_remaining" // Variant C only: Npcap and/or restart still open
  | "ready"
  | "waiting_for_game"
  | "capturing"
  | "rs_ready"
  | "awaiting_pwa_save"
  | "idle"
  | "error_interface"
  | "error_keylog"
  | "error_npcap"
  | "error_capture";

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
  | { type: "RS_CAPTURED" }
  | { type: "PWA_CONNECTED" }
  | { type: "ENTRY_SAVED" }
  | { type: "DISMISS_PROPOSAL" }
  | { type: "PICK_INTERFACE_OK" }
  | { type: "RETRY" }
  | { type: "RESET" };

export type CompanionState = {
  variant: Variant;
  phase: Phase;
  /** MSI wrote SSLKEYLOGFILE user env (sim). */
  sslKeyLogPrepared: boolean;
  npcapPresent: boolean;
  npcapRebootRequired: boolean;
  npcapRebootDone: boolean;
  gameRestartedAfterEnv: boolean;
  lastRs: number | null;
  pwaConnected: boolean;
  autoOpenRankTracker: boolean;
  errorDetail: string | null;
  quit: boolean;
};

export function readyToCapture(s: CompanionState): boolean {
  return (
    s.sslKeyLogPrepared &&
    s.npcapPresent &&
    (!s.npcapRebootRequired || s.npcapRebootDone) &&
    s.gameRestartedAfterEnv
  );
}

export function initialState(variant: Variant = "A"): CompanionState {
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
    quit: false,
  };
}

function afterMsi(state: CompanionState): CompanionState {
  const base = {
    ...state,
    sslKeyLogPrepared: true,
    errorDetail: null,
  };
  switch (state.variant) {
    case "A":
      // Detect immediately; missing → link-out before game restart.
      return { ...base, phase: "npcap_needed" };
    case "B":
      // Defer Npcap until Start capture; ask for game restart first.
      return { ...base, phase: "restart_game" };
    case "C":
      return { ...base, phase: "setup_remaining" };
  }
}

function afterNpcapOk(state: CompanionState, rebootRequired: boolean): CompanionState {
  const next: CompanionState = {
    ...state,
    npcapPresent: true,
    npcapRebootRequired: rebootRequired,
    npcapRebootDone: !rebootRequired,
    errorDetail: null,
  };
  if (rebootRequired) return { ...next, phase: "reboot_prompt" };
  return advancePastNpcap(next);
}

function advancePastNpcap(state: CompanionState): CompanionState {
  if (state.variant === "C" && !state.gameRestartedAfterEnv) {
    return { ...state, phase: "setup_remaining" };
  }
  if (!state.gameRestartedAfterEnv) {
    return { ...state, phase: "restart_game" };
  }
  return { ...state, phase: "ready" };
}

function afterGameRestart(state: CompanionState): CompanionState {
  const next = { ...state, gameRestartedAfterEnv: true, errorDetail: null };
  if (state.variant === "C" && !next.npcapPresent) {
    return { ...next, phase: "setup_remaining" };
  }
  if (state.variant === "B" && !next.npcapPresent) {
    // Late Npcap: "ready" balloon but Start is gated.
    return { ...next, phase: "ready" };
  }
  if (readyToCapture(next)) return { ...next, phase: "ready" };
  if (!next.npcapPresent) return { ...next, phase: "npcap_needed" };
  return { ...next, phase: "ready" };
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
  if (action.type === "RESET") return initialState(state.variant);
  if (state.quit) return state;

  switch (state.phase) {
    case "consent":
      if (action.type === "ACCEPT_RISK") return { ...state, phase: "elevate" };
      if (action.type === "DECLINE_RISK")
        return { ...state, quit: true, errorDetail: "User declined risk disclaimer" };
      break;
    case "elevate":
      if (action.type === "UAC_ALLOW") return { ...state, phase: "installing_msi" };
      if (action.type === "UAC_DENY")
        return {
          ...state,
          phase: "consent",
          errorDetail: "Elevation required for companion MSI (not Npcap)",
        };
      break;
    case "installing_msi":
      if (action.type === "MSI_OK") return afterMsi(state);
      if (action.type === "MSI_FAIL")
        return {
          ...state,
          phase: "error_capture",
          errorDetail: "Companion MSI / tshark payload failed",
        };
      break;
    case "setup_remaining": {
      if (action.type === "NPCAP_ALREADY_PRESENT") {
        const withNpcap = {
          ...state,
          npcapPresent: true,
          npcapRebootRequired: false,
          npcapRebootDone: true,
        };
        if (withNpcap.gameRestartedAfterEnv) return { ...withNpcap, phase: "ready" };
        return { ...withNpcap, phase: "setup_remaining" };
      }
      if (action.type === "NPCAP_MISSING") return { ...state, phase: "npcap_needed" };
      if (action.type === "NPCAP_OPEN_DOWNLOAD") return { ...state, phase: "npcap_waiting" };
      if (action.type === "GAME_RESTARTED") return afterGameRestart(state);
      break;
    }
    case "npcap_needed":
      if (action.type === "NPCAP_ALREADY_PRESENT") return afterNpcapOk(state, false);
      if (action.type === "NPCAP_OPEN_DOWNLOAD") return { ...state, phase: "npcap_waiting" };
      if (action.type === "NPCAP_DETECTED") return afterNpcapOk(state, action.rebootRequired);
      break;
    case "npcap_waiting":
      if (action.type === "NPCAP_DETECTED") return afterNpcapOk(state, action.rebootRequired);
      if (action.type === "NPCAP_DETECT_TIMEOUT")
        return {
          ...state,
          phase: "error_npcap",
          errorDetail: "Still no Npcap — finish the official installer, then retry",
        };
      if (action.type === "NPCAP_OPEN_DOWNLOAD") return state; // reopen link
      break;
    case "reboot_prompt":
      if (action.type === "REBOOT_DONE")
        return advancePastNpcap({ ...state, npcapRebootDone: true });
      break;
    case "restart_game":
      if (action.type === "GAME_RESTARTED") return afterGameRestart(state);
      break;
    case "ready":
      if (action.type === "START_CAPTURE") return tryStartCapture(state);
      break;
    case "waiting_for_game":
      if (action.type === "GAME_DETECTED") return { ...state, phase: "capturing" };
      if (action.type === "RETRY")
        return {
          ...state,
          phase: "error_keylog",
          errorDetail: "No SSLKEYLOGFILE lines after timeout — relaunch game after env set?",
        };
      break;
    case "capturing":
      if (action.type === "RS_CAPTURED")
        return {
          ...state,
          phase: "rs_ready",
          lastRs: 25_644,
          errorDetail: null,
        };
      if (action.type === "GAME_LOST") return { ...state, phase: "waiting_for_game" };
      if (action.type === "RETRY")
        return {
          ...state,
          phase: "error_interface",
          errorDetail: "No packets on selected adapter — pick interface",
        };
      break;
    case "rs_ready":
      if (action.type === "PWA_CONNECTED")
        return { ...state, phase: "awaiting_pwa_save", pwaConnected: true };
      if (action.type === "DISMISS_PROPOSAL")
        return { ...state, phase: "idle", lastRs: state.lastRs };
      break;
    case "awaiting_pwa_save":
      if (action.type === "ENTRY_SAVED") return { ...state, phase: "idle", pwaConnected: true };
      if (action.type === "DISMISS_PROPOSAL") return { ...state, phase: "idle" };
      break;
    case "idle":
      if (action.type === "START_CAPTURE") return tryStartCapture(state);
      if (action.type === "RS_CAPTURED")
        return { ...state, phase: "rs_ready", lastRs: (state.lastRs ?? 25_000) + 37 };
      break;
    case "error_interface":
      if (action.type === "PICK_INTERFACE_OK")
        return { ...state, phase: "capturing", errorDetail: null };
      if (action.type === "RETRY") return { ...state, phase: "ready", errorDetail: null };
      break;
    case "error_npcap":
      if (action.type === "RETRY") return { ...state, phase: "npcap_needed", errorDetail: null };
      if (action.type === "NPCAP_OPEN_DOWNLOAD") return { ...state, phase: "npcap_waiting" };
      break;
    case "error_keylog":
    case "error_capture":
      if (action.type === "RETRY")
        return {
          ...state,
          phase: readyToCapture(state)
            ? "ready"
            : state.variant === "C"
              ? "setup_remaining"
              : "npcap_needed",
          errorDetail: null,
        };
      break;
  }
  return state;
}

export type ScreenWireframe = {
  chrome: string;
  title: string;
  body: string[];
  primaryCta: string | null;
  secondaryCta: string | null;
  trayTooltip: string;
};

export function screenFor(state: CompanionState): ScreenWireframe {
  const rs = state.lastRs != null ? String(state.lastRs) : "—";
  const balloon = trayBalloon(state, rs);
  const criteria = readyCriteriaLines(state);
  return {
    chrome: `~(tray icon)~  ${thinOrBalloon(state.phase)}`,
    title: balloon.title,
    body: [
      balloon.body,
      "",
      "Ready-to-capture checklist:",
      ...criteria,
      "",
      "Tray menu:",
      "  • Start / Stop capture",
      "  • Open Rank Tracker",
      "  • Install Npcap (official link)…",
      "  • Open status (rare)",
      "  • Quit",
      "",
      orderingNote(state.variant),
    ],
    primaryCta: primaryCta(state),
    secondaryCta: secondaryCta(state),
    trayTooltip: trayTooltip(state, rs),
  };
}

function thinOrBalloon(phase: Phase): string {
  if (phase === "consent" || phase === "elevate" || phase === "installing_msi") {
    return "[thin setup toast]";
  }
  return "[balloon / flyout]";
}

function orderingNote(v: Variant): string {
  switch (v) {
    case "A":
      return "Ordering A: risk → MSI UAC → Npcap link-out+detect → (reboot?) → restart game → Ready.";
    case "B":
      return "Ordering B: risk → MSI UAC → restart game → Ready-looking; Start capture gates on Npcap.";
    case "C":
      return "Ordering C: risk → MSI UAC → checklist balloon; Npcap and game restart in either order.";
  }
}

function readyCriteriaLines(s: CompanionState): string[] {
  const row = (ok: boolean, label: string) => `  ${ok ? "[x]" : "[ ]"} ${label}`;
  return [
    row(s.sslKeyLogPrepared, "Companion MSI + SSLKEYLOGFILE written"),
    row(s.npcapPresent, "Npcap detected (official install)"),
    row(!s.npcapRebootRequired || s.npcapRebootDone, "Npcap reboot done (if asked)"),
    row(s.gameRestartedAfterEnv, "Steam + THE FINALS restarted after env"),
    row(readyToCapture(s), "→ Start capture enabled"),
  ];
}

function trayBalloon(state: CompanionState, rs: string): { title: string; body: string } {
  switch (state.phase) {
    case "consent":
      return {
        title: "Capture Companion",
        body: "Reads YOUR game HTTPS for Rank Score. May violate Nexon/Embark rules. Continue?",
      };
    case "elevate":
      return {
        title: "Needs admin",
        body: "Allow UAC to install the companion (Npcap is separate — official installer later).",
      };
    case "installing_msi":
      return {
        title: "Installing companion…",
        body: "App + tshark. Npcap is not bundled.",
      };
    case "setup_remaining":
      return {
        title: "Two steps left",
        body: setupRemainingBody(state),
      };
    case "npcap_needed":
      return {
        title: "Install Npcap",
        body: "Required for capture. Opens npcap.com — run their installer (their UAC). We never bundle Npcap.",
      };
    case "npcap_waiting":
      return {
        title: "Waiting for Npcap…",
        body: "Finish the official installer. We'll detect when it's ready.",
      };
    case "reboot_prompt":
      return {
        title: "Reboot required",
        body: "Npcap asked for a Windows restart. Reboot, then we'll continue.",
      };
    case "restart_game":
      return {
        title: "Restart THE FINALS",
        body: "Fully quit Steam + game, then relaunch so SSLKEYLOGFILE applies.",
      };
    case "ready":
      return {
        title: readyToCapture(state) ? "Ready to capture" : "Almost ready",
        body: readyToCapture(state)
          ? "Right-click → Start capture"
          : state.variant === "B" && !state.npcapPresent
            ? "Game restarted. Start capture will ask you to install Npcap."
            : "Finish the checklist, then Start capture.",
      };
    case "waiting_for_game":
      return { title: "Waiting…", body: "Launch THE FINALS (Career → Leagues loads RS)." };
    case "capturing":
      return { title: "Capturing", body: "Listening for league-rank rankScore…" };
    case "rs_ready":
      return { title: `RS ${rs}`, body: "Opening Rank Tracker to prefill" };
    case "awaiting_pwa_save":
      return { title: `RS ${rs} offered`, body: "Save Entry in Rank Tracker" };
    case "idle":
      return { title: "Idle", body: `Last RS ${rs}` };
    case "error_interface":
      return { title: "Pick adapter", body: "Open status to choose interface" };
    case "error_keylog":
      return { title: "No TLS keys", body: "Restart Steam + game after SSLKEYLOGFILE was set" };
    case "error_npcap":
      return {
        title: "Npcap not found",
        body: state.errorDetail ?? "Open official download and retry detect",
      };
    case "error_capture":
      return { title: "Something failed", body: state.errorDetail ?? "See status" };
  }
}

function setupRemainingBody(state: CompanionState): string {
  const n = state.npcapPresent ? "done" : "needed";
  const g = state.gameRestartedAfterEnv ? "done" : "needed";
  return `Npcap (${n}) · Steam+game restart (${g}). Do either next — both required before capture.`;
}

function primaryCta(state: CompanionState): string | null {
  switch (state.phase) {
    case "consent":
      return "Continue";
    case "elevate":
      return "Continue to UAC";
    case "installing_msi":
      return null;
    case "setup_remaining":
      return state.npcapPresent ? "I've restarted Steam + game" : "Install Npcap (official)…";
    case "npcap_needed":
      return "Open npcap.com download";
    case "npcap_waiting":
      return null;
    case "reboot_prompt":
      return "Reboot now";
    case "restart_game":
      return "I've restarted — continue";
    case "ready":
      return "Start capture";
    case "rs_ready":
      return "Open Rank Tracker";
    case "idle":
      return "Start capture";
    case "error_interface":
      return "Use selected";
    case "error_npcap":
      return "Open Npcap download";
    case "error_keylog":
    case "error_capture":
      return "Retry";
    default:
      return null;
  }
}

function secondaryCta(state: CompanionState): string | null {
  switch (state.phase) {
    case "consent":
      return "Cancel";
    case "setup_remaining":
      return state.npcapPresent ? "Check Npcap again" : "I've restarted Steam + game";
    case "npcap_needed":
      return "I already installed Npcap — detect";
    case "npcap_waiting":
      return "Re-open download";
    case "ready":
      return null;
    case "rs_ready":
    case "awaiting_pwa_save":
      return "Dismiss";
    case "error_interface":
      return "Back";
    default:
      return null;
  }
}

function trayTooltip(state: CompanionState, rs: string): string {
  switch (state.phase) {
    case "ready":
      return readyToCapture(state) ? "Ready — Start capture" : "Setup incomplete";
    case "npcap_needed":
    case "npcap_waiting":
    case "error_npcap":
      return "Needs Npcap";
    case "rs_ready":
      return `RS ${rs} — open Rank Tracker`;
    case "awaiting_pwa_save":
      return `Awaiting Save — RS ${rs}`;
    case "idle":
      return `Idle — last RS ${rs}`;
    case "capturing":
      return "Capturing…";
    case "waiting_for_game":
      return "Waiting for game…";
    default:
      return state.phase;
  }
}

export function legalActions(phase: Phase, _variant: Variant): Action["type"][] {
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
      return ["GAME_DETECTED", "RETRY"];
    case "capturing":
      return ["RS_CAPTURED", "GAME_LOST", "RETRY"];
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
  }
}
