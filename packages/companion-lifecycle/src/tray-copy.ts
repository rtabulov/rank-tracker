import type { CompanionState, Phase } from "./machine.ts";
import { readyToCapture } from "./machine.ts";

export type TrayBalloon = {
  title: string;
  body: string;
};

export function trayBalloon(state: CompanionState): TrayBalloon {
  const rs = state.lastRs != null ? String(state.lastRs) : "—";

  switch (state.phase) {
    case "consent":
      return {
        title: "Capture Companion",
        body: "Reads YOUR game HTTPS for Rank Score. Not Embark-approved; Nexon/Embark rules may prohibit this. Account ban is possible. Continue?",
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

export function primaryCta(state: CompanionState): string | null {
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

export function trayTooltip(state: CompanionState): string {
  const rs = state.lastRs != null ? String(state.lastRs) : "—";

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
      return phaseLabel(state.phase);
  }
}

function phaseLabel(phase: Phase): string {
  return phase;
}

export function actionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    ACCEPT_RISK: "Continue (accept risk)",
    DECLINE_RISK: "Cancel",
    UAC_ALLOW: "Simulate UAC allow",
    UAC_DENY: "Simulate UAC deny",
    MSI_OK: "Simulate MSI success",
    MSI_FAIL: "Simulate MSI failure",
    NPCAP_ALREADY_PRESENT: "Npcap already installed",
    NPCAP_MISSING: "Npcap not installed",
    NPCAP_OPEN_DOWNLOAD: "Open Npcap download",
    NPCAP_DETECTED: "Npcap detected (no reboot)",
    NPCAP_DETECT_TIMEOUT: "Npcap detect timeout",
    REBOOT_DONE: "Reboot done",
    GAME_RESTARTED: "Steam + game restarted",
    START_CAPTURE: "Start capture",
    GAME_DETECTED: "Game detected",
    GAME_LOST: "Game lost",
    RS_CAPTURED: "Simulate RS captured (25644)",
    PWA_CONNECTED: "Rank Tracker connected",
    ENTRY_SAVED: "Entry saved",
    DISMISS_PROPOSAL: "Dismiss",
    PICK_INTERFACE_OK: "Adapter selected",
    RETRY: "Retry",
    RESET: "Reset to consent",
  };
  return labels[actionType] ?? actionType;
}
