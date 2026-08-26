# tshark payload (not committed)

Place a pinned `tshark` Windows distribution here for MSI bundling:

```
resources/tshark/
  tshark.exe
  (required DLLs / data files from the Wireshark CLI stack)
```

Do not commit binaries to git. CI or a maintainer drop copies them before
`tauri build` / Burn. Update `THIRD_PARTY_NOTICES.txt` with the exact version
and source-offer details when the payload is pinned.
