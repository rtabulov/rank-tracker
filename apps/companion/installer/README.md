# WiX Burn → Tauri MSI (companion #113)

## Layout

| Path                                             | Role                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `../src-tauri/`                                  | Tauri app; `tauri build` produces the inner **WiX MSI** (`bundle.targets: msi`)      |
| `../src-tauri/resources/tshark/`                 | Bundled `tshark` payload (gitignored binaries; see README there)                     |
| `../src-tauri/resources/THIRD_PARTY_NOTICES.txt` | GPL / third-party placeholder                                                        |
| `sslkeylog-setup.ps1`                            | Per-user `SSLKEYLOGFILE` + key-log dir ACL helper (MSI custom action / post-install) |
| `burn/Bundle.wxs`                                | WiX Burn bootstrapper stub wrapping the Tauri MSI                                    |

## Player flow (Variant C)

1. Burn/MSI elevates (UAC) and installs companion + `tshark` machine-wide.
2. Custom action / first-run `apply_ssl_keylog` writes per-user env + ACLs (no manual `setx`).
3. Tray checklist: open official Npcap download (not bundled) → detect → optional reboot if installer signaled 3010 → Steam+game restart (either order with Npcap).
4. `readyToCapture` when `sslKeyLogPrepared && npcapPresent && (!rebootRequired || rebootDone) && gameRestartedAfterEnv`.

## Build notes

- Dev: `vp run companion#dev` — tray **MSI / SSLKEYLOG ready** calls `apply_ssl_keylog` in user scope (fails → MSI_FAIL; does not fake `sslKeyLogPrepared`).
- Release MSI: `pnpm --dir apps/companion build` (requires WiX + pinned `tshark` payload). Wire `sslkeylog-setup.ps1` as a WiX custom action so install (not only tray) writes the env.
- Burn: stub only until MSI path + tshark payload are filled; compile `burn/Bundle.wxs` with the WiX toolset.
- Npcap reboot (exit 3010): MSI/Burn should drop a marker the tray reads; cold `detect_npcap` cannot infer 3010 from DLLs alone.

Npcap is never bundled. Official download: https://npcap.com/#download
