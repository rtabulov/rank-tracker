# Rank Tracker Companion (Windows)

Tauri 2 tray app for THE FINALS RS capture. Spec [#111](https://github.com/rtabulov/rank-tracker/issues/111) · shell [#112](https://github.com/rtabulov/rank-tracker/issues/112) · setup [#113](https://github.com/rtabulov/rank-tracker/issues/113) · capture [#114](https://github.com/rtabulov/rank-tracker/issues/114) · bridge [#115](https://github.com/rtabulov/rank-tracker/issues/115) · manifest [#116](https://github.com/rtabulov/rank-tracker/issues/116) · release [#117](https://github.com/rtabulov/rank-tracker/issues/117).

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

### Localhost bridge + PWA prefill (#115)

On RS capture the companion serves `http://127.0.0.1:37654` with latest-only `GET /proposal`, `POST /proposal/clear`, and `GET /health`. CORS is limited to Rank Tracker production + localhost dev. When the PWA is not connected, the companion auto-opens Rank Tracker; the PWA polls the bridge, opens **Log RS** prefilled, and clears the proposal after **Save** (dismiss without save keeps the proposal).

Shared contract + injectable client: `packages/companion-bridge`.

### Remote manifest + scan fallback (#116)

On startup and daily, the companion fetches `https://rank.rtabulov.dev/companion-manifest.json` (`rs_carriers`, `known_broken`, `min_companion_version`). Remote carriers merge by `id` (remote wins); offline uses embedded defaults with a tray stale warning. After a qualified capture attempt (game traffic + keylog + Leagues timeout) with no carrier match, a body-scan fallback hunts alias RS fields on `*.es-dis.net` with sibling validation. Broken tier shows **capture broken / update needed**, opens [known issues](https://rank.rtabulov.dev/companion#known-issues), and can copy sanitized debug info (no PII/tokens/raw traffic).

Pure helpers: `mergeRsCarriers`, `extractBestRsFromFrames`, `bodyScanForRs`, `isQualifiedCaptureAttempt`, `buildCaptureDebugInfo` in `packages/companion-lifecycle`. Hosted manifest: `apps/website/public/companion-manifest.json`.

### Private beta release (#117)

- **Download page:** https://rank.rtabulov.dev/companion (latest GitHub pre-release MSI + beta disclaimers).
- **CI:** `.github/workflows/companion-release.yml` — `workflow_dispatch` builds MSI; tag `companion-v*` publishes a GitHub **pre-release**.
- **Docs:** `docs/companion/release.md`, `known-issues.md`, `smoke-test-checklist.md`.
- **Public stable:** out of scope until GPL counsel + Authenticode signing (documented, not shipped).

## Prototype reference

First-run ordering and copy: branch [`prototype/companion-first-run-ux`](https://github.com/rtabulov/rank-tracker/tree/prototype/companion-first-run-ux).
