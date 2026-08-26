# Rank Tracker Companion (Windows)

Tauri 2 tray app for THE FINALS RS capture. Spec [#111](https://github.com/rtabulov/rank-tracker/issues/111) · shell [#112](https://github.com/rtabulov/rank-tracker/issues/112) · setup [#113](https://github.com/rtabulov/rank-tracker/issues/113) · capture [#114](https://github.com/rtabulov/rank-tracker/issues/114).

## Prerequisites

- Rust + MSVC (for `tauri dev` / `tauri build`)
- WiX Toolset (for MSI release builds)
- Npcap (end-user install from [npcap.com](https://npcap.com/#download); **not** bundled)
- Bundled or system `tshark` (stage via `installer/fetch-tshark-payload.ps1`, or Wireshark installed for dev)

## Develop

```bash
# From repo root
vp install

# Browser dev panel (no Rust) — mirrors tray lifecycle + actions
vp run companion#dev:vite

# Full tray app (requires Rust)
vp run companion#dev
```

No app window in normal use — UI is the **system tray**. Click the icon for the lifecycle menu; **Quit** to exit. Closing a shell window hides it; tray keeps running.

### First-run setup (#113)

Tray drives Variant C: consent → UAC/MSI → checklist (Npcap link-out **or** Steam+game restart in either order) → ready.

- **Simulate MSI success** applies per-user `SSLKEYLOGFILE` under `%LOCALAPPDATA%\RankTrackerCompanion\tls\` (via `setx` / `icacls`).
- **Open Npcap download** opens the official page and polls until Npcap DLLs are detected.
- Installer notes, Burn stub (wontfix), and GPL placeholder: `installer/` and `src-tauri/resources/`.

### Live capture (#114)

When `readyToCapture`, **Start capture** runs bundled/system `tshark` against an auto-picked Npcap interface with the per-user TLS key log. Decrypted `*.es-dis.net` HTTP JSON is matched by the embedded carrier (`POST …/league-rank` → `rankScore`). Transient failures (empty keylog, no game traffic, bad adapter) show actionable tray hints — not “update needed”.

If auto-pick fails, a compact adapter picker opens in the shell window.

Pure helpers: `extractRsFromHttpJson`, `autoPickInterface`, `interpretCaptureObservation` in `packages/companion-lifecycle`. Fixture: `docs/research/fixtures/live-tls-rs/v1-discovery-leagues-league-rank.json`.

**Maintainer smoke (not CI):** with THE FINALS online, open Career → Leagues; captured RS should match on-screen Leagues RS.

## Prototype reference

First-run ordering and copy: branch [`prototype/companion-first-run-ux`](https://github.com/rtabulov/rank-tracker/tree/prototype/companion-first-run-ux).
