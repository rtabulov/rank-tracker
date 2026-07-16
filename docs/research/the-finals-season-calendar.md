# THE FINALS ranked season calendar (research)

**Confidence:** High for **live Season 1–11 calendar dates** (official patch-note `YYYY.MM.DD` stamps + Embark Steam “is live” posts); **medium** for most **UTC clock times** (Steam publish times / one announced CET ranked cutover); **low / open** for **Season 11 end** and for treating “Season 0” as a single ranked season.

Research date context: **2026-07-16** — Season 11 (Galaxy Masters) is current; end date not announced by Embark.

---

## Season table (recommended for timestamp → season)

**Season boundary model:** Treat seasons as half-open intervals `[start, end)` where **end of season N = start of season N+1** (ranked reset / new season go-live). Embark documents that Rank Score is recalculated **at the start of a new season** ([Ranked Cashout: Rank Score (RS)](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)).

| Season | Title (official)                       | Start (UTC where known)                                                                                                                    | End (UTC where known)                                           | Confidence                                       | Primary source URL(s)                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0**  | Pre-launch betas (not one live season) | See [Season 0 note](#season-0-pre-launch--not-a-single-live-ranked-season)                                                                 | —                                                               | Low (fragmented)                                 | [Business Wire CB1](https://www.businesswire.com/news/home/20230223005976/en/Embark-Studios-THE-FINALS-Begins-a-Global-Closed-Beta-Test-March-7); Steam [Open Beta starting Oct 26](https://store.steampowered.com/news/app/2073850/view/5229301621573079384); Steam [Open Beta has ended](https://store.steampowered.com/news/app/2073850/view/5288974951224359294)                        |
| **1**  | Season 1 (launch)                      | **≈ 2023-12-08 ~04:20 UTC** (Steam “THE ARENA IS OPEN”); calendar date often cited as **2023-12-07** (Game Awards shadow drop, US evening) | **= Season 2 start**                                            | High (date); Medium (clock)                      | [Release Patch Notes 1.2.0](https://www.reachthefinals.com/patchnotes/120) (`2023.12.08`); Steam [THE ARENA IS OPEN](https://store.steampowered.com/news/app/2073850/view/5395938616796737838) (`2023-12-08T04:19:48Z`); [Nexon / Games Press](https://www.gamespress.com/en-US/THE-FINALS-From-Nexons-Embark-Studios-is-Available-Now-Worldwide)                                           |
| **2**  | Season 2                               | **2024-03-14** (~09:39 UTC Steam live)                                                                                                     | **= Season 3 start**                                            | High (date); Medium (clock)                      | [Update 2.0.0](https://www.reachthefinals.com/patchnotes/200) (`2024.03.14`); Steam [Welcome to Season 2!](https://store.steampowered.com/news/app/2073850/view/7309977427434312431) (`2024-03-14T09:39:20Z`)                                                                                                                                                                               |
| **3**  | Season 3                               | **2024-06-13** (~12:15 UTC Steam live)                                                                                                     | **= Season 4 start**                                            | High (date); Medium (clock)                      | [Update 3.0.0](https://www.reachthefinals.com/patchnotes/300) (`2024.06.13`); Steam [Welcome to Season 3!](https://store.steampowered.com/news/app/2073850/view/6890025005348770720) (`2024-06-13T12:15:37Z`); pre-announce Steam [Season 3 arrives on June 13](https://store.steampowered.com/news/app/2073850/view/) (title confirmed via API `2024-06-07`)                               |
| **4**  | Season 4 — “IT’S SHOWTIME!”            | **2024-09-26** (~09:02 UTC Steam live)                                                                                                     | **2024-12-12 07:30 UTC** (= 08:30 CET; **official ranked end**) | High (date + ranked clock)                       | [Update 4.0.0](https://www.reachthefinals.com/patchnotes/400) (`2024.09.26`); Steam [Season 4 - IT'S SHOWTIME!](https://store.steampowered.com/news/app/2073850/view/6339469370181367965) (`2024-09-26T09:02:44Z`); **[Update 4.10.0](https://www.reachthefinals.com/patchnotes/4100)** — “ranked season will end at 8:30 a.m. CET on Thursday the 12th of December”                        |
| **5**  | Season 5 — “NEXT STAGE”                | **2024-12-12** (ranked cutover **07:30 UTC** per S4 end; Steam “live” ~10:35 UTC)                                                          | **= Season 6 start**                                            | High (date); High for ranked cutover via S4 note | [SEASON 5](https://www.reachthefinals.com/patchnotes/500) (`2024.12.12`); Steam [Season 5 - NEXT STAGE!](https://store.steampowered.com/news/app/2073850/view/1785774543521351) (`2024-12-12T10:35:51Z`); abutting [Update 4.10.0](https://www.reachthefinals.com/patchnotes/4100)                                                                                                          |
| **6**  | Season 6 — “RISING STARS”              | **2025-03-20** (~10:37 UTC Steam live)                                                                                                     | **= Season 7 start**                                            | High (date); Medium (clock)                      | [Welcome to Season 6](https://www.reachthefinals.com/patchnotes/600) (`2025.03.20`); Steam [Season 6 - RISING STARS!](https://store.steampowered.com/news/app/2073850/view/1794102528298144) (`2025-03-20T10:37:56Z`)                                                                                                                                                                       |
| **7**  | Season 7 — “THE DIVIDE”                | **2025-06-12** (~10:03 UTC Steam live)                                                                                                     | **= Season 8 start**                                            | High (date); Medium (clock)                      | [Welcome to Season 7](https://www.reachthefinals.com/patchnotes/700) (`2025.06.12`); Steam [Season 7 - THE DIVIDE](https://store.steampowered.com/news/app/2073850/view/1802354289558019) (`2025-06-12T10:03:08Z`)                                                                                                                                                                          |
| **8**  | Season 8 — “GAME TIME”                 | **2025-09-10** (~15:49 UTC Steam live)                                                                                                     | **= Season 9 start**                                            | High (date); Medium (clock)                      | [SEASON 8 \| GAME TIME](https://www.reachthefinals.com/patchnotes/800) (`2025.09.10`); Steam [Season 8 is LIVE!](https://store.steampowered.com/news/app/2073850/view/1810503566387424) (`2025-09-10T15:49:49Z`)                                                                                                                                                                            |
| **9**  | Season 9 — “Dragon rising”             | **2025-12-10** (~16:05 UTC Steam live)                                                                                                     | **= Season 10 start**                                           | High (date); Medium (clock)                      | [SEASON 9 \| Dragon rising](https://www.reachthefinals.com/patchnotes/900) (`2025.12.10`); Steam [Season 9 is LIVE!](https://store.steampowered.com/news/app/2073850/view/1818752592121193) (`2025-12-10T16:05:12Z`)                                                                                                                                                                        |
| **10** | Season 10 — “FANTASY LEAGUE”           | **2026-03-26 13:30 UTC** (announced 14:30 CET / 09:30 ET); Steam “live” ~14:01 UTC                                                         | **= Season 11 start**                                           | High (date + announced clock)                    | [SEASON 10 \| FANTASY LEAGUE](https://www.reachthefinals.com/patchnotes/10-00) (`2026.03.26`); Steam [Season 10 Reveal & Launch](https://store.steampowered.com/news/app/2073850/view/1827626365750859) — “On March 26 2:30 PM CET / 9:30 AM ET”; Steam [Season 10 Fantasy League is live!](https://store.steampowered.com/news/app/2073850/view/1827626365770595) (`2026-03-26T14:01:10Z`) |
| **11** | Season 11 — “GALAXY MASTERS”           | **2026-07-09 ~13:01 UTC** (Steam live; date stamped on patch notes)                                                                        | **TBC / open-ended** (no Embark end date as of 2026-07-16)      | High (start date); Medium (clock); End = none    | [SEASON 11 \| GALAXY MASTERS](https://www.reachthefinals.com/patchnotes/11-00) (`2026.07.09`); [Help Center patch notes (same content)](https://id.embark.games/support/faq/49-patch-notes); Steam [Launch into Season 11](https://store.steampowered.com/news/app/2073850/view/1836506165583333) (`2026-07-09T13:01:22Z`)                                                                  |

### Compact abutting UTC bounds (app-ready draft)

Use these as a practical default for live seasons. Times marked `≈` are Steam announcement publish times (proxy for go-live), not a separate Embark “ranked ends at” statement—except Season 4→5 and Season 10 start.

| Season | `start_utc`                                     | `end_utc`                              |
| ------ | ----------------------------------------------- | -------------------------------------- |
| 1      | `2023-12-08T04:19:48Z` ≈                        | `2024-03-14T09:39:20Z` ≈               |
| 2      | `2024-03-14T09:39:20Z` ≈                        | `2024-06-13T12:15:37Z` ≈               |
| 3      | `2024-06-13T12:15:37Z` ≈                        | `2024-09-26T09:02:44Z` ≈               |
| 4      | `2024-09-26T09:02:44Z` ≈                        | `2024-12-12T07:30:00Z` **(official)**  |
| 5      | `2024-12-12T07:30:00Z` **(from S4 ranked end)** | `2025-03-20T10:37:56Z` ≈               |
| 6      | `2025-03-20T10:37:56Z` ≈                        | `2025-06-12T10:03:08Z` ≈               |
| 7      | `2025-06-12T10:03:08Z` ≈                        | `2025-09-10T15:49:49Z` ≈               |
| 8      | `2025-09-10T15:49:49Z` ≈                        | `2025-12-10T16:05:12Z` ≈               |
| 9      | `2025-12-10T16:05:12Z` ≈                        | `2026-03-26T13:30:00Z` **(announced)** |
| 10     | `2026-03-26T13:30:00Z` **(announced)**          | `2026-07-09T13:01:22Z` ≈               |
| 11     | `2026-07-09T13:01:22Z` ≈                        | `null` (open)                          |

---

## Notes

### Methodology

1. **Lead map:** Community wiki [Seasons](https://www.thefinals.wiki/wiki/Seasons) and [seasontimer.live](https://seasontimer.live/thefinals/) used only to discover candidates—not as authority.
2. **Primary date stamp:** Each live season launch page on [reachthefinals.com/patchnotes](https://www.reachthefinals.com/patchnotes/tag/season+launch) carries an official `YYYY.MM.DD` date (and often a human-readable month/day).
3. **Primary “is live” clock proxy:** Embark Steam Community announcements for app `2073850`, via Steam Web API `ISteamNews/GetNewsForApp` (Unix `date` → UTC). These are **publish timestamps**, typically minutes–hours after maintenance/go-live—not an in-game ranked timer.
4. **Stronger clock evidence (rare):**
   - Season 4 ranked end: explicit CET time in [Update 4.10.0](https://www.reachthefinals.com/patchnotes/4100).
   - Season 10 start: explicit CET/ET in Steam [Season 10 Reveal & Launch](https://store.steampowered.com/news/app/2073850/view/1827626365750859).
5. **Help Center:** Confirms end-of-season RS recalculation behavior ([FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)); Season 11 content mirrored at [FAQ patch notes](https://id.embark.games/support/faq/49-patch-notes). No full historical season calendar was found on Help Center.

### What “season end” means (ranked)

For this tracker, **season end = ranked season cutover / new season start**, not “Battle Pass store close” or a mid-season “XP until end of season” promo line.

- Embark: RS is recalculated **at the start of a new season** ([FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)).
- Explicit ranked wording exists for Season 4→5: “the ranked season will end at 8:30 a.m. CET on Thursday the 12th of December” ([Update 4.10.0](https://www.reachthefinals.com/patchnotes/4100)).
- **Assumption for other seasons:** previous season ends when the next season’s launch patch goes live (abutting). No contradictory primary source found for Seasons 1–3 or 5–11.

### Open-ended current season

As of **2026-07-16**, Season 11 has **no Embark-published end date**. Secondary sites estimate ~October 2026 (e.g. seasontimer “~October 10, 2026”)—**do not use for production season assignment** until Embark announces.

### Season 0 (pre-launch) — not a single live ranked season

The wiki row “Season 0: March 7 2023 – November 5 2023” **collapses separate betas** and should not be used as one Rank Score season.

| Period        | Window                                                                   | Primary                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Closed Beta 1 | Starts **2023-03-07** (~2 weeks; Business Wire)                          | [Business Wire](https://www.businesswire.com/news/home/20230223005976/en/Embark-Studios-THE-FINALS-Begins-a-Global-Closed-Beta-Test-March-7)                                                                          |
| Open Beta     | Starts **2023-10-26**; Embark Steam “Open Beta has ended” **2023-11-07** | Steam [Join … starting October 26th](https://store.steampowered.com/news/app/2073850/view/5229301621573079384); Steam [Open Beta has ended](https://store.steampowered.com/news/app/2073850/view/5288974951224359294) |

Live service Season 1 begins at full launch (Dec 2023).

### Secondary / estimate (do not treat as primary)

| Claim                                     | Source                                                            | Status                                                                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full season date table S0–S11             | [thefinals.wiki/Seasons](https://www.thefinals.wiki/wiki/Seasons) | Useful lead map; dates largely match primary for S1–S11 starts; S0 window misleading; S11 end “October 2026 (TBC)” unverified                                         |
| S11 end ≈ 2026-10-10; S11 start 13:00 UTC | [seasontimer.live](https://seasontimer.live/thefinals/)           | Secondary estimate; S11 end **not** Embark-confirmed. (Also incorrectly described S10 ending 2026-06-21 in page copy—contradicted by official S11 2026-07-09 launch.) |
| S10 end 2026-07-09                        | Community blogs                                                   | Only valid under abutting model (= S11 start); not a separate Embark “ranked ends at …” post found                                                                    |

---

## Gaps / unverified dates

1. **Exact UTC ranked reset** for Seasons **1–3, 5–9, 11 start** — no “ranked season will end at …” primary quote found (except S4→S5). Steam times are proxies.
2. **Season 11 end** — **TBC**; no primary source.
3. **Season 1 local clock** — TGA shadow drop is **2023-12-07** in many press pieces; Embark patch stamp / Steam post are **2023-12-08**. Prefer Steam UTC for ordering; note calendar-date ambiguity for US evening launches.
4. **Season 0** — not one continuous ranked season; beta RS not continuous with live ladder.
5. **Maintenance downtime** between seasons — unknown duration; Steam “is live” can lag the ranked cutover (S5 Steam post is ~3h after the announced 08:30 CET ranked end).
6. **In-game season timer** — Embark references it ([Update 4.10.0](https://www.reachthefinals.com/patchnotes/4100)) but values are not archived in Help Center; cannot backfill from that alone.
7. **Discord-only announcements** — not systematically archived here; may contain additional CET/ET cutover times for later seasons.

---

## Claim → citation index

| Claim                                                       | Citation                                                                                                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live seasons launch with dated official patch notes S1–S11  | [season launch tag](https://www.reachthefinals.com/patchnotes/tag/season+launch); individual URLs in table                                                          |
| Season 1 opens with launch patch dated 2023.12.08           | [patchnotes/120](https://www.reachthefinals.com/patchnotes/120)                                                                                                     |
| Season 2 starts 2024.03.14                                  | [patchnotes/200](https://www.reachthefinals.com/patchnotes/200)                                                                                                     |
| Season 3 starts 2024.06.13                                  | [patchnotes/300](https://www.reachthefinals.com/patchnotes/300)                                                                                                     |
| Season 4 starts 2024.09.26                                  | [patchnotes/400](https://www.reachthefinals.com/patchnotes/400)                                                                                                     |
| Season 4 ranked ends 2024-12-12 08:30 CET                   | [patchnotes/4100](https://www.reachthefinals.com/patchnotes/4100)                                                                                                   |
| Season 5 starts 2024.12.12                                  | [patchnotes/500](https://www.reachthefinals.com/patchnotes/500)                                                                                                     |
| Season 6 starts 2025.03.20                                  | [patchnotes/600](https://www.reachthefinals.com/patchnotes/600)                                                                                                     |
| Season 7 starts 2025.06.12                                  | [patchnotes/700](https://www.reachthefinals.com/patchnotes/700)                                                                                                     |
| Season 8 starts 2025.09.10                                  | [patchnotes/800](https://www.reachthefinals.com/patchnotes/800)                                                                                                     |
| Season 9 starts 2025.12.10                                  | [patchnotes/900](https://www.reachthefinals.com/patchnotes/900)                                                                                                     |
| Season 10 starts 2026.03.26; announced 14:30 CET / 09:30 ET | [patchnotes/10-00](https://www.reachthefinals.com/patchnotes/10-00); Steam [Reveal & Launch](https://store.steampowered.com/news/app/2073850/view/1827626365750859) |
| Season 11 starts 2026.07.09; current as of research         | [patchnotes/11-00](https://www.reachthefinals.com/patchnotes/11-00); [Help Center](https://id.embark.games/support/faq/49-patch-notes)                              |
| RS recalculated at new season start                         | [FAQ 117](https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs)                                                                          |
| Steam UTC proxies for “is live” posts                       | Steam Web API news for app `2073850` (gids linked in table)                                                                                                         |
| Closed Beta 1 starts 2023-03-07                             | [Business Wire](https://www.businesswire.com/news/home/20230223005976/en/Embark-Studios-THE-FINALS-Begins-a-Global-Closed-Beta-Test-March-7)                        |
| Open Beta Oct 26 – ended by 2023-11-07 Steam post           | Steam news gids `5229301621573079384`, `5288974951224359294`                                                                                                        |

---

## Suggested app usage

1. Assign a logged RS entry with timestamp `t` to season `N` iff `start_N ≤ t < end_N` (half-open).
2. Prefer **announced ranked cutovers** over Steam publish times when both exist (today: S4→S5, S10 start).
3. Keep Season 11 `end = null` until Embark publishes an end time; do not hardcode secondary October estimates.
4. Optionally store a `confidence` flag per boundary (`official_ranked_time` | `announced_launch_time` | `steam_publish_proxy` | `date_only`).
