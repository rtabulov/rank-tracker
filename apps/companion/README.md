# Rank Tracker Companion (Windows)

Tauri 2 tray app for THE FINALS RS capture. Ticket [#112](https://github.com/rtabulov/rank-tracker/issues/112).

## Prerequisites

- [Rust](https://rustup.rs/) (for `tauri dev` / `tauri build`)
- Npcap (end-user install; not bundled)

## Develop

```bash
# From repo root
vp install

# Browser dev panel (no Rust) — mirrors tray lifecycle + actions
vp run companion#dev:vite

# Full tray app (requires Rust) — recompiles after Cargo.toml / lib.rs changes
vp run companion#dev
```

No app window in normal use — the UI is the **system tray** only (Windows 11: open tray overflow `^` near the clock). Click the icon for the lifecycle menu; use **Quit** to exit. Closing any shell window hides it and leaves the tray running.

Lifecycle logic lives in `packages/companion-lifecycle` (pure reducer + tray copy, fully unit tested).

## Prototype reference

First-run ordering and copy: branch [`prototype/companion-first-run-ux`](https://github.com/rtabulov/rank-tracker/tree/prototype/companion-first-run-ux).
