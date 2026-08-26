# tshark payload (gitignored binaries)

Stage before MSI build (from repo root):

```powershell
powershell -ExecutionPolicy Bypass -File apps/companion/installer/fetch-tshark-payload.ps1
```

Uses an installed Wireshark (default `C:\Program Files\Wireshark`), pin **4.6.8**.
Npcap installers are not copied. See `installer/README.md`.
