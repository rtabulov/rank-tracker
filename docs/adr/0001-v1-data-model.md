# v1 data model: flat JSON Local store, derived Season

Entries are a flat list in `localStorage` as JSON; Season membership is derived from `recordedAt` against a static in-app Season table. Rejected IndexedDB/Dexie and Drizzle+WASM SQL for v1 — volume is tiny, Export/Import is already JSON, and browser SQL migrations are not first-class.

## Status

accepted

## Structures

### Entry

```ts
type Entry = {
  id: string; // nanoid, client-generated, opaque, stable across edits
  rs: number; // integer Rank Score
  recordedAt: string; // ISO-8601 UTC instant
};
```

No Season id, notes, or league fields on the Entry.

### Season (static app table — not in Local store)

```ts
type Season = {
  number: number; // 1–11 for v1
  title: string; // official name, e.g. "GALAXY MASTERS"
  startUtc: string; // ISO-8601 UTC
  endUtc: string | null; // null = open Current Season
};
```

Bounds: research compact abutting UTC table (`docs/research/the-finals-season-calendar.md`). Hard invariant: `end(N) = start(N+1)`. Prefer official ranked/announced times when sources disagree; otherwise Steam publish proxies. No per-Season confidence field in the shipped table. Season 0 is omitted.

### Local store (`localStorage` JSON)

```ts
type LocalStore = {
  version: number; // schema version; starts at 1
  entries: Entry[];
};
```

Not nested by Season. Import migration rules live with the Export/Import format decision.

## Rules

- **Season assignment:** Entry belongs to Season N iff `startUtc(N) <= recordedAt < endUtc(N)` (treat null `endUtc` as +∞).
- **Out of window:** reject — do not invent an unknown Season or fall back to Current Season.
- **Season view filter:** that derived subset, sorted by `recordedAt` ascending.
- **Ids:** Export/Import preserves nanoids; identity is not derived from `rs` or `recordedAt` (duplicate timestamps allowed).

## Considered options

| Option                        | Why not for v1                                                               |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Nested `entriesBySeason`      | Fights derived Season; calendar updates become data migrations               |
| Store `seasonNumber` on Entry | Denormalized; drifts if calendar bounds are corrected                        |
| IndexedDB + Dexie             | Fine later; unnecessary complexity for a small flat list                     |
| Drizzle + PGLite/SQLite WASM  | SQL/migrations in-browser are awkward; multi‑MB WASM; Export is already JSON |

## Consequences

- Season 12+ = code/content update that sets previous `endUtc` = new `startUtc`.
- RS input validation: required integer `rs >= 0`; no max; no Δ-from-previous clamp (flow locked in #7).
- Schema bumps use `version`; Import strategy (merge vs replace) deferred to Export/Import ticket.
