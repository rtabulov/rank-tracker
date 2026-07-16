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
The main screen for one Season — RS line chart, Season summary, and Entry list.
_Avoid_: Dashboard, home, history page, overview

**Current Season**:
The Season whose start/end window contains today's date; the Season view opens on it by default.
_Avoid_: Active season, latest season, selected season

**Season summary**:
The aggregate figures for one Season shown on the Season view (which figures are specified separately).
_Avoid_: Stats bar, KPIs, metrics panel, overview cards

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
