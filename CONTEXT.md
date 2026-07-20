# Rank Tracker

A personal Rank Score history for The Finals ranked play — log RS after tournaments and review it per season.

## Language

**Entry**:
A single recorded Rank Score (RS) value at a point in time (its recorded timestamp), typically after a ranked session. It belongs to the Season whose window contains that timestamp.
_Avoid_: Reading, log, datapoint, snapshot, match

**Season**:
A named ranked-play period with a known start and, once the next Season launches, a known end (e.g. Season 8). The Current Season may be open-ended until Embark publishes the next launch.
_Avoid_: Period, cycle, campaign, ranked cycle

**Rank Score (RS)**:
The player's current ranked progression value in The Finals; the number each Entry records and the chart axis for v1.
_Avoid_: MMR, ELO, rating, RP, league points

**Rank**:
The competitive standing derived from a Rank Score — league name plus sub-tier number, always shown uppercased (e.g. `GOLD 1`). Sub-tiers run 4 (lowest) through 1 (highest) within each league, matching The Finals. The ladder tops out at Diamond 1; Ruby (top-500 at season end) is not derived from RS alone.
_Avoid_: Rank name, league, tier, MMR bracket, division

**Season view**:
The main screen for one Season — retro-futurism HUD chrome: Latest RS as the neon hero with season-net line, a compact RS sparkline panel, Season summary as terminal label/value rows, and an Entry timeline newest-first with per-entry Δ (single-column; same structure on mobile). On the Current Season with 0 Entries: the hero shows an empty signal (not RS 0) plus a short “log first RS” line; sparkline and Season summary are omitted; the Entry timeline keeps its region with a short empty line; Log RS stays the primary sticky CTA. That empty Current Season state is the first-run experience; v1 has no separate onboarding (no welcome, coach marks, Import nudge, or gated Log RS).
_Avoid_: Dashboard, home, history page, overview

**Current Season**:
The Season whose start/end window contains today's date; the Season view opens on it by default. Always navigable, including when it has 0 Entries. A ranked cutover does not auto-switch the selected Season while the session is open — the Player switches via the Season control or opens the app later on the new Current Season. If the selected Season becomes non-navigable (past Season with 0 Entries), the Season view snaps to Current Season.
_Avoid_: Active season, latest season, selected season

**Season summary**:
The aggregate figures for one Season on the Season view: Latest RS, Season high, Season low, Season net, and Avg Δ per Entry; on the Current Season only, also Δ last 12 hours, Δ last 7 days, and Days since last Entry.
_Avoid_: Stats bar, KPIs, metrics panel, overview cards

**Season net**:
Latest RS minus the first Entry's RS in that Season (signed; zero when the Season has a single Entry).
_Avoid_: Net change, season delta, total gain

**Δ last 12 hours**:
On the Current Season, latest RS minus the RS of the last Entry at or before a rolling 12-hour cutoff from now (signed). Omitted when no such baseline Entry exists. Shown on the Season view hero (`/ 12H`) and in the Season summary.
_Avoid_: Net today, session net, 12h net, daily net

**Δ last 7 days**:
On the Current Season, latest RS minus the RS of the last Entry at or before a rolling 7-day cutoff from now (signed). Omitted when no such baseline Entry exists. Shown on the Season view hero (`/ 7D`) and in the Season summary.
_Avoid_: Weekly net, 7d net, week delta

**Local store**:
The on-device persistence holding the player's Entries and related v1 data.
_Avoid_: Database, vault, profile, save file, account

**Export**:
A JSON file that is a full dump of the Local store (same document shape) for backup or transfer.
_Avoid_: Backup, sync, download, save

**Import**:
Replacing the Local store from an Export JSON file (or failing with the store unchanged).
_Avoid_: Restore, sync, upload, load, merge

**Player**:
The person whose Rank Score history this Local store represents.
_Avoid_: User, account holder, member

**Display name**:
The Player's chosen public handle, unique among signed-in Players; required before cloud sync. Format is URL-safe (letters, numbers, underscores, hyphens; length-bounded) and immutable once set.
_Avoid_: Username, handle, nickname, gamertag

**Public Season view**:
A read-only Season view of another Player's synced Entries, reached via their Public link. Same Season-view shape as the owner's (hero, sparkline, Season summary, Entry timeline, Season browsing); no Log RS, Import/Export, or edit. Opt-in only. Visitor identity is a Viewing strip (label + Display name) under the app header — brand stays Rank Tracker. On Current Season with 0 Entries: same empty chrome as the owner (hero empty signal, omitted sparkline/summary, timeline region kept) with visitor copy (“No RS logged yet.” / “No Entries yet.”) and an inline “Track your own RS” link (not a sticky Log RS stand-in). Past Seasons with 0 Entries are non-navigable (snap to Current Season), same as the owner.
_Avoid_: Profile, public profile, shared dashboard, spectator view

**Public link**:
The shareable URL for a Player's Public Season view, keyed by Display name (`/p/{displayName}`). Opt-in “public” means anyone with the link can open it — not search-engine discoverable: `/p/*` stays noindex / unlisted (no sitemap entries), whether the Display name is public, private, or unknown. In account settings, a Public/Private toggle and copy control sit on the Display name row; the path shows when public. Unknown or private Display names are indistinguishable to a visitor: one dedicated unavailable state in the app shell (not Season-view chrome) — “Public Season view unavailable” / “This Public link isn’t available.” — plus a “Track your own RS” button (same light path, not Season-view chrome).
_Avoid_: Profile URL, share URL, vanity URL, handle link
