/**
 * PROTOTYPE Variant A — Chart-first stack
 * Season chrome → dominant chart → compact summary strip → Entry list.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PROTOTYPE_ENTRIES,
  PROTOTYPE_SEASONS,
  PROTOTYPE_SUMMARY,
  formatLocalWhen,
  formatRs,
  formatSigned,
} from "./mock-data";
import { RsLine } from "./rs-line";

export const VARIANT_A_NAME = "Chart-first stack";

export function VariantA() {
  const [seasonId, setSeasonId] = useState("s11");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const s = PROTOTYPE_SUMMARY;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Season</span>
          <select
            className="h-9 rounded-lg border border-border bg-background px-3"
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
          >
            {PROTOTYPE_SEASONS.map((season) => (
              <option key={season.id} value={season.id}>
                {season.label}
                {season.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={() => setOverlayOpen(true)}>Add Entry</Button>
      </div>

      <section className="rounded-xl border border-border p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">RS over Season</h2>
          <p className="text-2xl font-semibold tabular-nums">{formatRs(s.latestRs)}</p>
        </div>
        <RsLine entries={PROTOTYPE_ENTRIES} height={220} className="w-full text-foreground" />
      </section>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <Stat label="Season high" value={formatRs(s.seasonHigh)} />
        <Stat label="Season low" value={formatRs(s.seasonLow)} />
        <Stat label="Season net" value={formatSigned(s.seasonNet)} signed={s.seasonNet} />
        <Stat label="Entries" value={String(s.entryCount)} />
        <Stat label="Avg Δ" value={formatSigned(s.avgDelta)} signed={s.avgDelta} />
        <Stat label="Δ last 7d" value={formatSigned(s.deltaLast7d)} signed={s.deltaLast7d} />
        <Stat label="Days since last" value={String(s.daysSinceLastEntry)} />
      </dl>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Entries</h2>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {[...PROTOTYPE_ENTRIES].reverse().map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div>
                <p className="font-medium tabular-nums">{formatRs(entry.rs)}</p>
                <p className="text-xs text-muted-foreground">{formatLocalWhen(entry.recordedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm tabular-nums ${
                    entry.delta == null
                      ? "text-muted-foreground"
                      : entry.delta >= 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {entry.delta == null ? "—" : formatSigned(entry.delta)}
                </span>
                <Button variant="ghost" size="xs">
                  Edit
                </Button>
                <Button variant="ghost" size="xs">
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {overlayOpen ? <StubOverlay title="Add Entry" onClose={() => setOverlayOpen(false)} /> : null}
    </div>
  );
}

function Stat({ label, value, signed }: { label: string; value: string; signed?: number }) {
  const tone =
    signed == null
      ? ""
      : signed > 0
        ? "text-emerald-700 dark:text-emerald-400"
        : signed < 0
          ? "text-red-700 dark:text-red-400"
          : "";
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-medium tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function StubOverlay({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">{title}</h3>
          <Button variant="ghost" size="xs" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Stub form — RS + local recordedAt. Not wired.
        </p>
        <div className="flex flex-col gap-2">
          <label className="text-sm">
            RS
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              defaultValue="42000"
            />
          </label>
          <label className="text-sm">
            Recorded at
            <input
              type="datetime-local"
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
            />
          </label>
          <p className="text-xs text-muted-foreground">Season preview: Season 11 (Current)</p>
          <Button className="mt-2" onClick={onClose}>
            Save (stub)
          </Button>
        </div>
      </div>
    </div>
  );
}
