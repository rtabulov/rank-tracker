# Export/Import: Local store dump, replace-or-nothing

Export is the Local store JSON as-is (`{ version, entries }`). Import replaces the entire Local store after atomic validation, or leaves it untouched. Rejected a portable wrapper and merge-on-import for v1 — same shape keeps backup/transfer trivial; merge needs ambiguous duplicate rules that fight a snapshot mental model.

## Status

accepted

## Format

Identical to the Local store document (ADR 0001):

```ts
type ExportDocument = {
  version: number;
  entries: Entry[]; // { id, rs, recordedAt }
};
```

No envelope, export timestamp, or app id. Unknown fields on the root or Entry are ignored and not persisted. Duplicate `id`s in one file fail the whole Import.

## Versioning

- **Equal to app version:** accept, then replace.
- **Lower:** run deterministic migrations up to current, then replace. (v1 ships only `version: 1` — migration table empty until a real bump.)
- **Higher / unknown:** reject; Local store unchanged.

## Restore semantics

- **Replace-or-nothing** — successful Import makes the Local store match the file; failure leaves the prior store intact.
- **Atomic validation** — JSON parse, `version` + `entries` array, each Entry shape, unique `id`s; any failure rejects the whole file (no partial Import).
- **Confirm** — UI requires explicit confirmation that the current Local store will be replaced before committing.

## Considered options

| Option                                  | Why not for v1                                               |
| --------------------------------------- | ------------------------------------------------------------ |
| Wrapper envelope (metadata, exportedAt) | Ceremony; `version` already covers schema evolution          |
| Merge Import                            | Ambiguous duplicate/`id` rules; silent half-restores         |
| Skip bad Entries                        | Partial restore after a “backup” is worse than a clear error |
| Reject unknown fields                   | Blocks forward-compatible Exports from newer apps            |

## Consequences

- Suggested download filename and exact validation error copy left to UI work.
- RS input bounds for the form are `rs >= 0` (no max); Import still only checks Entry shape unless a later schema rule adds range checks.
- First schema bump must add a migrator; until then only `version: 1` Imports succeed.
