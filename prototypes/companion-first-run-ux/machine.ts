/**
 * PROTOTYPE — throwaway. Do not ship.
 *
 * Question (Wayfinder #78): What should the first-run and steady-state UX look like
 * for the capture companion installer + tray app (install steps, reboot prompt,
 * "waiting for game", "RS captured", error states)?
 *
 * Pure lifecycle machine + per-variant screen copy. TUI is in tui.ts.
 */

export type Variant = "A" | "B" | "C";

export const VARIANT_NAMES: Record<Variant, string> = {
  A: "Linear wizard → then tray",
  B: "Always-on checklist window",
  C: "Tray-native + balloons",
};

/** Lifecycle phases shared across variants; presentation differs. */
export type Phase =
  | "consent"
  | "elevate"
  | "installing"
  | "reboot_prompt"
  | "restart_game"
  | "ready"
  | "waiting_for_game"
  | "capturing"
  | "rs_ready"
  | "awaiting_pwa_save"
  | "idle"
  | "error_interface"
  | "error_keylog"
  | "error_capture";

export type Action =
  | { type: "ACCEPT_RISK" }
  | { type: "DECLINE_RISK" }
  | { type: "UAC_ALLOW" }
  | { type: "UAC_DENY" }
  | { type: "INSTALL_OK"; npcapeReboot: boolean }
  | { type: "INSTALL_FAIL" }
  | { type: "REBOOT_DONE" }
  | { type: "SKIP_REBOOT" } // only if reboot not required — noop path
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
  /** Simulated facts the UX must surface */
  npcapeRebootRequired: boolean;
  lastRs: number | null;
  pwaConnected: boolean;
  autoOpenRankTracker: boolean;
  errorDetail: string | null;
  quit: boolean;
};

export function initialState(variant: Variant = "A"): CompanionState {
  return {
    variant,
    phase: "consent",
    npcapeRebootRequired: false,
    lastRs: null,
    pwaConnected: false,
    autoOpenRankTracker: true,
    errorDetail: null,
    quit: false,
  };
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
      if (action.type === "UAC_ALLOW") return { ...state, phase: "installing" };
      if (action.type === "UAC_DENY")
        return {
          ...state,
          phase: "consent",
          errorDetail: "Elevation required for Npcap / driver install",
        };
      break;
    case "installing":
      if (action.type === "INSTALL_OK") {
        return {
          ...state,
          npcapeRebootRequired: action.npcapeReboot,
          phase: action.npcapeReboot ? "reboot_prompt" : "restart_game",
          errorDetail: null,
        };
      }
      if (action.type === "INSTALL_FAIL")
        return {
          ...state,
          phase: "error_capture",
          errorDetail: "Npcap or companion files failed to install",
        };
      break;
    case "reboot_prompt":
      if (action.type === "REBOOT_DONE") return { ...state, phase: "restart_game" };
      break;
    case "restart_game":
      if (action.type === "GAME_RESTARTED") return { ...state, phase: "ready" };
      break;
    case "ready":
      if (action.type === "START_CAPTURE") return { ...state, phase: "waiting_for_game" };
      break;
    case "waiting_for_game":
      if (action.type === "GAME_DETECTED") return { ...state, phase: "capturing" };
      if (action.type === "RETRY")
        return {
          ...state,
          phase: "error_keylog",
          errorDetail: "No SSLKEYLOGFILE lines after timeout — is the game launched after env set?",
        };
      break;
    case "capturing":
      if (action.type === "RS_CAPTURED")
        return {
          ...state,
          phase: "rs_ready",
          lastRs: 42_150,
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
      // Auto-open is a side-effect of entering rs_ready when disconnected — modeled as flag only
      break;
    case "awaiting_pwa_save":
      if (action.type === "ENTRY_SAVED") return { ...state, phase: "idle", pwaConnected: true };
      if (action.type === "DISMISS_PROPOSAL") return { ...state, phase: "idle" };
      break;
    case "idle":
      if (action.type === "START_CAPTURE") return { ...state, phase: "waiting_for_game" };
      if (action.type === "RS_CAPTURED")
        return { ...state, phase: "rs_ready", lastRs: (state.lastRs ?? 40_000) + 37 };
      break;
    case "error_interface":
      if (action.type === "PICK_INTERFACE_OK")
        return { ...state, phase: "capturing", errorDetail: null };
      if (action.type === "RETRY") return { ...state, phase: "ready", errorDetail: null };
      break;
    case "error_keylog":
    case "error_capture":
      if (action.type === "RETRY") return { ...state, phase: "ready", errorDetail: null };
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

/** Presentation layer — three radically different chrome strategies. */
export function screenFor(state: CompanionState): ScreenWireframe {
  const rs = state.lastRs != null ? String(state.lastRs) : "—";
  switch (state.variant) {
    case "A":
      return screenWizard(state, rs);
    case "B":
      return screenChecklist(state, rs);
    case "C":
      return screenTrayNative(state, rs);
  }
}

function screenWizard(state: CompanionState, rs: string): ScreenWireframe {
  const step = wizardStep(state.phase);
  const chrome = `┌─ Rank Tracker Capture — Setup (${step}/6) ─────────────────┐`;
  const map: Record<Phase, ScreenWireframe> = {
    consent: {
      chrome,
      title: "Before we capture traffic",
      body: [
        "This tool decrypts YOUR game HTTPS to read Rank Score.",
        "That may violate Nexon/Embark rules. Ban risk is real, unquantified.",
        "",
        "[ ] I understand and want to continue",
      ],
      primaryCta: "Continue",
      secondaryCta: "Cancel",
      trayTooltip: "(not in tray yet)",
    },
    elevate: {
      chrome,
      title: "Administrator permission",
      body: ["Windows will ask for UAC.", "Needed to install the packet-capture driver (Npcap)."],
      primaryCta: "Continue to UAC",
      secondaryCta: "Back",
      trayTooltip: "(not in tray yet)",
    },
    installing: {
      chrome,
      title: "Installing…",
      body: [
        "• Companion app",
        "• Capture stack (tshark)",
        "• Npcap driver",
        "• SSLKEYLOGFILE prep",
      ],
      primaryCta: null,
      secondaryCta: null,
      trayTooltip: "(not in tray yet)",
    },
    reboot_prompt: {
      chrome,
      title: "Restart Windows",
      body: [
        "Npcap needs a reboot before capture will work.",
        "After reboot, open this app again — we'll resume at 'restart game'.",
      ],
      primaryCta: "Reboot now",
      secondaryCta: "I'll reboot later",
      trayTooltip: "(not in tray yet)",
    },
    restart_game: {
      chrome,
      title: "Restart Steam + THE FINALS",
      body: [
        "Close THE FINALS and Steam fully, then launch again.",
        "SSLKEYLOGFILE only applies to new processes.",
      ],
      primaryCta: "I've restarted — continue",
      secondaryCta: null,
      trayTooltip: "(not in tray yet)",
    },
    ready: {
      chrome: `┌─ Rank Tracker Capture ─────────────────────────────────────┐`,
      title: "Setup complete",
      body: ["First-run done. Start capture when you're about to play ranked."],
      primaryCta: "Start capture",
      secondaryCta: "Quit to tray",
      trayTooltip: "Ready — click to start capture",
    },
    waiting_for_game: {
      chrome: `┌─ Rank Tracker Capture ─────────────────────────────────────┐`,
      title: "Waiting for THE FINALS…",
      body: ["Looking for game traffic + key-log activity."],
      primaryCta: null,
      secondaryCta: "Stop",
      trayTooltip: "Waiting for game…",
    },
    capturing: {
      chrome: `┌─ Rank Tracker Capture ─────────────────────────────────────┐`,
      title: "Capturing",
      body: ["Listening for Rank Score in game HTTPS…"],
      primaryCta: null,
      secondaryCta: "Stop",
      trayTooltip: "Capturing…",
    },
    rs_ready: {
      chrome: `┌─ Rank Tracker Capture ─────────────────────────────────────┐`,
      title: `RS ${rs} ready`,
      body: [
        state.autoOpenRankTracker && !state.pwaConnected
          ? "Opening Rank Tracker to prefill…"
          : "Proposal waiting for Rank Tracker.",
        "You still confirm Save in the PWA.",
      ],
      primaryCta: "Open Rank Tracker",
      secondaryCta: "Dismiss",
      trayTooltip: `RS ${rs} — open Rank Tracker`,
    },
    awaiting_pwa_save: {
      chrome: `┌─ Rank Tracker Capture ─────────────────────────────────────┐`,
      title: `Prefill offered — RS ${rs}`,
      body: ["Rank Tracker is connected. Save the Entry when ready."],
      primaryCta: null,
      secondaryCta: "Keep listening",
      trayTooltip: `Awaiting Save — RS ${rs}`,
    },
    idle: {
      chrome: `┌─ Rank Tracker Capture ─────────────────────────────────────┐`,
      title: "Idle",
      body: [`Last RS: ${rs}`, "Start capture again after your next ranked session."],
      primaryCta: "Start capture",
      secondaryCta: null,
      trayTooltip: `Idle — last RS ${rs}`,
    },
    error_interface: {
      chrome: `┌─ Rank Tracker Capture ─────────────────────────────────────┐`,
      title: "Pick network interface",
      body: [
        state.errorDetail ?? "Auto-detect failed.",
        "VPN / multi-adapter: choose the one THE FINALS uses.",
      ],
      primaryCta: "Use selected",
      secondaryCta: "Back to ready",
      trayTooltip: "Needs interface pick",
    },
    error_keylog: {
      chrome: `┌─ Rank Tracker Capture ─────────────────────────────────────┐`,
      title: "No TLS keys yet",
      body: [
        state.errorDetail ?? "Key log empty.",
        "Fully quit Steam + game, relaunch, then retry.",
      ],
      primaryCta: "Retry",
      secondaryCta: null,
      trayTooltip: "Key log missing",
    },
    error_capture: {
      chrome: `┌─ Rank Tracker Capture ─────────────────────────────────────┐`,
      title: "Something failed",
      body: [state.errorDetail ?? "Capture error"],
      primaryCta: "Retry from ready",
      secondaryCta: null,
      trayTooltip: "Error",
    },
  };
  return map[state.phase];
}

function wizardStep(phase: Phase): number {
  const order: Phase[] = [
    "consent",
    "elevate",
    "installing",
    "reboot_prompt",
    "restart_game",
    "ready",
  ];
  const i = order.indexOf(phase);
  return i >= 0 ? i + 1 : 6;
}

function screenChecklist(state: CompanionState, rs: string): ScreenWireframe {
  const checks = [
    check("Risk accepted", doneBefore(state.phase, "elevate")),
    check("Admin / Npcap", doneBefore(state.phase, "restart_game") || state.phase === "installing"),
    check(
      "Reboot (if asked)",
      !state.npcapeRebootRequired || doneBefore(state.phase, "restart_game"),
    ),
    check("Steam + game restarted", doneBefore(state.phase, "ready")),
    check("Capture running", ["capturing", "rs_ready", "awaiting_pwa_save"].includes(state.phase)),
    check(
      "RS proposed to PWA",
      ["rs_ready", "awaiting_pwa_save", "idle"].includes(state.phase) && state.lastRs != null,
    ),
  ];
  return {
    chrome: `╔══ Capture Companion — Status ══════════════════════════════╗`,
    title: phaseHeadline(state.phase, rs),
    body: [...checks, "", "Detail:", ...screenWizard(state, rs).body.slice(0, 3)],
    primaryCta: screenWizard(state, rs).primaryCta,
    secondaryCta: screenWizard(state, rs).secondaryCta,
    trayTooltip: screenWizard(state, rs).trayTooltip,
  };
}

function check(label: string, ok: boolean): string {
  return `${ok ? "[x]" : "[ ]"} ${label}`;
}

function doneBefore(phase: Phase, gate: Phase): boolean {
  const order: Phase[] = [
    "consent",
    "elevate",
    "installing",
    "reboot_prompt",
    "restart_game",
    "ready",
    "waiting_for_game",
    "capturing",
    "rs_ready",
    "awaiting_pwa_save",
    "idle",
  ];
  return order.indexOf(phase) > order.indexOf(gate);
}

function screenTrayNative(state: CompanionState, rs: string): ScreenWireframe {
  const balloon = trayBalloon(state, rs);
  return {
    chrome: `~(tray icon)~  ${state.phase === "consent" || state.phase === "elevate" || state.phase === "installing" ? "[thin setup toast]" : "[balloon / flyout]"}`,
    title: balloon.title,
    body: [
      balloon.body,
      "",
      "Tray menu:",
      "  • Start / Stop capture",
      "  • Open Rank Tracker",
      "  • Open status (rare)",
      "  • Quit",
      "",
      state.phase === "consent"
        ? "First launch: one consent dialog, then UAC — no multi-page wizard."
        : "Steady state lives in tray; full window only for errors / interface pick.",
    ],
    primaryCta: screenWizard(state, rs).primaryCta,
    secondaryCta: screenWizard(state, rs).secondaryCta,
    trayTooltip: screenWizard(state, rs).trayTooltip,
  };
}

function trayBalloon(state: CompanionState, rs: string): { title: string; body: string } {
  switch (state.phase) {
    case "consent":
      return { title: "Capture Companion", body: "Traffic capture has ToS/ban risk. Continue?" };
    case "elevate":
      return { title: "Needs admin", body: "Allow UAC to install capture driver." };
    case "installing":
      return { title: "Installing…", body: "Npcap + capture tools" };
    case "reboot_prompt":
      return { title: "Reboot required", body: "Npcap installed — restart Windows." };
    case "restart_game":
      return { title: "Restart THE FINALS", body: "Quit Steam + game, then relaunch." };
    case "ready":
      return { title: "Ready", body: "Right-click → Start capture" };
    case "waiting_for_game":
      return { title: "Waiting…", body: "Launch THE FINALS" };
    case "capturing":
      return { title: "Capturing", body: "Listening for RS…" };
    case "rs_ready":
      return { title: `RS ${rs}`, body: "Opening Rank Tracker to prefill" };
    case "awaiting_pwa_save":
      return { title: `RS ${rs} offered`, body: "Save Entry in Rank Tracker" };
    case "idle":
      return { title: "Idle", body: `Last RS ${rs}` };
    case "error_interface":
      return { title: "Pick adapter", body: "Open status to choose interface" };
    case "error_keylog":
      return { title: "No TLS keys", body: "Restart Steam + game after install" };
    case "error_capture":
      return { title: "Install failed", body: state.errorDetail ?? "See status" };
  }
}

function phaseHeadline(phase: Phase, rs: string): string {
  switch (phase) {
    case "rs_ready":
    case "awaiting_pwa_save":
      return `Now: RS ${rs}`;
    default:
      return `Now: ${phase}`;
  }
}

export function legalActions(phase: Phase): Action["type"][] {
  switch (phase) {
    case "consent":
      return ["ACCEPT_RISK", "DECLINE_RISK"];
    case "elevate":
      return ["UAC_ALLOW", "UAC_DENY"];
    case "installing":
      return ["INSTALL_OK", "INSTALL_FAIL"];
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
    case "error_keylog":
    case "error_capture":
      return ["RETRY"];
  }
}
