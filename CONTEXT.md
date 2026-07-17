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

**Season view**:
The main screen for one Season — Latest RS as the hero, a compact RS line, Season summary, and an Entry timeline (single-column; same structure on mobile). On the Current Season with 0 Entries: the hero shows an empty signal (not RS 0) plus a short “log first RS” line; sparkline and Season summary are omitted; the Entry timeline keeps its region with a short empty line; Log RS stays the primary CTA. That empty Current Season state is the first-run experience; v1 has no separate onboarding (no welcome, coach marks, Import nudge, or gated Log RS).
_Avoid_: Dashboard, home, history page, overview

**Current Season**:
The Season whose start/end window contains today's date; the Season view opens on it by default. Always navigable, including when it has 0 Entries. A ranked cutover does not auto-switch the selected Season while the session is open — the Player switches via the Season control or opens the app later on the new Current Season. If the selected Season becomes non-navigable (past Season with 0 Entries), the Season view snaps to Current Season.
_Avoid_: Active season, latest season, selected season

**Season summary**:
The aggregate figures for one Season on the Season view: Latest RS, Season high, Season low, Season net, Entry count, and Avg Δ per Entry; on the Current Season only, also Δ last 7 days and Days since last Entry.
_Avoid_: Stats bar, KPIs, metrics panel, overview cards

**Season net**:
Latest RS minus the first Entry's RS in that Season (signed; zero when the Season has a single Entry).
_Avoid_: Net change, season delta, total gain

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
