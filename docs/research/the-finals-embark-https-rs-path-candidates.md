# Embark game-client HTTPS — Rank Score (RS) path / field candidates (research)

**Ticket:** [Wayfinder #107](https://github.com/rtabulov/rank-tracker/issues/107)  
**Map:** [Wayfinder #73 — RS capture companion (Option C)](https://github.com/rtabulov/rank-tracker/issues/73)  
**Depends on / extends:** [#74 discovery RS fields](https://github.com/rtabulov/rank-tracker/issues/74) → `research/discovery-rs-fields` / [the-finals-discovery-rs-fields.md](./the-finals-discovery-rs-fields.md); Option K notes in [the-finals-rs-auto-fill-alternatives.md](./the-finals-rs-auto-fill-alternatives.md)  
**Feeds:** live TLS capture ticket **#106** (filter list below)  
**Research date:** **2026-08-26**  
**Scope:** Beyond the extractor whitelist (`v1-discovery-roundstats`, `v1-discovery-roundstatsummary`, `v1-shared-profile`), which Embark **game-client HTTPS** paths / response fields are the strongest **primary-source** candidates for **current** integer Rank Score (RS), and what should a live TLS capture prioritize?

**Live TLS capture:** **Not performed** here (ticket #106). Findings are from SDK dumps, extractor/tracker schemas, GDPR vault parsers, and public leaderboard schemas only.

---

## Confidence summary

| Claim                                                                                                                                                                              | Confidence                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Extractor whitelist paths are **not** proven sources of **current** RS (#74)                                                                                                       | **High**                                                                          |
| Extractor request keys are derived as `path.replace("/", "-")[1:]` from full HTTPS URI (so SDK method names can be mapped to likely keys)                                          | **High**                                                                          |
| Strongest **modern** RS field names in Embark-owned persistence are `rankPoints` (+ `leagueRankIndex`) on `IVKRanked*` BucketObject JSON — not `highestFameAmount` / Season‑1 Fame | **High** (vault schema); **Low** that the same JSON rides a known live HTTPS path |
| SDK `GetTotalFameResponse.TotalFame` is a dedicated `int64` fame total **outside** the whitelist — best **named** gateway candidate from the Oct‑2023 dump                         | **Medium** (struct exists); **Low** that it equals 2026 Leagues RS                |
| Exact 2026 host + path that returns current RS                                                                                                                                     | **Unverified** until live capture                                                 |

**Bottom line for #106:** Do **not** hunt primarily inside the three whitelist keys. Prioritize (1) body substrings for modern ladder fields (`rankPoints` / `rankScore` / `IVKRanked*` / `leagueRankIndex`), then (2) inferred discovery paths for **totalfame** / **inventory**, while still recording **all** Embark JSON (`x-embark-*` headers) so unknown rating/bucket routes are not dropped.

---

## Path-key convention (how to read candidates)

Swackles extractor turns a response URI into a storage key:

```python
def get_request_key(url):
    return get_path(url).replace("/", "-")[1:]
```

([`util/analyse_packet.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/analyse_packet.py))

Proven examples:

| HTTPS path (reconstructed)       | Extractor key                   |
| -------------------------------- | ------------------------------- |
| `/v1/discovery/roundstats`       | `v1-discovery-roundstats`       |
| `/v1/discovery/roundstatsummary` | `v1-discovery-roundstatsummary` |
| `/v1/shared/profile`             | `v1-shared-profile`             |

Therefore an SDK response named `ApiGatewayDiscoveryGetTotalFameResponse` is a **strong naming-convention candidate** for `/v1/discovery/totalfame` → key `v1-discovery-totalfame`. That inference is **not** confirmed by a live URI string in any checked-in dump (SDK dump is UE reflection structs only; no URL string table).

Embark traffic is detected by headers `x-embark-request-id` / `x-embark-trace-id`, not by a hardcoded host ([`util/tshark.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/tshark.py)). Host pattern in the extractor regex is `https://[a-z.-]+/...` — prior research noted public probes of `api.embark.games` / `discovery.embark.games` returned nothing usable from outside the game client ([alternatives doc gaps](./the-finals-rs-auto-fill-alternatives.md)).

---

## Prioritized candidate table

| Priority | Path / key (or RPC name)                                                                                             | Suspected RS field(s)                                                                                                            | Evidence                                                                                                     | Primary source                                                                                                                                                                                                                                                                                                    | Notes                                                                                                                                                                                                                                                                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**    | **Unknown live path** carrying ranked rating / bucket payload (body-first)                                           | `rankPoints` (integer); also `leagueRankIndex`, `highestLeagueRankIndex`; ratingId `IVKRankedTournamentRating*` (current season) | **High** for field semantics; **Low** for path                                                               | [TF-Clubweb `ratings.js`](https://github.com/S4N-T0S/TF-Clubweb/blob/main/src/vault/lib/ratings.js); [`sampleData.js` BucketObject builder](https://github.com/S4N-T0S/TF-Clubweb/blob/main/src/vault/lib/sampleData.js)                                                                                          | GDPR **persistence** `BucketObject` JSON: “for ranked these carry the league rank + RankPoints you actually saw in-game (`rankPoints = mu*10`)”. S3+ IVK ladder; S11 sample uses `IVKRankedTournamentRating5`. **Not** present as named structs in the Oct‑2023 API gateway dump (pre‑IVK). Highest value for live capture: filter bodies for these strings regardless of path. |
| **2**    | **`v1-discovery-totalfame`** (inferred) · SDK `GetTotalFame` / `FApiGatewayDiscoveryGetTotalFameResponse`            | `totalFame` / `TotalFame` (`int64`)                                                                                              | **Medium** path inference; **Low–medium** = current RS                                                       | [Dear-Tom/Discovery-SDK-Dump `EmbarkApiGateway_structs.hpp`](https://github.com/Dear-Tom/Discovery-SDK-Dump/blob/master/SDK/EmbarkApiGateway_structs.hpp) (commit `71fefdf`, **2023-10-30**)                                                                                                                      | Only gateway response whose sole payload is a fame integer. Outside extractor whitelist ([#74 nearby types](./the-finals-discovery-rs-fields.md)). Risk: Season‑1 **Fame** naming vs modern **RS** ([Embark ranked design note](https://www.reachthefinals.com/patchnotes/ranked); [FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)). |
| **3**    | **`v1-discovery-inventory`** (inferred) · `FApiGatewayDiscoveryGetInventoryResponse`                                 | `fame.amount` (`Fame.Amount` on `ApiGatewayDiscoveryPlayerPersistenceFame`)                                                      | **Medium** path inference; **Low** = RS                                                                      | Same SDK structs.hpp                                                                                                                                                                                                                                                                                              | Inventory embeds a Fame **game asset** (`InstanceId`, `GameAssetId`, `Amount`) alongside currencies/items — looks like owned currency balance, not the ranked ladder. Still worth one capture pass when opening inventory / career.                                                                                                                                             |
| **4**    | Any path whose body contains public ladder names                                                                     | `rankScore` (community / SSR name); Embark SSR field `5`                                                                         | **High** that `rankScore` means RS on **leaderboards**; **Low** that game-client discovery uses the same key | [leonlarsson `season11.ts`](https://github.com/leonlarsson/the-finals-api/blob/main/src/schemas/leaderboards/season11.ts); [FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)                                                                                             | Useful as a **body substring filter** and as a success criterion (match in-game UI). Client may instead use `rankPoints` / Fame-era names.                                                                                                                                                                                                                                      |
| **5**    | **`v1-shared-playerranks`** / similar (inferred) · `FApiGatewaySharedPlayerRanks` / `FApiGatewayDiscoveryPlayerRank` | `ranks[].totalXP`, `currentRank`, `bucketId`                                                                                     | **Medium** that path exists in some form; **Low** = RS                                                       | SDK structs.hpp (`ApiGatewayDiscoveryRank`, `ApiGatewaySharedPlayerRank`)                                                                                                                                                                                                                                         | XP / item-rank **buckets**, not documented as Rank Score. Capture once to rule out; do not promote without UI match.                                                                                                                                                                                                                                                            |
| **D1**   | `v1-discovery-roundstatsummary`                                                                                      | `ranked.highestFameAmount` (also casual/total)                                                                                   | **High** field exists historically; **Low** as **current** RS                                                | Tracker [`GameStatsJsonV1.ts`](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/util/mapGameStats/models/gameStatsJson/GameStatsJsonV1.ts); SDK `HighestFameAmount`; vault peak semantics in [TF-Clubweb `model.js`](https://github.com/S4N-T0S/TF-Clubweb/blob/main/src/vault/lib/model.js) | **Deprioritized** by #74: peak / Fame-era; mock fixture zeros. Keep in broad capture only for regression check.                                                                                                                                                                                                                                                                 |
| **D2**   | `v1-discovery-roundstats`                                                                                            | _(none for RS)_                                                                                                                  | **High** no RS in discovery HTTP schema                                                                      | SDK `ApiGatewayDiscoveryRoundStats`; tracker types                                                                                                                                                                                                                                                                | Match history only. Vault export `FameAmount` on RoundStat is a **different** shape ([#74](./the-finals-discovery-rs-fields.md)).                                                                                                                                                                                                                                               |
| **D3**   | `v1-shared-profile`                                                                                                  | _(none for RS)_                                                                                                                  | **High** identity only                                                                                       | Extractor [`fs.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/fs.py); SDK `ApiGatewaySharedProfile`                                                                                                                                                                                 | Useful for Embark name, not RS.                                                                                                                                                                                                                                                                                                                                                 |

### Deprioritized whitelist (explicit — do not treat as primary RS hunt)

Per [#74](https://github.com/rtabulov/rank-tracker/issues/74) / [discovery RS research](./the-finals-discovery-rs-fields.md):

1. **`v1-shared-profile`** — display name / third-party name only.
2. **`v1-discovery-roundstats`** — per-round combat/metadata; no RS in discovery HTTP/SDK types.
3. **`v1-discovery-roundstatsummary`** — only fame-related integer is **`highestFameAmount`** (peak / historical Fame naming), **not** proven current Rank Score.

Still include them in a **first** broad Embark JSON dump so #106 can confirm nothing new appeared under renamed keys — but they are **not** the priority targets for Option C auto-fill.

---

## Recommended live-capture filter list (#106)

Assumes `SSLKEYLOGFILE` + Wireshark/tshark as in the [extractor README](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/readme.md) and [installer research](./windows-installer-sslkeylogfile-npcap-automation.md). Respect ToS risk framing in [tls-capture research](./the-finals-tls-capture-tos-enforcement.md).

### Phase A — broad Embark HTTPS (do not drop unknown paths)

**tshark display filter (same spirit as extractor):**

```text
http && (http contains "x-embark-request-id" || http contains "x-embark-trace-id")
```

**Optional host tighten (after first session identifies hosts):**

```text
http.host contains "embark"
```

Save **all** `application/json` responses (extractor `debug.save_raw = true` pattern) keyed by full URI / request key.

### Phase B — path / URI substring priority (after decrypt)

Hunt / flag URIs whose path contains any of (case-insensitive), **in this order**:

| Tier                           | Substrings                                                                    | Why                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **P0**                         | `totalfame`, `fame`, `inventory`                                              | Maps to SDK GetTotalFame / inventory Fame structs                            |
| **P0**                         | `rating`, `ratings`, `bucket`, `ivk`, `openskill`, `league`, `ranked`         | Aligns with vault IVK / league RankPoints store; no Oct‑2023 path name known |
| **P1**                         | `rankscore`, `rankpoints`, `rank-score`, `rank_points`, `playerrank`, `ranks` | Ladder / rank naming                                                         |
| **P2**                         | `discovery`, `shared`                                                         | Namespace umbrella (noisy — use with body filters)                           |
| **P3 (deprioritized confirm)** | `roundstatsummary`, `roundstats`, `shared/profile` or `shared-profile`        | Whitelist regression only                                                    |

### Phase C — JSON body substring priority (strongest RS signal)

Scan decrypted bodies for (case-insensitive):

| Priority | Substring / key                                 | Expected meaning if present                     |
| -------- | ----------------------------------------------- | ----------------------------------------------- |
| **1**    | `rankPoints`                                    | Modern Rank Score in IVK ranked ratings (vault) |
| **1**    | `IVKRankedTournamentRating` / `IVKRankedRating` | Ranked ladder rating family                     |
| **1**    | `leagueRankIndex` / `highestLeagueRankIndex`    | League tier index alongside RS                  |
| **2**    | `rankScore` / `RankScore`                       | Public leaderboard / product naming             |
| **2**    | `totalFame` / `TotalFame`                       | GetTotalFameResponse                            |
| **3**    | `highestFameAmount` / `HighestFameAmount`       | Peak / summary only                             |
| **3**    | `FameAmount` / `"fame"` object with `amount`    | Round export / inventory Fame — verify ≠ UI RS  |

### Phase D — UI actions to time-correlate

While capturing, screenshot on-screen RS and note wall-clock times for:

1. Main menu idle
2. **Career → Leagues** (or current ranked RS screen)
3. Post-ranked-match summary
4. Inventory / career stats open

Success criterion (from #74): one integer field that matches UI RS, updates after ranked play, and is stable across ≥2 sessions.

### Example tshark one-liners (post-pcap decrypt)

```bash
# List Embark JSON response URIs
tshark -r capture.pcapng -o tls.keylog_file:ssl.log \
  -Y 'http && http.response && (http contains "x-embark-trace-id" || http contains "x-embark-request-id")' \
  -T fields -e http.response_for.uri -e http.content_type

# Narrow to high-interest path tokens (adjust after Phase A host discovery)
tshark -r capture.pcapng -o tls.keylog_file:ssl.log \
  -Y 'http.response_for.uri matches "(?i)(totalfame|inventory|rating|ivk|league|ranked|rankpoint|rankscore|fame)"'
```

Wireshark display filter equivalents: same `http contains "x-embark-…"` and `http.response_for.uri contains "totalfame"` (etc.).

---

## What remains unverified until live capture (#106)

1. Exact **hostname(s)** for discovery / shared API in 2026.
2. Whether **`/v1/discovery/totalfame`** (or rename) still exists and whether `TotalFame` equals Leagues RS.
3. Whether the client ever fetches **IVK `BucketObject` / `rankPoints`** over HTTPS (vs local/cache/other RPC).
4. Current JSON property names if Embark renamed Fame → RS on gateway responses.
5. Whether post-match or Leagues UI triggers a dedicated ranked endpoint absent from the 2023 SDK dump.

---

## Claim → citation index

| Claim                                                                                                              | Citation                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whitelist keys                                                                                                     | [extractor `config.ini`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/config.ini)                                                                                                                           |
| Path → key derivation; Embark header filter                                                                        | [extractor `analyse_packet.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/analyse_packet.py), [`tshark.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/tshark.py)      |
| Profile strips to names only                                                                                       | [extractor `fs.py`](https://github.com/Swackles/the-finals-tracker-extractor/blob/main/util/fs.py)                                                                                                                                |
| Tracker typed schemas (`highestFameAmount`, no RS on roundstats/profile)                                           | [tracker `GameStatsJsonV1.ts`](https://github.com/Swackles/the-finals-tracker/blob/master/src/common/util/mapGameStats/models/gameStatsJson/GameStatsJsonV1.ts)                                                                   |
| SDK: `GetTotalFameResponse.TotalFame`, inventory `Fame.Amount`, summary `HighestFameAmount`, PlayerRank XP buckets | [Dear-Tom/Discovery-SDK-Dump `EmbarkApiGateway_structs.hpp`](https://github.com/Dear-Tom/Discovery-SDK-Dump/blob/master/SDK/EmbarkApiGateway_structs.hpp) (pushed **2023-10-30**)                                                 |
| Whitelist ≠ proven current RS                                                                                      | [#74 research](./the-finals-discovery-rs-fields.md)                                                                                                                                                                               |
| `rankPoints` / IVK = in-game ranked ladder points                                                                  | [TF-Clubweb `ratings.js`](https://github.com/S4N-T0S/TF-Clubweb/blob/main/src/vault/lib/ratings.js); sample seasons through S11 in [`sampleData.js`](https://github.com/S4N-T0S/TF-Clubweb/blob/main/src/vault/lib/sampleData.js) |
| `HighestFameAmount` is a peak                                                                                      | [TF-Clubweb `model.js`](https://github.com/S4N-T0S/TF-Clubweb/blob/main/src/vault/lib/model.js)                                                                                                                                   |
| Official product term Rank Score (RS)                                                                              | [FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)                                                                                                                                        |
| Season 1 Fame → later ladder                                                                                       | [reachthefinals.com ranked design note](https://www.reachthefinals.com/patchnotes/ranked)                                                                                                                                         |
| Public leaderboard field `rankScore`                                                                               | [leonlarsson `season11.ts`](https://github.com/leonlarsson/the-finals-api/blob/main/src/schemas/leaderboards/season11.ts)                                                                                                         |
| Prior Option K / host gaps                                                                                         | [the-finals-rs-auto-fill-alternatives.md](./the-finals-rs-auto-fill-alternatives.md)                                                                                                                                              |

---

## Suggested next step

Run **#106** with Phase A → B → C filters above; promote a single path/field to companion product only after the UI-match success criterion. Until then, SPA auto-fill stays on public leaderboard `rankScore` (top 10k) + manual entry ([alternatives research](./the-finals-rs-auto-fill-alternatives.md)).
