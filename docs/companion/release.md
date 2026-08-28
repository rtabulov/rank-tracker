# Companion release train (private beta)

Private beta ships an **unsigned WiX MSI** as a GitHub **pre-release**. Public stable release is **explicitly out of scope** until GPL counsel for bundled `tshark` and Authenticode signing are complete.

## Version sources (keep in sync)

| Location                                                                | Purpose                                                     |
| ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| `apps/companion/src-tauri/tauri.conf.json` → `version`                  | MSI product version                                         |
| `apps/companion/src/manifest-actions.ts` → `COMPANION_VERSION`          | Loopback `/health`, manifest `min_companion_version` checks |
| `apps/website/public/companion-manifest.json` → `min_companion_version` | Remote manifest floor for stale-companion warnings          |
| Git tag `companion-vX.Y.Z`                                              | GitHub pre-release identifier                               |

Bump all four together when cutting a companion pre-release.

## Automated build (CI)

Workflow: [`.github/workflows/companion-release.yml`](../../.github/workflows/companion-release.yml)

| Trigger                 | Result                                                          |
| ----------------------- | --------------------------------------------------------------- |
| `workflow_dispatch`     | Builds MSI artifact (retained 30 days) for maintainer download  |
| Push tag `companion-v*` | Builds MSI + publishes GitHub **pre-release** with MSI attached |

CI runs on `windows-latest`: stage `tshark` payload (Wireshark 4.6.8), `tauri build`, upload/publish MSI.

## Manual build (local)

```powershell
# Stage GPL tshark payload (requires Wireshark 4.6.8 installed)
powershell -ExecutionPolicy Bypass -File apps/companion/installer/fetch-tshark-payload.ps1

# Build MSI
pnpm --dir apps/companion build
# Output: apps/companion/src-tauri/target/release/bundle/msi/*.msi
```

## Publishing a pre-release

1. Complete [smoke-test checklist](./smoke-test-checklist.md) on the MSI artifact.
2. Deploy website (main branch) so PWA loopback prefill matches the MSI.
3. Update `companion-manifest.json` `min_companion_version` if this MSI raises the floor.
4. Tag and push: `git tag companion-v0.1.0 && git push origin companion-v0.1.0` (CI creates the pre-release).
5. Or: run the workflow manually, download the artifact, create a pre-release in GitHub UI.

## Download surfaces

| Surface               | URL                                               |
| --------------------- | ------------------------------------------------- |
| Website download page | https://rank.rtabulov.dev/companion               |
| GitHub pre-releases   | https://github.com/rtabulov/rank-tracker/releases |
| Tray capture broken   | Opens known-issues anchor on download page        |

The website resolves the latest pre-release MSI via the GitHub Releases API (`pickLatestPrereleaseMsi` in `companion-lifecycle`). If no pre-release exists, the page links to the releases index.

## PWA + MSI coordination

Companion MSI and website PWA **ship in the same release train**:

- Loopback contract (`GET /proposal`, `POST /proposal/clear`, `GET /health`) lives in `companion-bridge`.
- Breaking bridge changes require both a new MSI and a website deploy before advertising the tag.
- Non-breaking manifest-only RS carrier fixes can ship via `companion-manifest.json` without a new MSI when `min_companion_version` is unchanged.

## Out of scope until public stable

- Authenticode-signed MSI
- GPL-complete `tshark` redistribution package without counsel sign-off
- macOS / Linux companion
- GitHub **latest** (non-prerelease) channel for companion

See [known issues](./known-issues.md) for open beta gates.
