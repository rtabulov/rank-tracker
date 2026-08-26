# Tauri MSI installer (companion #113)

**Ship vehicle:** Tauri WiX MSI only. WiX Burn is **wontfix** for private beta (`burn/Bundle.wxs` is historical stub only).

## Layout

| Path                                             | Role                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| `../src-tauri/`                                  | Tauri app; `tauri build` → MSI (`bundle.targets: msi`)                      |
| `../src-tauri/resources/tshark/`                 | Bundled `tshark` payload (gitignored; stage via `fetch-tshark-payload.ps1`) |
| `../src-tauri/resources/sslkeylog-setup.ps1`     | Bundled; MSI runs this after InstallFiles (per-user SSLKEYLOGFILE + ACL)    |
| `../src-tauri/resources/THIRD_PARTY_NOTICES.txt` | GPL / third-party placeholder                                               |
| `../src-tauri/windows/fragments/sslkeylog.wxs`   | WiX custom action wiring                                                    |
| `fetch-tshark-payload.ps1`                       | Copy pinned tshark CLI stack from an installed Wireshark                    |

## Player flow (Variant C)

1. MSI elevates (UAC) and installs companion + `tshark` machine-wide.
2. MSI custom action runs `resources\sslkeylog-setup.ps1` (impersonated) → per-user `SSLKEYLOGFILE` + key-log ACL.
3. Tray checklist: open official Npcap download (not bundled) → detect → optional reboot if driver not ready (3010-style) → Steam+game restart (either order with Npcap).
4. `readyToCapture` when `sslKeyLogPrepared && npcapPresent && (!rebootRequired || rebootDone) && gameRestartedAfterEnv`.

## tshark payload (Option A)

Binaries are **not** committed. Stage them locally before `tauri build`:

```powershell
powershell -ExecutionPolicy Bypass -File apps/companion/installer/fetch-tshark-payload.ps1
pnpm --dir apps/companion build
```

Pinned target version: **4.6.8**. Npcap installers are excluded from the payload on purpose.

## Npcap reboot marker

If DLLs are present but the `npcap` service will not run, the companion writes
`%LOCALAPPDATA%\RankTrackerCompanion\npcap-reboot-required` and the tray shows the reboot prompt.
**Reboot done** clears the marker and re-probes.
