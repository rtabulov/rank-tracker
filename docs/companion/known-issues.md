# Rank Tracker Companion — known issues (private beta)

**Status:** private beta only. Public stable release is **out of scope** until GPL counsel for bundled `tshark` and Authenticode code signing are complete.

## Open beta gates

| Gate                          | Status           | Notes                                                                                                                                                |
| ----------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SSLKEYLOGFILE inheritance** | Needs validation | MSI sets per-user `SSLKEYLOGFILE`; Steam/THE FINALS must inherit it after a full exit + restart. Maintainer smoke test required after major patches. |
| **GPL inventory / counsel**   | Pending          | Bundled `tshark` is GPL-2.0-or-later. Beta ships with `THIRD_PARTY_NOTICES.txt` placeholder; full compliance review before **public** release.       |
| **Authenticode signing**      | Pending          | Beta MSI is **unsigned**. Expect Windows SmartScreen warnings. Public stable requires a signed build.                                                |

## What to expect in beta

- **SmartScreen:** Windows may block or warn on the unsigned MSI. Use **More info → Run anyway** only if you accept the risk.
- **ToS / ban risk:** THE FINALS Terms of Service prohibit packet capture. This companion is **not** Embark-approved. Account action is possible; risk is unquantified and borne by the Player.
- **Patch survival:** Best-effort, not patch-immortal. After major THE FINALS updates, RS extraction may break until a manifest or MSI update ships.
- **Npcap:** Not bundled. Install from the official Npcap site when the tray checklist prompts you.
- **Capture broken:** After a qualified capture attempt (game traffic + keylog + Leagues timeout) with no RS found, the tray shows **capture broken / update needed**. Check [releases](https://github.com/rtabulov/rank-tracker/releases) for a newer pre-release or updated remote manifest.

## Reporting problems

1. Read this page and the [maintainer smoke-test checklist](./smoke-test-checklist.md) if you are validating after a game patch.
2. From the tray **capture broken** state, use **Copy debug info** (sanitized — no PII, tokens, or raw traffic) and attach it to a [GitHub issue](https://github.com/rtabulov/rank-tracker/issues/new/choose).
3. Include companion version, game patch if known, and whether Npcap + Steam/game restart steps were completed.

## Links

- [Download page](https://rank.rtabulov.dev/companion)
- [GitHub releases (pre-releases)](https://github.com/rtabulov/rank-tracker/releases)
- [Release train / version coordination](./release.md)
- Parent spec: [#111 RS capture companion](https://github.com/rtabulov/rank-tracker/issues/111)
