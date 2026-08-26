import { invoke, isTauri } from "@tauri-apps/api/core";
import {
  NPCAP_DOWNLOAD_URL,
  interpretNpcapProbe,
  type CompanionState,
  type NpcapProbeFacts,
} from "companion-lifecycle";
import { dispatch, dispatchMenuId } from "./store.ts";

let npcapPollTimer: ReturnType<typeof setInterval> | null = null;

function stopNpcapPoll(): void {
  if (npcapPollTimer != null) {
    clearInterval(npcapPollTimer);
    npcapPollTimer = null;
  }
}

async function probeNpcap(): Promise<NpcapProbeFacts> {
  if (!isTauri()) {
    return { present: false, rebootRequired: false };
  }
  return invoke<NpcapProbeFacts>("detect_npcap");
}

async function openNpcapDownload(): Promise<void> {
  if (isTauri()) {
    await invoke("open_npcap_download");
    return;
  }
  window.open(NPCAP_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
}

function startNpcapPoll(): void {
  stopNpcapPoll();
  npcapPollTimer = setInterval(() => {
    void (async () => {
      const facts = await probeNpcap();
      if (!facts.present) {
        return;
      }
      stopNpcapPoll();
      dispatch(interpretNpcapProbe(facts, "post_install"));
    })();
  }, 2500);
}

/**
 * Tray/dev-panel menu handler: OS side effects + lifecycle dispatch.
 */
export async function handleSetupMenuId(id: string): Promise<CompanionState | null> {
  switch (id) {
    case "MSI_OK": {
      if (isTauri()) {
        try {
          await invoke<string>("apply_ssl_keylog");
        } catch {
          // Do not mark sslKeyLogPrepared if the env/ACL plan failed.
          return dispatchMenuId("MSI_FAIL");
        }
      }
      const next = dispatchMenuId(id);
      if (isTauri()) {
        const facts = await probeNpcap();
        dispatch(interpretNpcapProbe(facts, "checklist"));
      }
      return next;
    }
    case "NPCAP_OPEN_DOWNLOAD": {
      await openNpcapDownload();
      const next = dispatchMenuId(id);
      startNpcapPoll();
      return next;
    }
    case "NPCAP_MISSING":
    case "NPCAP_ALREADY_PRESENT": {
      if (isTauri()) {
        const facts = await probeNpcap();
        return dispatch(interpretNpcapProbe(facts, "checklist"));
      }
      return dispatchMenuId(id);
    }
    case "NPCAP_DETECTED": {
      if (isTauri()) {
        const facts = await probeNpcap();
        stopNpcapPoll();
        return dispatch(interpretNpcapProbe({ ...facts, present: true }, "post_install"));
      }
      return dispatchMenuId(id);
    }
    case "REBOOT_DONE": {
      if (isTauri()) {
        try {
          await invoke("clear_npcap_reboot_marker");
        } catch {
          // Still advance lifecycle; next detect will re-probe the service.
        }
        const facts = await probeNpcap();
        if (facts.present && facts.rebootRequired) {
          // Driver still not ready after claimed reboot — stay on reboot prompt via DETECT.
          return dispatch(interpretNpcapProbe(facts, "post_install"));
        }
      }
      return dispatchMenuId(id);
    }
    case "RESET": {
      stopNpcapPoll();
      return dispatchMenuId(id);
    }
    default:
      return dispatchMenuId(id);
  }
}
