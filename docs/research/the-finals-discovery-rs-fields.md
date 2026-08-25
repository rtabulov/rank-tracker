# Discovery / shared-profile endpoints — Rank Score (RS) fields (research)

**Ticket:** [Wayfinder #74](https://github.com/rtabulov/rank-tracker/issues/74)  
**Map:** RS auto-fill / desktop companion (Option K in [the-finals-rs-auto-fill-alternatives.md](./the-finals-rs-auto-fill-alternatives.md))  
**Research date:** **2026-08-26**  
**Scope:** Whether authenticated game-client HTTPS responses for `v1-discovery-roundstats`, `v1-discovery-roundstatsummary`, and/or `v1-shared-profile` contain a **stable integer Rank Score (RS)** suitable for auto-fill — and when those responses are emitted in the player flow.

**Live TLS capture:** **Not obtained** in this research pass (no THE FINALS session). Findings below are from checked-in handlers, TypeScript schemas, a Season‑1-era mock fixture, an Oct‑2023 Unreal SDK dump, and related vault-export parsers. Anything that requires a 2026 live decrypted JSON sample remains explicitly unverified.

---

## Confidence summary

| Claim                                                                                                                | Confidence                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `v1-shared-profile` has **no** RS / fame / score integer in documented schemas                                       | **High**                                                                                                                    |
| `v1-discovery-roundstats` (HTTP discovery shape) has **no** RS / fame integer                                        | **High** (SDK + tracker types + mock; vault `RoundStat.FameAmount` is a **different** persistence/export shape)             |
| `v1-discovery-roundstatsummary` historically exposes integer **`highestFameAmount`** (peak, per casual/ranked/total) | **High** for ~2023–early‑2024 schema; **Low** that the **current** live field is still named that and equals **current** RS |
| `highestFameAmount` is suitable as **stable current RS** for auto-fill                                               | **Low** — name = peak; Season 1 “Fame” ≠ modern RS; mock fixture is all zeros; no live 2026 sample                          |
| Exact player-flow trigger (Leagues menu vs post-match vs career) for each path                                       | **Unverified** without live capture                                                                                         |
| No public sample of non-zero discovery RS/`highestFameAmount` exists in the extractor/tracker repos                  | **High**                                                                                                                    |

### Direct answer (per endpoint)

| Endpoint                            | Stable current RS integer?        | Candidate field(s)                                                           | When emitted?                                                                     |
| ----------------------------------- | --------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **`v1-shared-profile`**             | **No**                            | None (identity only: `displayName`, `thirdPartyLastSeenAccountName`, …)      | Unverified beyond “while game is online”; captured as part of extractor whitelist |
| **`v1-discovery-roundstats`**       | **No** (in discovery HTTP schema) | None in `FApiGatewayDiscoveryRoundStats` / tracker `DiscoveryRoundStats`     | Unverified; shape is per-round match history                                      |
| **`v1-discovery-roundstatsummary`** | **Partial / historical only**     | `highestFameAmount` (`number` / `int64`) under `casual` / `ranked` / `total` | Unverified; career aggregate summary                                              |

**Bottom line for companion auto-fill:** Do **not** treat these three whitelisted paths as a proven source of **current** Rank Score. The only fame-related field proven in primary schemas is **`highestFameAmount`** on the summary endpoint — a **peak** Season‑1-era metric, not a documented modern `rankScore`. Confirm or refute with a live capture before productizing.

---

## Summary table (primary evidence only)

| Source                                             | What it proves                                                                                                                                         | RS / fame field?                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Extractor `config.ini` whitelist                   | Client traffic for those three path keys is intentionally captured                                                                                     | Paths only                                                                                                                             |
| Extractor `util/fs.py`                             | Profile handler keeps **only** `embarkName` + `steamName`; roundstats stored as full JSON with **no** RS parsing                                       | No RS extraction                                                                                                                       |
| Tracker `GameStatsJsonV1.ts`                       | Typed consumer schema for the three keys                                                                                                               | Summary: `highestFameAmount`; profile/roundstats: no score                                                                             |
| Tracker `mockedGameStats.json`                     | Fixture with real-looking round IDs/timestamps (~Dec 2023)                                                                                             | `highestFameAmount: 0` for casual, ranked, **and** total                                                                               |
| SDK dump `EmbarkApiGateway_structs.hpp` (Oct 2023) | UE reflection of gateway structs for discovery round stats / summary / shared profile                                                                  | Summary: `HighestFameAmount`; roundstats/profile: none; separate `GetTotalFameResponse.TotalFame` exists **outside** these three paths |
| TF-Clubweb vault model                             | GDPR/export `RoundStatSummary` treats `HighestFameAmount` as a **peak** (max across epochs); per-round export `FameAmount` exists on vault `RoundStat` | Same peak semantics; not live HTTP proof for 2026                                                                                      |
| Embark FAQ 117                                     | Official name of the ladder integer is **Rank Score (RS)**                                                                                             | Product term; not a discovery JSON schema                                                                                              |
| Embark design note (May 2024)                      | Season 1 visible points were **Fame**; Season 2+ moved off that fame system                                                                            | Supports treating `highestFameAmount` as historical naming                                                                             |

---

## Endpoint detail

### `v1-shared-profile` — **No RS**

**Extractor behavior** ([`util/fs.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/fs.py)):

```python
def handle_profile_data(data):
    return {
        "embarkName": data["displayName"]["name"] + data["displayName"]["discriminator"],
        "steamName": data["thirdPartyLastSeenAccountName"]
    }
```

**Tracker typed import** after extraction ([`GameStatsJsonV1.ts`](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/util/mapGameStats/models/gameStatsJson/GameStatsJsonV1.ts)):

```ts
export interface SharedProfile {
  embarkName: string;
  steamName: string;
}
```

**SDK struct** `FApiGatewaySharedProfile` ([`EmbarkApiGateway_structs.hpp`](https://github.com/Dear-Tom/Discovery-SDK-Dump/blob/master/SDK/EmbarkApiGateway_structs.hpp)): tenancy/account ids, `DisplayName`, email fields, `ThirdPartyUserId`, `ThirdPartyLastSeenAccountName`, `TosVersionSeen` — **no** fame, RS, league, or score member.

**Verdict:** Suitable for identity auto-fill (`Name#####` / platform name), **not** RS.

---

### `v1-discovery-roundstats` — **No RS** (discovery HTTP shape)

**Tracker type** `DiscoveryRoundStats`: combat and round metadata only (`damageDone`, `kills`, `deaths`, `mapVariant`, `roundId`, `tournamentId`, win flags, timestamps, …) — **no** fame/RS ([same file](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/util/mapGameStats/models/gameStatsJson/GameStatsJsonV1.ts)).

**SDK struct** `FApiGatewayDiscoveryRoundStats`: same field set; **no** `FameAmount` / `RankScore` ([structs.hpp](https://github.com/Dear-Tom/Discovery-SDK-Dump/blob/master/SDK/EmbarkApiGateway_structs.hpp) around `ApiGatewayDiscoveryRoundStats`).

**Mock fixture** rounds match that shape; no score keys ([`mockedGameStats.json`](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/data/mockedGameStats.json)).

**Related but out of scope for this path:** Account-export / vault `RoundStat.Data.FameAmount` is used by [TF-Clubweb](https://github.com/S4N-T0S/TF-Clubweb/blob/main/src/vault/lib/model.js) (`fame: d.FameAmount || 0`). That is **persistence/export** data, not proven identical to the live `v1-discovery-roundstats` JSON body the extractor whitelists. The Oct‑2023 discovery HTTP struct dump does **not** include `FameAmount` on round stats.

**Verdict:** Not a source of current RS for the companion’s whitelisted capture.

---

### `v1-discovery-roundstatsummary` — **Historical peak fame only**

**Tracker type** `RoundStatSummary` includes:

```ts
highestFameAmount: number;
```

Buckets: `Record<GameMode, RoundStatSummary>` with `casual` | `ranked` | `total` ([`GameStatsJsonV1.ts`](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/util/mapGameStats/models/gameStatsJson/GameStatsJsonV1.ts)).

**SDK:** `FApiGatewayDiscoveryRoundStatSummary.HighestFameAmount` as `int64_t`; response wrapper `FApiGatewayDiscoveryGetRoundStatSummaryResponse` has `Casual` / `Ranked` / `Total` ([structs.hpp](https://github.com/Dear-Tom/Discovery-SDK-Dump/blob/master/SDK/EmbarkApiGateway_structs.hpp)).

**Mock fixture (only checked-in numeric sample):** all three buckets set `"highestFameAmount": 0` despite substantial ranked play in the same file (`roundsPlayed: 183` under `ranked`) ([`mockedGameStats.json`](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/data/mockedGameStats.json)). So the fixture proves the **key exists**, not that it carries a usable non-zero ladder score.

**Peak vs current:** TF-Clubweb’s vault aggregator documents the same field as a **peak**, not a counter:

> `HighestFameAmount` is a peak, not a counter → take the max across epochs.

([`model.js`](https://github.com/S4N-T0S/TF-Clubweb/blob/main/src/vault/lib/model.js))

**Naming vs modern RS:**

- Official product term today is **Rank Score (RS)** ([FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs), updated 2026-02-27).
- Embark’s own design write-up: Season 1 used visible **Fame** points; Season 2 dropped that fame system for a skill-points style ladder ([Ranked Leagues — reachthefinals.com](https://www.reachthefinals.com/patchnotes/ranked), 2024-05-02).
- Public leaderboards renamed S1 `fame` / field `f` → later seasons’ `rankScore` ([leonlarsson `season1.ts`](https://github.com/leonlarsson/the-finals-api/blob/main/src/schemas/leaderboards/season1.ts) vs [`season11.ts`](https://github.com/leonlarsson/the-finals-api/blob/main/src/schemas/leaderboards/season11.ts)). Discovery JSON may have followed; **no** primary live sample confirms `highestFameAmount` vs a renamed `highestRankScore` / `rankScore` on this path in 2026.

**Tracker UI note:** Overview “ranks” charts pull `fame` from a **separate** `api.finals-tracker.com` leaderboard API (`LeaderboardUser.fame`), **not** from `highestFameAmount` on imported discovery JSON ([`LeaderboardUser.ts`](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/sdk/finals-tracker/models/LeaderboardUser.ts), [`RanksChartCardStore.ts`](https://github.com/Swackles/the-finals-tracker/blob/master/src/pages/UserStatsV2/panels/overviewPanel/ranksChartCard/RanksChartCardStore.ts)). That undercuts treating discovery summary fame as the product’s canonical RS source even in the original stack.

**Verdict:** **Partial.** An integer ladder-related field **existed** (`highestFameAmount`), but it is **not** proven to be stable **current** RS under a modern name, and semantics lean **seasonal peak / Fame-era**. Unsuitable for auto-fill until a live capture shows a non-zero field that matches the in-game RS UI.

---

## Nearby gateway types (not in extractor whitelist)

The Oct‑2023 SDK dump also defines responses **outside** the three paths — useful so the companion does not overfit the whitelist:

| Struct                                     | Notable fields                       | Relevance                                               |
| ------------------------------------------ | ------------------------------------ | ------------------------------------------------------- |
| `FApiGatewayDiscoveryGetTotalFameResponse` | `TotalFame` (`int64`)                | Separate total-fame call; **not** captured by extractor |
| `FApiGatewayDiscoveryRank` / `…PlayerRank` | `TotalXP`, `CurrentRank`, `BucketId` | Progression/XP buckets, not proven = RS                 |
| `FApiGatewaySharedProfile`                 | Identity only                        | Matches profile analysis above                          |

None of these appear in [extractor `config.ini`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/config.ini). Live capture should log **all** Embark JSON paths first, then decide whether a non-whitelisted route carries current RS.

---

## When are the responses emitted?

| Evidence            | What it says                                                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extractor README    | Run capture → select NIC → **“Open up The Finals”** → wait until whitelisted Embark JSON is seen; no menu/step map ([readme](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/readme.md)) |
| Extractor filter    | tshark display filter: HTTP containing `x-embark-request-id` or `x-embark-trace-id` ([`util/tshark.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/tshark.py))                 |
| Path names / SDK    | Round **stats** / **summary** and **shared profile** — consistent with career/history and session identity refresh; **not** proof of Leagues-only or post-match-only                                        |
| Prior Option K note | Guessed “snapshot when user opens relevant in-game screens / finishes rounds” ([alternatives doc](./the-finals-rs-auto-fill-alternatives.md)) — still unverified                                            |

**Not established:** whether opening **Career → Leagues**, finishing a ranked match, opening match history, or merely reaching the main menu is necessary or sufficient for each of the three URIs.

---

## Proven vs unverified

### Proven from primary sources (no live game required)

1. Extractor intentionally listens for the three path keys.
2. Shared profile schema/handlers: **identity only**.
3. Discovery roundstats (HTTP/SDK/tracker): **no** score field.
4. Discovery roundstatsummary (HTTP/SDK/tracker): integer **`highestFameAmount`** (peak semantics in vault tooling).
5. No `rankScore` / `RankScore` / `rank_score` string appears in extractor or tracker discovery models.
6. Official ladder integer is called **RS**; Season 1 public/API naming used **fame**.

### Remains unverified without a live 2026 TLS capture

1. Current JSON property names on these paths (still `highestFameAmount`? renamed? removed?).
2. Non-zero values and equality to the RS shown in Leagues / post-match UI.
3. Whether `ranked.highestFameAmount` tracks **current** RS or **season peak** / stale Fame.
4. Exact UI actions that emit each request (and hostname/full URL).
5. Whether a **different** Embark path (e.g. total-fame / player-rank / leagues-specific) is the real RS carrier today.

---

## Minimum reproducible capture steps

Requires: Windows PC, THE FINALS, Wireshark/tshark, willingness to accept ToS/account risk ([companion ToS research](./the-finals-tls-capture-tos-enforcement.md)).

1. Set a user or launch-scoped `SSLKEYLOGFILE` to a writable path; fully exit and restart Steam + THE FINALS so the game process inherits it ([extractor SSLKEYLOG setup](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/readme.md); [installer research](./windows-installer-sslkeylogfile-npcap-automation.md)).
2. Install Wireshark (with Npcap). Prefer the extractor (`python main.py`, set `debug.save_raw = true` in `config.ini`) **or** raw tshark/Wireshark with the same SSL key log and an HTTP filter on Embark trace headers.
3. Start capture on the active NIC **before** launching or immediately after a clean game start.
4. In-game, perform discrete labeled actions while noting wall-clock time:
   - Idle on main menu (60s)
   - Open **Career / Leagues** (or equivalent ranked RS UI); screenshot the on-screen RS integer
   - Open match history / career stats
   - Complete (or leave) one ranked match and open the post-match summary
5. Stop capture. Decrypt TLS using the key log. Export JSON bodies whose request URI path contains:
   - `v1-discovery-roundstats`
   - `v1-discovery-roundstatsummary`
   - `v1-shared-profile`
   - and, for discovery, **any other** path whose body contains `rankScore`, `RankScore`, `fame`, `Fame`, `highestFame`, or league-like integers
6. Redact PII (email, tokens, account ids). Compare candidate integers to the screenshot RS.
7. Record: full URL host + path, action that preceded the packet, field name, value, and whether it matched UI RS.

Success criterion for auto-fill: a single integer field that (a) matches on-screen RS, (b) updates after ranked play, (c) appears under a stable key across ≥2 sessions.

---

## Claim → citation index

| Claim                                                               | Citation                                                                                                                                                                                                                               |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whitelisted capture paths                                           | [extractor `config.ini`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/config.ini)                                                                                                                                |
| Profile handler drops all but names                                 | [extractor `util/fs.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/fs.py)                                                                                                                                |
| Typed discovery/profile schemas incl. `highestFameAmount`           | [tracker `GameStatsJsonV1.ts`](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/util/mapGameStats/models/gameStatsJson/GameStatsJsonV1.ts)                                                                        |
| Mock summary fame values are `0`                                    | [tracker `mockedGameStats.json`](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/data/mockedGameStats.json)                                                                                                      |
| UE gateway structs for roundstats / summary / profile / `TotalFame` | [Dear-Tom/Discovery-SDK-Dump `EmbarkApiGateway_structs.hpp`](https://github.com/Dear-Tom/Discovery-SDK-Dump/blob/master/SDK/EmbarkApiGateway_structs.hpp) (repo pushed 2023-10-30)                                                     |
| `HighestFameAmount` = peak in vault exports                         | [TF-Clubweb `model.js`](https://github.com/S4N-T0S/TF-Clubweb/blob/main/src/vault/lib/model.js)                                                                                                                                        |
| Capture workflow (open game, SSLKEYLOG, tshark)                     | [extractor readme](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/readme.md)                                                                                                                                       |
| Official RS definition                                              | [FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)                                                                                                                                             |
| Season 1 Fame → later skill/RS systems                              | [Embark ranked design note](https://www.reachthefinals.com/patchnotes/ranked)                                                                                                                                                          |
| Leaderboard S1 `fame` vs S11 `rankScore`                            | [leonlarsson `season1.ts`](https://github.com/leonlarsson/the-finals-api/blob/main/src/schemas/leaderboards/season1.ts), [`season11.ts`](https://github.com/leonlarsson/the-finals-api/blob/main/src/schemas/leaderboards/season11.ts) |
| Prior Option K “unverified RS fields”                               | [the-finals-rs-auto-fill-alternatives.md](./the-finals-rs-auto-fill-alternatives.md)                                                                                                                                                   |
| ToS risk of TLS capture                                             | [the-finals-tls-capture-tos-enforcement.md](./the-finals-tls-capture-tos-enforcement.md)                                                                                                                                               |

---

## Suggested product implication

For a Windows companion aimed at **current RS auto-fill**, treat the three extractor-whitelisted endpoints as **unproven**. Ship capture instrumentation that:

1. Saves raw JSON for **all** Embark HTTP JSON responses (not only the whitelist).
2. Diffs field trees against `rankScore` / `fame` / `HighestFame*` / league payloads.
3. Only promotes a field to product once a live capture passes the success criterion above.

Until then, keep SPA auto-fill on public leaderboard `rankScore` (top 10k) and manual entry — consistent with [alternatives research](./the-finals-rs-auto-fill-alternatives.md).
