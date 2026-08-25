/**
 * PROTOTYPE — throwaway TUI for Wayfinder #78.
 *
 * Question: first-run + steady-state UX for the capture companion
 * (installer steps, reboot, waiting for game, RS captured, errors).
 *
 * Run: pnpm prototype:companion-ux
 * Keys at bottom of each frame. ←/→ or [1]/[2]/[3] switch variants A/B/C.
 */

import readline from "node:readline";
import {
  type Action,
  type CompanionState,
  type Variant,
  VARIANT_NAMES,
  initialState,
  legalActions,
  reduce,
  screenFor,
} from "./machine.ts";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

let state: CompanionState = initialState("A");

function render(): void {
  console.clear();
  const screen = screenFor(state);
  const lines: string[] = [];
  lines.push(
    `${BOLD}PROTOTYPE${RESET} companion first-run UX  ${DIM}(Wayfinder #78 — not production)${RESET}`,
  );
  lines.push(
    `${BOLD}Variant ${state.variant}${RESET} — ${VARIANT_NAMES[state.variant]}   ${DIM}[1]A [2]B [3]C  or ← →${RESET}`,
  );
  lines.push("");
  lines.push(screen.chrome);
  lines.push(`${BOLD}${screen.title}${RESET}`);
  for (const b of screen.body) lines.push(`  ${b}`);
  lines.push("");
  if (screen.primaryCta) lines.push(`  ${BOLD}Primary:${RESET} ${screen.primaryCta}`);
  if (screen.secondaryCta) lines.push(`  ${DIM}Secondary:${RESET} ${screen.secondaryCta}`);
  lines.push(`  ${DIM}Tray:${RESET} ${screen.trayTooltip}`);
  lines.push("");
  lines.push(`${BOLD}Machine${RESET}`);
  lines.push(`  phase: ${state.phase}`);
  lines.push(`  npcapeRebootRequired: ${state.npcapeRebootRequired}`);
  lines.push(`  lastRs: ${state.lastRs}`);
  lines.push(`  pwaConnected: ${state.pwaConnected}`);
  lines.push(`  autoOpenRankTracker: ${state.autoOpenRankTracker}`);
  if (state.errorDetail) lines.push(`  error: ${state.errorDetail}`);
  if (state.quit) lines.push(`  ${BOLD}quit${RESET}`);
  lines.push("");
  lines.push(`${BOLD}Keys${RESET}  ${DIM}(legal for this phase)${RESET}`);
  lines.push(`  ${keyHelp(state)}`);
  lines.push(
    `  ${DIM}[r] reset  [q] quit  | install paths: [i]=ok no reboot  [I]=ok + reboot  [f]=fail${RESET}`,
  );
  console.log(lines.join("\n"));
}

function keyHelp(s: CompanionState): string {
  const legal = new Set(legalActions(s.phase));
  const all: [string, string, Action["type"] | "INSTALL_OK_REBOOT"][] = [
    ["a", "accept risk", "ACCEPT_RISK"],
    ["d", "decline", "DECLINE_RISK"],
    ["u", "UAC allow", "UAC_ALLOW"],
    ["n", "UAC deny", "UAC_DENY"],
    ["i", "install ok", "INSTALL_OK"],
    ["g", "game restarted", "GAME_RESTARTED"],
    ["b", "reboot done", "REBOOT_DONE"],
    ["s", "start capture", "START_CAPTURE"],
    ["e", "game detected", "GAME_DETECTED"],
    ["c", "RS captured", "RS_CAPTURED"],
    ["p", "PWA connected", "PWA_CONNECTED"],
    ["v", "entry saved", "ENTRY_SAVED"],
    ["x", "dismiss proposal", "DISMISS_PROPOSAL"],
    ["k", "interface ok", "PICK_INTERFACE_OK"],
    ["t", "retry / fail path", "RETRY"],
    ["l", "game lost", "GAME_LOST"],
  ];
  return all
    .filter(([, , type]) => {
      if (type === "INSTALL_OK") return legal.has("INSTALL_OK");
      return legal.has(type as Action["type"]);
    })
    .map(([k, label]) => `${BOLD}[${k}]${RESET}${DIM}${label}${RESET}`)
    .join("  ");
}

function dispatch(action: Action): void {
  state = reduce(state, action);
  render();
}

function setVariant(v: Variant): void {
  state = { ...initialState(v) /* keep nothing — fresh first-run per variant */ };
  render();
}

function cycleVariant(dir: 1 | -1): void {
  const order: Variant[] = ["A", "B", "C"];
  const i = order.indexOf(state.variant);
  setVariant(order[(i + dir + 3) % 3]!);
}

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

render();

process.stdin.on(
  "keypress",
  (_str: string, key: { name?: string; ctrl?: boolean; sequence?: string }) => {
    if (!key) return;
    if (key.ctrl && key.name === "c") process.exit(0);
    if (key.name === "q") process.exit(0);
    if (key.name === "r") {
      state = initialState(state.variant);
      render();
      return;
    }
    if (key.name === "left") return cycleVariant(-1);
    if (key.name === "right") return cycleVariant(1);
    if (key.sequence === "1") return setVariant("A");
    if (key.sequence === "2") return setVariant("B");
    if (key.sequence === "3") return setVariant("C");

    const map: Record<string, Action | undefined> = {
      a: { type: "ACCEPT_RISK" },
      d: { type: "DECLINE_RISK" },
      u: { type: "UAC_ALLOW" },
      n: { type: "UAC_DENY" },
      i: { type: "INSTALL_OK", npcapeReboot: false },
      I: { type: "INSTALL_OK", npcapeReboot: true },
      f: { type: "INSTALL_FAIL" },
      g: { type: "GAME_RESTARTED" },
      b: { type: "REBOOT_DONE" },
      s: { type: "START_CAPTURE" },
      e: { type: "GAME_DETECTED" },
      c: { type: "RS_CAPTURED" },
      p: { type: "PWA_CONNECTED" },
      v: { type: "ENTRY_SAVED" },
      x: { type: "DISMISS_PROPOSAL" },
      k: { type: "PICK_INTERFACE_OK" },
      t: { type: "RETRY" },
      l: { type: "GAME_LOST" },
    };
    const ch = key.sequence ?? "";
    const action = map[ch];
    if (action) dispatch(action);
  },
);
