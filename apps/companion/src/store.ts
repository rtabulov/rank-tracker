import {
  type Action,
  type CompanionState,
  initialState,
  legalActions,
  reduce,
} from "companion-lifecycle";

type Listener = (state: CompanionState) => void;

let state = initialState();
const listeners = new Set<Listener>();

export function getState(): CompanionState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function dispatch(action: Action): CompanionState {
  state = reduce(state, action);
  for (const listener of listeners) {
    listener(state);
  }
  return state;
}

export function availableActionTypes(): Action["type"][] {
  return legalActions(state.phase);
}

export function actionFromMenuId(id: string): Action | null {
  switch (id) {
    case "ACCEPT_RISK":
    case "DECLINE_RISK":
    case "UAC_ALLOW":
    case "UAC_DENY":
    case "MSI_OK":
    case "MSI_FAIL":
    case "NPCAP_ALREADY_PRESENT":
    case "NPCAP_MISSING":
    case "NPCAP_OPEN_DOWNLOAD":
    case "NPCAP_DETECT_TIMEOUT":
    case "REBOOT_DONE":
    case "GAME_RESTARTED":
    case "START_CAPTURE":
    case "GAME_DETECTED":
    case "GAME_LOST":
    case "PWA_CONNECTED":
    case "ENTRY_SAVED":
    case "DISMISS_PROPOSAL":
    case "PICK_INTERFACE_OK":
    case "RETRY":
    case "RESET":
      return { type: id };
    case "NPCAP_DETECTED":
      return { type: "NPCAP_DETECTED", rebootRequired: false };
    case "RS_CAPTURED":
      return { type: "RS_CAPTURED", rs: 25_644 };
    default:
      return null;
  }
}

export function dispatchMenuId(id: string): CompanionState | null {
  const action = actionFromMenuId(id);
  if (action === null) {
    return null;
  }
  return dispatch(action);
}
