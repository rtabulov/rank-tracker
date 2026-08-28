import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { CompanionState, Phase } from "companion-lifecycle";
import { dispatch, getState, subscribe } from "./store.ts";

let bridgeReady = false;
let unlisten: UnlistenFn | null = null;

async function syncPhase(phase: Phase): Promise<void> {
  if (!isTauri()) {
    return;
  }
  try {
    await invoke("sync_bridge_phase_cmd", { phase });
  } catch {
    // bridge may not be running in dev browser panel
  }
}

export async function publishProposal(rs: number): Promise<void> {
  if (!isTauri()) {
    return;
  }
  const state = getState();
  try {
    await invoke("set_proposal_cmd", {
      rs,
      capturedAt: new Date().toISOString(),
      autoOpen: state.autoOpenRankTracker,
      pwaConnected: state.pwaConnected,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`set_proposal_cmd failed: ${message}`);
  }
}

async function ensureBridgeEvents(): Promise<void> {
  if (!isTauri() || unlisten) {
    return;
  }
  unlisten = await listen<{ kind: string }>("bridge-event", (event) => {
    switch (event.payload.kind) {
      case "pwa_connected":
        dispatch({ type: "PWA_CONNECTED" });
        break;
      case "proposal_cleared":
        if (getState().phase === "awaiting_pwa_save") {
          dispatch({ type: "ENTRY_SAVED" });
        }
        break;
      default:
        break;
    }
  });
}

export async function initBridge(): Promise<void> {
  if (!isTauri() || bridgeReady) {
    return;
  }
  try {
    await invoke("start_bridge_cmd");
    bridgeReady = true;
    await ensureBridgeEvents();
    await syncPhase(getState().phase);
    subscribe((state: CompanionState) => {
      void syncPhase(state.phase);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`start_bridge_cmd failed: ${message}`);
  }
}
