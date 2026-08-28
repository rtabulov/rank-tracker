# Companion maintainer smoke-test checklist

Run after **major THE FINALS patches** or before publishing a new companion pre-release. This is manual validation — not CI.

**Live capture procedure:** follow the reproducible steps in [Wayfinder #106](https://github.com/rtabulov/rank-tracker/issues/106) and the locked carrier fixture at `docs/research/fixtures/live-tls-rs/v1-discovery-leagues-league-rank.json` (`POST` `*.es-dis.net` … `/v1/discovery/leagues/league-rank`, field `rankScore`).

## Environment

- [ ] Clean-ish Windows 10/11 VM or spare machine (not daily driver if possible)
- [ ] Latest **pre-release** MSI from [GitHub Releases](https://github.com/rtabulov/rank-tracker/releases) (or local `tauri build` artifact under test)
- [ ] THE FINALS + Steam installed; note game patch version
- [ ] Npcap installed from official link when tray prompts (not bundled)

## First-run / setup

- [ ] Consent screen: ToS/ban risk visible; decline exits without install
- [ ] UAC + MSI completes; tray shows setup checklist
- [ ] Per-user `SSLKEYLOGFILE` set under `%LOCALAPPDATA%\RankTrackerCompanion\tls\` (check with `setx` / env in a **new** shell after install)
- [ ] Npcap detect: tray advances after official install; reboot prompt only when driver not ready
- [ ] Fully exit Steam + THE FINALS, restart both; tray marks game restart done
- [ ] `readyToCapture` — tray offers **Start capture**

## Capture + RS extraction

- [ ] Start capture; launch THE FINALS; open **Career → Leagues**
- [ ] On-screen RS matches tray **RS ready** value (compare screenshot)
- [ ] Rank Tracker PWA opens or is already open; **Log RS** prefilled with captured RS
- [ ] Save Entry → proposal clears; dismiss without save keeps proposal
- [ ] Stop capture; no crash on exit

## SSLKEYLOGFILE inheritance (beta gate)

- [ ] After MSI only (no manual env edits), a **new** game process writes lines to the key log when Leagues is opened
- [ ] If inheritance fails: document Steam launch path, patch version, and whether a full OS reboot was tried

## Break / manifest paths

- [ ] Airplane mode or block manifest URL → tray warns stale/offline; embedded carrier still works if game unchanged
- [ ] `known_broken` / `min_companion_version` in manifest → tray warning only; capture still allowed
- [ ] Simulated carrier miss after qualified attempt → **capture broken** tray + known-issues link + copy debug info

## Release train (same tag)

- [ ] Website PWA at `https://rank.rtabulov.dev` deployed with loopback prefill support matching the MSI version
- [ ] `apps/website/public/companion-manifest.json` `min_companion_version` bumped if needed
- [ ] GitHub pre-release tag `companion-vX.Y.Z` matches `tauri.conf.json` / `COMPANION_VERSION`

## Sign-off

| Field             | Value       |
| ----------------- | ----------- |
| Companion version |             |
| Game patch        |             |
| Tester            |             |
| Date              |             |
| Result            | pass / fail |
| Notes             |             |
