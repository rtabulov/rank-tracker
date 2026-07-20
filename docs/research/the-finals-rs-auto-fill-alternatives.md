# THE FINALS Rank Score (RS) auto-fill — alternative data sources (research)

**Confidence:** **High** that no Embark-published, third-party-callable RS API exists beyond public leaderboard snapshots; **high** that live RS for ranked players appears as integer `rankScore` in Embark’s Season 11 leaderboard payload (field `5`); **medium** that all leaderboard-based lookups are capped at **10,000** crossplay entries per season; **low / unverified** whether game-client “discovery” JSON responses expose RS under stable field names (extractor captures endpoints but does not document RS schema).

Research date context: **2026-07-20** — Season 11 (Galaxy Masters) is current; Embark Help Center RS/league thresholds updated through **2026-03-02** ([Ranked Cashout FAQ 80](https://id.embark.games/the-finals/support/faq/80-ranked-tournament)).

**Scope:** Alternatives to the already-selected primary path **`leonlarsson/the-finals-api`** (`https://api.the-finals-leaderboard.com`, name filter → `rankScore`). That API is noted only where it wraps another source or differs materially.

---

## Summary table (alternatives only)

| #   | Source                                                                            | Returns RS (integer)?                         | Auth                       | Browser-callable (CORS)?                                       | Data type                    | Coverage                                        | Auto-fill fit                                       | Confidence           |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------- | -------------------------------------------------------------- | ---------------------------- | ----------------------------------------------- | --------------------------------------------------- | -------------------- |
| A   | Embark SSR leaderboard pages (`id.embark.games/the-finals/leaderboards/{season}`) | **Yes** (`rankScore` / field `5`)             | No                         | **No** (no `Access-Control-Allow-Origin`; verified 2026-07-20) | Snapshot (~cached SSR)       | Top **10,000** crossplay only (S11)             | Good **if** user ∈ top 10k; needs **backend proxy** | High                 |
| B   | Embark ranked leaderboard UI (`id.embark.games/leaderboards/ranked`)              | **Yes** (displayed RS in table)               | No                         | **No** (same origin stack)                                     | Snapshot                     | Top **10,000** (UI shows 1,000 pages × 10 rows) | Same as A; scrape HTML/`__NEXT_DATA__`              | High                 |
| C   | StatikApp static JSON (`statikapp.github.io/tfleaderboard`)                       | **No** for S11 (`fame: null`)                 | No                         | **Yes** (GitHub Pages)                                         | Stale static dump            | 10,000 rows                                     | **Poor / dead** for current RS                      | High                 |
| D   | Tracker.gg developer API                                                          | **No** (THE FINALS not listed)                | API key                    | N/A                                                            | —                            | —                                               | **Dead end**                                        | High                 |
| E   | Tracker.gg THE FINALS site                                                        | **No** player RS profiles found               | —                          | —                                                              | Population only              | —                                               | **Dead end**                                        | Medium               |
| F   | Steam Web API (`ISteamUserStats`, app `2073850`)                                  | **No** RS documented                          | API key                    | Server-side only                                               | Achievements / generic stats | All Steam users                                 | **Dead end** for RS                                 | High                 |
| G   | Xbox Live / PSN public APIs                                                       | **No** THE FINALS RS                          | OAuth / dev program        | Mixed                                                          | Platform metadata            | —                                               | **Dead end**                                        | High                 |
| H   | Embark ID account portal (logged-in profile)                                      | **No** RS on web profile                      | OAuth (platform login)     | No                                                             | Account metadata only        | Self                                            | **Dead end**                                        | High                 |
| I   | Overwolf Game Events (GEP) for THE FINALS                                         | **No** rank/RS events                         | Overwolf app               | Desktop only                                                   | Live match events            | Local player                                    | **Dead end** for RS                                 | High                 |
| J   | finals-stats.com (Overwolf desktop app)                                           | **Likely yes** in-app, **no public HTTP API** | Desktop install            | No                                                             | Local capture + UI           | Self                                            | Companion app only; not SPA                         | Medium               |
| K   | Game-client HTTPS capture (`v1-shared-profile`, `v1-discovery-*`)                 | **Unverified RS fields**                      | Session cookie / game auth | No                                                             | Snapshot on menu open        | **Self only**                                   | Desktop sidecar; ToS risk                           | Low–medium           |
| L   | Manual in-game / clipboard / deep link                                            | **Yes** (player sees RS)                      | —                          | —                                                              | Human snapshot               | Self                                            | Manual fallback only                                | High                 |
| M   | OCR / screen capture of RS UI                                                     | **Yes** (if UI visible)                       | —                          | Desktop only                                                   | Visual                       | Self                                            | Fragile; out of scope for SPA                       | Medium (feasibility) |
| N   | League name → RS inference                                                        | **No** exact RS                               | —                          | —                                                              | Derived band                 | All                                             | **Dead end** for integer auto-fill                  | High                 |
| O   | Community wrappers (TheFinals.NET, Ospuze, rank overlays)                         | **Yes** (via A or leonlarsson)                | No                         | Depends on wrapper                                             | Same as upstream             | Same as upstream                                | Same as upstream; not a new source                  | High                 |

---

## Option details

### A — Embark official leaderboard SSR (primary upstream of leonlarsson)

| Dimension                  | Assessment                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**             | Embark hosts season leaderboard pages as Next.js SSR. Community code fetches HTML and parses embedded `__NEXT_DATA__` JSON ([`leonlarsson/the-finals-api` → `src/apis/embarkApi.ts`](https://github.com/leonlarsson/the-finals-api/blob/main/src/apis/embarkApi.ts)).                                                                                                                                     |
| **RS?**                    | **Yes.** S11 schema maps field `5` → `rankScore` ([`season11.ts`](https://github.com/leonlarsson/the-finals-api/blob/main/src/schemas/leaderboards/season11.ts)). Live fetch (2026-07-20): top entry `rankScore: 59404`.                                                                                                                                                                                  |
| **Auth**                   | None for public page.                                                                                                                                                                                                                                                                                                                                                                                     |
| **CORS**                   | **Not browser-callable.** `GET https://id.embark.games/the-finals/leaderboards/s11` returns `200 text/html` with **no** `Access-Control-Allow-Origin` (verified). SPA must use same-origin proxy or serverless fetch.                                                                                                                                                                                     |
| **Historical vs snapshot** | **Current-season snapshot** embedded in page; not a time-series API. Past seasons use archived KV in leonlarsson or historical Embark URLs (e.g. `s10`, `s9`, …).                                                                                                                                                                                                                                         |
| **Coverage**               | **10,000** entries for S11 crossplay (verified via parsed `__NEXT_DATA__` and leonlarsson `count=true`). **No per-platform S11 URLs** (`s11steam`, `s11xbox`, `s11psn` → `404`). S11 route exposes **`crossplay` only** ([`leaderboard.ts` S11 config](https://github.com/leonlarsson/the-finals-api/blob/main/src/apis/leaderboard.ts)). Players below top 10k RS **cannot** be resolved by name search. |
| **Reliability / ToS**      | Undocumented “API”; HTML/`__NEXT_DATA__` shape can change without notice. Open Beta ToS prohibits scraping/exfiltration of systems ([Embark Open Beta ToS](https://www.embark-studios.com/obtos) — “mine, scrape or expropriate any system, data or personal information”). Live-game ToS risk is **real but unquantified**; leonlarsson and Embark leaderboard sites operate openly.                     |
| **Auto-fill fit**          | **Best alternative that returns RS** when player is on leaderboard: proxy Embark URL, filter client-side by `Name#1234` / Steam / PSN / Xbox aliases (same logic as leonlarsson `name` query).                                                                                                                                                                                                            |
| **Primary URLs**           | Page: [https://id.embark.games/the-finals/leaderboards/s11](https://id.embark.games/the-finals/leaderboards/s11) · Parser source: [embarkApi.ts](https://github.com/leonlarsson/the-finals-api/blob/main/src/apis/embarkApi.ts) · RS semantics: [FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)                                                                |

**Example upstream URL pattern (from source code):**

```
https://id.embark.games/the-finals/leaderboards/s11
https://id.embark.games/the-finals/leaderboards/s11s   # sponsor board
https://id.embark.games/the-finals/leaderboards/s11wt  # world tour
…
```

---

### B — Embark ranked leaderboard web UI

| Dimension                  | Assessment                                                                                                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**             | Official ranked table at [id.embark.games/leaderboards/ranked](https://id.embark.games/leaderboards/ranked) — shows Position, 24h change, Embark name, platform names, **League badge + RS integer** (e.g. Diamond 4 **50,152**). |
| **RS?**                    | **Yes** (displayed in UI).                                                                                                                                                                                                        |
| **Auth**                   | None.                                                                                                                                                                                                                             |
| **CORS**                   | Same as A — treat as non-browser-direct.                                                                                                                                                                                          |
| **Historical vs snapshot** | Snapshot; paginated (UI: 1,000 pages × 10 rows = 10,000).                                                                                                                                                                         |
| **Coverage**               | Top 10,000 globally.                                                                                                                                                                                                              |
| **Reliability / ToS**      | Same as A.                                                                                                                                                                                                                        |
| **Auto-fill fit**          | Functionally equivalent to A; prefer structured `__NEXT_DATA__` on season URL over HTML scraping.                                                                                                                                 |
| **Primary URLs**           | [THE FINALS Ranked Leaderboard](https://id.embark.games/leaderboards/ranked)                                                                                                                                                      |

---

### C — StatikApp/tfleaderboard (static JSON mirrors)

| Dimension                  | Assessment                                                                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**             | Community project publishing static JSON on GitHub Pages ([README](https://github.com/StatikApp/tfleaderboard/blob/main/README.md)).                                                                |
| **RS?**                    | **No / broken for current season.** Schema uses legacy `fame` field; live fetch (2026-07-20) of `leaderboard-crossplay.json`: 10,000 rows but top row `fame: null`, `cashouts: 0` — not current RS. |
| **Auth**                   | None.                                                                                                                                                                                               |
| **CORS**                   | **Yes** (GitHub Pages).                                                                                                                                                                             |
| **Historical vs snapshot** | Infrequently updated static file.                                                                                                                                                                   |
| **Coverage**               | 10,000 rows when populated.                                                                                                                                                                         |
| **Reliability**            | Low maintenance (3★ repo; automated commits).                                                                                                                                                       |
| **Auto-fill fit**          | **Do not use** for RS auto-fill.                                                                                                                                                                    |
| **Primary URLs**           | [leaderboard-crossplay.json](https://statikapp.github.io/tfleaderboard/leaderboard-crossplay.json) · [GitHub](https://github.com/StatikApp/tfleaderboard)                                           |

---

### D / E — Tracker Network (Tracker.gg)

| Dimension         | Assessment                                                                                                                                                                                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**    | Tracker.gg operates a **Titles API** for select games ([developers page](https://tracker.gg/developers) — Apex, CSGO, Division 2, Splitgate listed; **THE FINALS absent**). THE FINALS presence is **Steam population charts** only ([population/steam/2073850](https://tracker.gg/population/steam/2073850)). |
| **RS?**           | **No.** No `tracker.gg/the-finals/profile/...` product comparable to Marvel Rivals rank score boards.                                                                                                                                                                                                          |
| **Auth**          | Titles API requires partnership/key; not available for THE FINALS RS.                                                                                                                                                                                                                                          |
| **CORS**          | Developer API is server-side; site returns `403` to automated fetch (observed 2026-07-20).                                                                                                                                                                                                                     |
| **Auto-fill fit** | **Dead end.**                                                                                                                                                                                                                                                                                                  |
| **Primary URLs**  | [tracker.gg/developers](https://tracker.gg/developers) · [THE FINALS population](https://tracker.gg/population/steam/2073850)                                                                                                                                                                                  |

---

### F — Steam Web API

| Dimension         | Assessment                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**    | Valve `ISteamUserStats` — achievements and app stats ([Steamworks doc](https://partner.steamgames.com/doc/webapi/ISteamUserStats)). THE FINALS AppID **2073850**.                                                                                                                                 |
| **RS?**           | **No.** Endpoints return achievement unlock state / developer-defined Steam stats only; Embark RS is **not** exposed as a public Steam stat in documentation. Ranked RS is an Embark ladder concept ([FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)). |
| **Auth**          | API key; publisher-only for some writes.                                                                                                                                                                                                                                                          |
| **CORS**          | **Not browser-safe** (key must stay server-side).                                                                                                                                                                                                                                                 |
| **Auto-fill fit** | **Dead end** for RS.                                                                                                                                                                                                                                                                              |
| **Primary URLs**  | [ISteamUserStats](https://partner.steamgames.com/doc/webapi/ISteamUserStats) · [GetPlayerAchievements](https://partner.steamgames.com/doc/webapi/ISteamUserStats#GetPlayerAchievements)                                                                                                           |

---

### G — Xbox Live & PlayStation Network APIs

| Dimension         | Assessment                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What it is**    | Microsoft GDK documents title-scoped leaderboards/stats ([Xbox leaderboard REST](https://learn.microsoft.com/en-us/gaming/gdk/docs/reference/live/rest/uri/leaderboard/uri-scidsscidleaderboardsleaderboardnameget?view=gdk-2510)). PSN has profile share links ([psn-api `getProfileShareableLink`](https://github.com/achievements-app/psn-api/blob/main/src/user/getProfileShareableLink.ts)) — **PlayStation profile**, not Embark RS. |
| **RS?**           | **No** public third-party access to THE FINALS RS. Xbox/PSN leaderboards require title **SCID** / publisher integration; not published for community use.                                                                                                                                                                                                                                                                                  |
| **Auth**          | Developer credentials / user OAuth.                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Auto-fill fit** | **Dead end.**                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Primary URLs**  | [Xbox GET .../leaderboards/{name}](https://learn.microsoft.com/en-us/gaming/gdk/docs/reference/live/rest/uri/leaderboard/uri-scidsscidleaderboardsleaderboardnameget?view=gdk-2510) · [PSN share profile](https://github.com/achievements-app/psn-api/blob/main/src/user/getProfileShareableLink.ts)                                                                                                                                       |

---

### H — Embark ID / account linking portal

| Dimension            | Assessment                                                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**       | Web account management at [id.embark.games](https://id.embark.games/) — sign-in, display name, connected platforms ([FAQ 243](https://id.embark.games/the-finals/support/faq/243-display-name-and-embark-id-discriminator)). |
| **RS?**              | **No.** Profile shows `DisplayName#1234` only; no ranked stats or RS on account pages. Probed profile URL patterns → `404`.                                                                                                  |
| **Auth**             | Required for account settings; does not gate public leaderboard pages.                                                                                                                                                       |
| **Developer portal** | **None** for game stats. [embark.dev](https://embark.dev) / [github.com/embarkstudios](https://github.com/embarkstudios) cover engine/tooling, not THE FINALS player APIs.                                                   |
| **Auto-fill fit**    | **Dead end** for RS (useful only to confirm Embark name format).                                                                                                                                                             |
| **Primary URLs**     | [FAQ 243 — Embark ID](https://id.embark.games/the-finals/support/faq/243-display-name-and-embark-id-discriminator) · [Embark GitHub](https://github.com/embarkstudios)                                                       |

---

### I — Overwolf Game Events Provider (GEP)

| Dimension         | Assessment                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**    | Documented live game events for THE FINALS ([Overwolf GEP doc](https://github.com/overwolf/overwolf.github.io/blob/source/pages/api/live-game-data/supported-games/the-finals.mdx)).                                                        |
| **RS?**           | **No.** Features: `gep_internal`, `game_info` (`steam_id`, `scene`), `match_info` events (`match_start`, `match_end`, `elimination`, `death`). **No rank, league, or RS keys.**                                                             |
| **Auth**          | Overwolf desktop app + game running.                                                                                                                                                                                                        |
| **Auto-fill fit** | **Dead end** for RS auto-fill in browser SPA.                                                                                                                                                                                               |
| **Primary URLs**  | [the-finals.mdx (GEP)](https://github.com/overwolf/overwolf.github.io/blob/source/pages/api/live-game-data/supported-games/the-finals.mdx) · [The Finals Stats on Overwolf](https://www.overwolf.com/app/finals-stats.com-the_finals_stats) |

---

### J — finals-stats.com (Overwolf stats tracker)

| Dimension         | Assessment                                                                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What it is**    | Third-party desktop tracker ([finals-stats.com](https://finals-stats.com/)); explicitly **not affiliated** with Embark. Tracks ranked separately from fast play; shareable profile cards ([Overwolf listing](https://www.overwolf.com/app/finals-stats.com-the_finals_stats)). |
| **RS?**           | **Likely in-app** (ranked graphs, match RS changes claimed on site) but **no documented public REST API** for third-party SPA consumption.                                                                                                                                     |
| **Auth**          | Local Overwolf install.                                                                                                                                                                                                                                                        |
| **CORS**          | N/A (desktop).                                                                                                                                                                                                                                                                 |
| **Auto-fill fit** | **Poor** unless user manually copies from app UI or future official export exists.                                                                                                                                                                                             |
| **Primary URLs**  | [finals-stats.com](https://finals-stats.com/) · [Overwolf app page](https://www.overwolf.com/app/finals-stats.com-the_finals_stats)                                                                                                                                            |

---

### K — Game-client HTTPS / “discovery” APIs (reverse-engineered)

| Dimension                  | Assessment                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**             | [Swackles/the-finals-tracker-extractor](https://github.com/Swackles/the-finals-tracker-extractor) uses **Wireshark/tshark** + `SSLKEYLOGFILE` to decrypt game TLS and capture Embark JSON responses. Whitelisted paths ([`config.ini`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/config.ini)): `v1-discovery-roundstats`, `v1-discovery-roundstatsummary`, `v1-shared-profile`. |
| **RS?**                    | **Unverified in captured schema.** `v1-shared-profile` handler only extracts `embarkName` + `steamName` ([`util/fs.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/fs.py)); round-stats endpoints may contain post-match data but **RS field names not documented** in repo.                                                                                                |
| **Auth**                   | **Required** — bound to logged-in game session; not callable with only Embark name.                                                                                                                                                                                                                                                                                                                      |
| **CORS**                   | N/A (local capture).                                                                                                                                                                                                                                                                                                                                                                                     |
| **Historical vs snapshot** | Snapshot when user opens relevant in-game screens / finishes rounds.                                                                                                                                                                                                                                                                                                                                     |
| **Coverage**               | **Self only.**                                                                                                                                                                                                                                                                                                                                                                                           |
| **Reliability / ToS**      | High breakage risk on patches; Embark enforcement policy warns against unauthorized third-party tools affecting integrity ([Ban policy FAQ 161](https://id.embark.games/arc-raiders/support/faq/161-ban-and-enforcement-policy) — Arc Raiders page but states Embark-wide enforcement). Extractor README: “not affiliated or approved … at your own risk.”                                               |
| **Auto-fill fit**          | Theoretically strongest for **self** RS if endpoint schema were stable — requires **desktop companion**, not pure browser.                                                                                                                                                                                                                                                                               |
| **Primary URLs**           | [the-finals-tracker-extractor](https://github.com/Swackles/the-finals-tracker-extractor) · [the-finals-tracker (JSON import UI)](https://github.com/Swackles/the-finals-tracker)                                                                                                                                                                                                                         |

---

### L — Manual in-game UI, clipboard, share/deep links

| Dimension             | Assessment                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**        | RS visible in **Career → Leagues** and ranked flows ([FAQ 80](https://id.embark.games/the-finals/support/faq/80-ranked-tournament), [FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)). Embark ID in Social menu (`Name#1234`) ([FAQ 243](https://id.embark.games/the-finals/support/faq/243-display-name-and-embark-id-discriminator)). |
| **RS?**               | **Yes** — player reads integer from UI.                                                                                                                                                                                                                                                                                                                                           |
| **Share / deep link** | **No official RS deep link** found. finals-stats **profile cards** are third-party share images, not Embark URLs. No `id.embark.games/.../player/{name}` public profile with RS.                                                                                                                                                                                                  |
| **Clipboard**         | **No** documented “copy RS to clipboard” from game; manual typing or screenshot.                                                                                                                                                                                                                                                                                                  |
| **Auto-fill fit**     | Baseline **manual fallback** when API lookup misses (below top 10k, name mismatch, API down).                                                                                                                                                                                                                                                                                     |
| **Primary URLs**      | [FAQ 80 — Ranked Cashout](https://id.embark.games/the-finals/support/faq/80-ranked-tournament) · [FAQ 117 — RS](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)                                                                                                                                                                                  |

---

### M — OCR / screen capture (feasibility only)

| Dimension         | Assessment                                                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**    | Capture RS digits from Leagues screen, post-match summary, or leaderboard overlay ([Nykh0/the-finals-rank-overlay](https://github.com/Nykh0/the-finals-rank-overlay) — OBS browser source refreshing ~5 min; upstream is community leaderboard API, not OCR). |
| **RS?**           | **Yes**, if UI renders numeric RS clearly.                                                                                                                                                                                                                    |
| **Auth**          | Local screen access.                                                                                                                                                                                                                                          |
| **Auto-fill fit** | **Poor** for web SPA: OS permissions, font/UI changes, multi-monitor, anti-cheat sensitivity. Viable only as optional desktop helper.                                                                                                                         |
| **Primary URLs**  | [rank overlay generator](https://the-finals-rank-overlay-generator.vercel.app) · [Nykh0/the-finals-rank-overlay](https://github.com/Nykh0/the-finals-rank-overlay)                                                                                            |

---

### N — League / tier name → RS inference

| Dimension         | Assessment                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it is**    | Map league+tier to RS **bands** from official thresholds ([FAQ 80](https://id.embark.games/the-finals/support/faq/80-ranked-tournament)).         |
| **RS?**           | **Not exact.** e.g. “Platinum 2” ∈ [35,000 – 37,499] but cannot recover **37,102** without another signal. Ruby is top-500, not a fixed RS floor. |
| **Auto-fill fit** | **Dead end** for integer `Entry.rs` auto-fill unless paired with another source.                                                                  |
| **Primary URLs**  | [FAQ 80 — league RS ranges](https://id.embark.games/the-finals/support/faq/80-ranked-tournament)                                                  |

---

### O — Other community API wrappers (not distinct sources)

| Project                                                                                     | Role                                                                  |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [MCUnderground/TheFinals.NET](https://github.com/MCUnderground/TheFinals.NET)               | C# client for **leonlarsson API**; states not affiliated with Embark. |
| [Eisenhuth/Ospuze](https://github.com/Eisenhuth/Ospuze)                                     | Swift package over same leaderboard API.                              |
| [Nykh0/the-finals-rank-overlay](https://github.com/Nykh0/the-finals-rank-overlay)           | Stream overlay; polls community leaderboard API.                      |
| [leonlarsson/the-finals-leaderboard](https://github.com/leonlarsson/the-finals-leaderboard) | UI consuming Embark SSR + leonlarsson API; shows **10,000 players**.  |

All inherit **A’s** coverage and freshness constraints.

---

## Dead ends (explicit)

| Approach                                     | Why it fails for RS auto-fill                                                                                                                                                                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tracker.gg API / profiles**                | THE FINALS not in [Titles API](https://tracker.gg/developers); no rank score product.                                                                                                                                                                                   |
| **Steam / Xbox / PSN platform APIs**         | No documented public RS stat for AppID 2073850 / THE FINALS title SCID.                                                                                                                                                                                                 |
| **Embark ID web profile**                    | Account portal gives name/platform links only ([FAQ 243](https://id.embark.games/the-finals/support/faq/243-display-name-and-embark-id-discriminator)).                                                                                                                 |
| **Embark developer portal**                  | No published player-stats API ([Embark GitHub](https://github.com/embarkstudios) = tooling).                                                                                                                                                                            |
| **StatikApp tfleaderboard JSON**             | Stale/`fame: null` for current season (verified 2026-07-20).                                                                                                                                                                                                            |
| **Overwolf GEP**                             | No RS in [documented features](https://github.com/overwolf/overwolf.github.io/blob/source/pages/api/live-game-data/supported-games/the-finals.mdx).                                                                                                                     |
| **League-only data**                         | RS bands are wide ([FAQ 80](https://id.embark.games/the-finals/support/faq/80-ranked-tournament)); not invertible to integer.                                                                                                                                           |
| **Direct browser fetch to Embark SSR**       | No CORS headers (verified); also ~1 MB HTML payload per season board.                                                                                                                                                                                                   |
| **Per-platform S11 leaderboard URLs**        | `s11steam` / `s11xbox` / `s11psn` → HTTP 404; S11 is crossplay-only ([embarkApi.ts](https://github.com/leonlarsson/the-finals-api/blob/main/src/apis/embarkApi.ts), [leaderboard.ts](https://github.com/leonlarsson/the-finals-api/blob/main/src/apis/leaderboard.ts)). |
| **Players outside top 10,000 RS**            | Leaderboard payloads contain exactly 10,000 entries ([live count](https://api.the-finals-leaderboard.com/v1/leaderboard/s11/crossplay?count=true)); no official per-player lookup API found.                                                                            |
| **Official RS share URL / clipboard export** | Not documented in Embark FAQs; third-party cards only.                                                                                                                                                                                                                  |

---

## Verified live checks (2026-07-20)

| Check                                                                     | Result                                     |
| ------------------------------------------------------------------------- | ------------------------------------------ |
| `GET api.the-finals-leaderboard.com/.../s11/crossplay?name=Balise`        | `rankScore: 59404`, CORS `*`               |
| `GET .../s11/crossplay?count=true`                                        | `count: 10000`                             |
| `GET id.embark.games/the-finals/leaderboards/s11` → parse `__NEXT_DATA__` | `entries.length === 10000`, field `5` = RS |
| `GET id.embark.games/the-finals/leaderboards/s11` CORS                    | No ACAO header                             |
| `GET statikapp.github.io/.../leaderboard-crossplay.json`                  | 10,000 rows, top `fame: null`              |
| `GET tracker.gg/the-finals`                                               | HTTP 403 (no usable public API)            |

---

## Gaps / unverified

1. **Exact JSON schema** of `v1-discovery-roundstats` / `v1-discovery-roundstatsummary` for current RS — paths known from [extractor config](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/config.ini) but RS fields not published in repo.
2. **Hostnames** for discovery APIs (`api.embark.games`, `discovery.embark.games` probes from research environment returned no usable response — may be client-only or DNS-restricted).
3. **Live-game EULA** scraping clause vs Open Beta ToS — only [obtos](https://www.embark-studios.com/obtos) explicitly mentions scrape/mining; production game terms not fully reviewed here.
4. **Embark leaderboard refresh latency** — SSR cache TTL not documented; leonlarsson uses Cloudflare KV cache ([adding_new_api.md](https://github.com/leonlarsson/the-finals-api/blob/main/src/apis/adding_new_api.md)).
5. **Name filter ambiguity** — leonlarsson `name` is case-insensitive substring across Embark + platform names; discriminator collisions possible (`?name=2431` returned `count: 3` in live test).
6. **Historical RS time series** — no source provides “RS at timestamp T” except your own journal + archived season-end leaderboard snapshots.
7. **finals-stats.com** internal API — proprietary; no primary docs found.

---

## Claim → citation index

| Claim                                                     | Citation                                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| RS is the ranked ladder points integer                    | [FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)                                           |
| League tiers map to RS ranges (not exact RS)              | [FAQ 80](https://id.embark.games/the-finals/support/faq/80-ranked-tournament)                                                        |
| Embark S11 leaderboard URL and SSR parse method           | [embarkApi.ts](https://github.com/leonlarsson/the-finals-api/blob/main/src/apis/embarkApi.ts)                                        |
| Field `5` → `rankScore` in S11 payload                    | [season11.ts](https://github.com/leonlarsson/the-finals-api/blob/main/src/schemas/leaderboards/season11.ts)                          |
| S11 API platform = crossplay only                         | [leaderboard.ts (S11 block)](https://github.com/leonlarsson/the-finals-api/blob/main/src/apis/leaderboard.ts)                        |
| leonlarsson enables CORS on all routes                    | [index.ts `cors()`](https://github.com/leonlarsson/the-finals-api/blob/main/src/index.ts)                                            |
| Official ranked UI shows RS next to league                | [id.embark.games/leaderboards/ranked](https://id.embark.games/leaderboards/ranked)                                                   |
| Embark ID format `Name#1234`                              | [FAQ 243](https://id.embark.games/the-finals/support/faq/243-display-name-and-embark-id-discriminator)                               |
| Tracker.gg Titles API game list excludes THE FINALS       | [tracker.gg/developers](https://tracker.gg/developers)                                                                               |
| Steam stats API scope (achievements/stats, not Embark RS) | [ISteamUserStats](https://partner.steamgames.com/doc/webapi/ISteamUserStats)                                                         |
| Overwolf GEP feature set for THE FINALS                   | [the-finals.mdx](https://github.com/overwolf/overwolf.github.io/blob/source/pages/api/live-game-data/supported-games/the-finals.mdx) |
| Game traffic capture whitelisted endpoints                | [extractor config.ini](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/config.ini)                                |
| Extractor disclaimer / risk                               | [the-finals-tracker-extractor README](https://github.com/Swackles/the-finals-tracker-extractor)                                      |
| StatikApp static JSON endpoints                           | [tfleaderboard README](https://github.com/StatikApp/tfleaderboard/blob/main/README.md)                                               |
| Open Beta ToS anti-scraping language                      | [embark-studios.com/obtos](https://www.embark-studios.com/obtos)                                                                     |
| Enhanced leaderboard shows 10,000 players                 | [the-finals-leaderboard.com](https://the-finals-leaderboard.com/)                                                                    |

---

## Suggested app usage

1. **Keep `leonlarsson/the-finals-api` as primary** for browser SPA auto-fill: CORS `*`, `?name=` filter, returns `rankScore`, OpenAPI at [api.the-finals-leaderboard.com](https://api.the-finals-leaderboard.com/). Example:  
   `GET /v1/leaderboard/s11/crossplay?name={embarkDisplayName}` → use `data[0].rankScore` when `count === 1`.

2. **Fallback proxy to Embark SSR (Option A)** only if community API is down — same data upstream ([embarkApi.ts](https://github.com/leonlarsson/the-finals-api/blob/main/src/apis/embarkApi.ts)). Do **not** call from browser directly (no CORS).

3. **Match identity carefully:** prefer full `Name#1234` string; also match `steamName` / `psnName` / `xboxName` when user stored platform alias ([name filter logic](https://github.com/leonlarsson/the-finals-api/blob/main/src/routes/leaderboard.ts)). If `count !== 1`, show disambiguation — do not auto-fill.

4. **Handle missing RS gracefully:** if `count === 0`, user is likely **outside top 10,000** or unranked / name changed — leave input blank with copy pointing to in-game Leagues ([FAQ 80](https://id.embark.games/the-finals/support/faq/80-ranked-tournament)). Do **not** infer RS from league alone.

5. **Do not depend on:** StatikApp JSON, Tracker.gg, Steam/Xbox/PSN APIs, Overwolf GEP, or OCR for core web auto-fill.

6. **Optional future:** desktop sidecar via v1-discovery capture ([extractor](https://github.com/Swackles/the-finals-tracker-extractor)) for self-only users below leaderboard cutoff — out of scope for SPA unless product adds a trusted local bridge.

7. **Store metadata on auto-filled entries:** e.g. `source: "the-finals-api"`, `fetchedAt`, `season: "s11"`, `lookupCount` — aids debugging stale/wrong fills when leaderboard cache lags.
