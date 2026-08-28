import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  buildCaptureDebugInfo,
  extractBestRsFromFrames,
  extractRsFromHttpJson,
  interpretCaptureObservation,
  isQualifiedCaptureAttempt,
  shouldReportCaptureBroken,
  type CaptureObservation,
  type CompanionState,
  type TimestampedHttpJsonFrame,
} from "companion-lifecycle";
import { dispatch, getState } from "./store.ts";
import { publishProposal } from "./bridge-actions.ts";
import { COMPANION_VERSION } from "./manifest-actions.ts";
import { renderInterfacePicker } from "./interface-picker.ts";

const WAIT_TIMEOUT_MS = 45_000;
const PACKET_TIMEOUT_MS = 60_000;

type CaptureEvent =
  | {
      kind: "http_json";
      host: string;
      method: string;
      path: string;
      body: unknown;
    }
  | { kind: "discovery_traffic" }
  | { kind: "started"; interface_id: string }
  | { kind: "stopped" };

type KeylogStatus = {
  path: string;
  present: boolean;
  nonEmpty: boolean;
};

let unlisten: UnlistenFn | null = null;
let waitTimer: ReturnType<typeof setTimeout> | null = null;
let packetTimer: ReturnType<typeof setTimeout> | null = null;
let capturing = false;
let sawDiscoveryTraffic = false;
let frameBuffer: TimestampedHttpJsonFrame[] = [];

function clearTimers(): void {
  if (waitTimer != null) {
    clearTimeout(waitTimer);
    waitTimer = null;
  }
  if (packetTimer != null) {
    clearTimeout(packetTimer);
    packetTimer = null;
  }
}

function resetCaptureSession(): void {
  sawDiscoveryTraffic = false;
  frameBuffer = [];
}

async function stopHostCapture(): Promise<void> {
  clearTimers();
  capturing = false;
  resetCaptureSession();
  if (isTauri()) {
    try {
      await invoke("stop_capture_cmd");
    } catch {
      // already stopped
    }
  }
}

function applyObservation(observation: CaptureObservation): void {
  const action = interpretCaptureObservation(observation, getState().phase);
  if (action) {
    dispatch(action);
  }
}

function dispatchCaptureBroken(): void {
  const state = getState();
  const debugInfo = buildCaptureDebugInfo({
    companionVersion: COMPANION_VERSION,
    phase: state.phase,
    manifestStale: state.manifestStale,
    manifestWarnings: state.manifestWarnings,
    carrierIds: state.rsCarriers.map((carrier) => carrier.id),
    frameCount: frameBuffer.length,
    sawDiscoveryTraffic,
    keylogPresent: true,
  });
  dispatch({ type: "CAPTURE_BROKEN", debugInfo });
}

async function finishWithExtractedRs(rs: number): Promise<void> {
  clearTimers();
  applyObservation({ kind: "rs_extracted", rs });
  await publishProposal(rs);
  await stopHostCapture();
  await hideShellWindow();
}

async function handleQualifiedCaptureTimeout(
  phase: CompanionState["phase"],
  keylogNonEmpty: boolean,
): Promise<void> {
  const qualified = isQualifiedCaptureAttempt({
    sawDiscoveryTraffic,
    keylogNonEmpty,
    phaseAtTimeout: phase,
  });
  const extraction = extractBestRsFromFrames(frameBuffer, getState().rsCarriers, {
    qualifiedAttempt: qualified,
  });

  if (extraction.ok) {
    await finishWithExtractedRs(extraction.rs);
    return;
  }

  if (shouldReportCaptureBroken(qualified, extraction)) {
    dispatchCaptureBroken();
    await stopHostCapture();
    return;
  }

  if (phase === "waiting_for_game") {
    applyObservation({ kind: "timeout_no_game" });
  } else if (!sawDiscoveryTraffic) {
    applyObservation({ kind: "timeout_no_packets" });
    void showInterfacePickerIfNeeded();
  }
  await stopHostCapture();
}

async function onCaptureEvent(event: CaptureEvent): Promise<void> {
  switch (event.kind) {
    case "discovery_traffic": {
      sawDiscoveryTraffic = true;
      applyObservation({ kind: "discovery_traffic" });
      if (packetTimer == null && getState().phase === "capturing") {
        packetTimer = setTimeout(() => {
          void (async () => {
            await handleQualifiedCaptureTimeout("capturing", true);
          })();
        }, PACKET_TIMEOUT_MS);
      }
      break;
    }
    case "http_json": {
      sawDiscoveryTraffic = true;
      applyObservation({ kind: "discovery_traffic" });
      const frame: TimestampedHttpJsonFrame = {
        host: event.host,
        method: event.method,
        path: event.path,
        body: event.body,
        capturedAt: new Date().toISOString(),
      };
      frameBuffer.push(frame);

      const extracted = extractRsFromHttpJson(frame, getState().rsCarriers);
      if (extracted.ok) {
        await finishWithExtractedRs(extracted.rs);
      }
      break;
    }
    default:
      break;
  }
}

async function hideShellWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }
  try {
    await getCurrentWindow().hide();
  } catch {
    // ignore
  }
}

async function showShellWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }
  const win = getCurrentWindow();
  await win.show();
  await win.setFocus();
}

export async function showInterfacePickerIfNeeded(): Promise<void> {
  if (!isTauri() || getState().phase !== "error_interface") {
    return;
  }
  let interfaces: Array<{ id: string; name: string; isLoopback: boolean }> = [];
  try {
    interfaces = await invoke("list_capture_interfaces");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    document.body.innerHTML = `<pre style="font-family:system-ui;padding:1rem;color:#f87171">${message}</pre>`;
    await showShellWindow();
    return;
  }
  renderInterfacePicker(document.body, interfaces, async (id) => {
    await invoke("save_capture_interface", { interfaceId: id });
    dispatch({ type: "PICK_INTERFACE_OK" });
    await hideShellWindow();
    await beginCapture(id);
  });
  await showShellWindow();
}

function armWaitTimeout(): void {
  clearTimers();
  waitTimer = setTimeout(() => {
    void (async () => {
      if (!capturing) {
        return;
      }
      const phase = getState().phase;
      if (phase !== "waiting_for_game" && phase !== "capturing") {
        return;
      }
      let keylog: KeylogStatus = { path: "", present: false, nonEmpty: false };
      if (isTauri()) {
        try {
          keylog = await invoke<KeylogStatus>("probe_keylog_status");
        } catch {
          // treat as empty
        }
      }
      if (!keylog.nonEmpty) {
        applyObservation({ kind: "timeout_empty_keylog" });
        await stopHostCapture();
        return;
      }

      if (phase === "capturing" || (phase === "waiting_for_game" && sawDiscoveryTraffic)) {
        await handleQualifiedCaptureTimeout(phase, keylog.nonEmpty);
        return;
      }

      applyObservation({ kind: "timeout_no_game" });
      await stopHostCapture();
    })();
  }, WAIT_TIMEOUT_MS);
}

async function ensureListener(): Promise<void> {
  if (!isTauri() || unlisten) {
    return;
  }
  unlisten = await listen<CaptureEvent>("capture-event", (event) => {
    void onCaptureEvent(event.payload);
  });
}

export async function beginCapture(interfaceId?: string): Promise<CompanionState | null> {
  const next = dispatch({ type: "START_CAPTURE" });
  if (next.phase !== "waiting_for_game") {
    return next;
  }

  resetCaptureSession();

  if (!isTauri()) {
    // Browser/dev panel: lifecycle only; real tshark is Tauri-hosted.
    return next;
  }

  await ensureListener();
  capturing = true;
  armWaitTimeout();
  try {
    await invoke<string>("start_capture_cmd", {
      interfaceId: interfaceId ?? null,
    });
  } catch (error) {
    capturing = false;
    clearTimers();
    resetCaptureSession();
    const message = error instanceof Error ? error.message : String(error);
    if (/interface/i.test(message)) {
      dispatch({ type: "NEED_INTERFACE" });
      await showInterfacePickerIfNeeded();
    } else {
      dispatch({ type: "RETRY" });
    }
  }
  return getState();
}

export async function handleCaptureMenuId(id: string): Promise<CompanionState | null> {
  switch (id) {
    case "START_CAPTURE":
      return beginCapture();
    case "PICK_INTERFACE_OK":
      return getState();
    case "RETRY": {
      await stopHostCapture();
      const next = dispatch({ type: "RETRY" });
      if (next.phase === "error_interface" || next.phase === "error_capture_broken") {
        if (next.phase === "error_interface") {
          await showInterfacePickerIfNeeded();
        }
      }
      return next;
    }
    case "NEED_INTERFACE": {
      await stopHostCapture();
      const next = dispatch({ type: "NEED_INTERFACE" });
      await showInterfacePickerIfNeeded();
      return next;
    }
    case "RESET":
    case "DISMISS_PROPOSAL":
    case "ENTRY_SAVED":
      await stopHostCapture();
      return null;
    default:
      return null;
  }
}
