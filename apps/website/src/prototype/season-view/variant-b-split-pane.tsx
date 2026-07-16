/**
 * PROTOTYPE Variant B — Split pane
 * Left: Season rail + Entry list as primary navigation.
 * Right: Latest RS hero, chart, Season summary.
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

export const VARIANT_B_NAME = "Split pane";

export function VariantB() {
  const [seasonId, setSeasonId] = useState("s11");
  const [selectedId, setSelectedId] = useState(PROTOTYPE_ENTRIES.at(-1)?.id);
  const s = PROTOTYPE_SUMMARY;
  const selected = PROTOTYPE_ENTRIES.find((e) => e.id === selectedId);

  return (
    <div className="flex min-h-[70vh] flex-col gap-0 border-y border-border md:flex-row md:border-y-0 md:border-t">
      <aside className="flex w-full flex-col border-border md:w-72 md:border-r lg:w-80">
        <div className="space-y-1 border-b border-border p-3">
          <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Seasons
          </p>
          {PROTOTYPE_SEASONS.map((season) => (
            <button
              key={season.id}
              type="button"
              onClick={() => setSeasonId(season.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${
                seasonId === season.id ? "bg-muted font-medium" : "hover:bg-muted/60"
              }`}
            >
              <span>{season.label}</span>
              {season.isCurrent ? (
                <span className="text-xs text-muted-foreground">Current</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Entries
          </p>
          <Button size="xs">Add</Button>
        </div>
        <ul className="flex-1 overflow-auto pb-24 md:pb-4">
          {[...PROTOTYPE_ENTRIES].reverse().map((entry) => {
            const active = entry.id === selectedId;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(entry.id)}
                  className={`flex w-full items-baseline justify-between gap-2 border-b border-border px-3 py-2.5 text-left ${
                    active ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <p className="font-medium tabular-nums">{formatRs(entry.rs)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatLocalWhen(entry.recordedAt)}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {entry.delta == null ? "—" : formatSigned(entry.delta)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex flex-1 flex-col gap-5 p-4 pb-24 md:p-6 md:pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Latest RS</p>
            <p className="text-5xl font-semibold tracking-tight tabular-nums">
              {formatRs(s.latestRs)}
            </p>
            <p className="mt-1 text-sm">
              Season net{" "}
              <span className="font-medium text-emerald-700 tabular-nums dark:text-emerald-400">
                {formatSigned(s.seasonNet)}
              </span>
              <span className="text-muted-foreground"> · {s.entryCount} Entries</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!selected}>
              Edit selected
            </Button>
            <Button variant="destructive" size="sm" disabled={!selected}>
              Delete
            </Button>
          </div>
        </div>

        <div className="text-foreground">
          <RsLine entries={PROTOTYPE_ENTRIES} height={180} className="w-full" />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Row label="Season high" value={formatRs(s.seasonHigh)} />
          <Row label="Season low" value={formatRs(s.seasonLow)} />
          <Row label="Avg Δ" value={formatSigned(s.avgDelta)} />
          <Row label="Δ last 7d" value={formatSigned(s.deltaLast7d)} />
          <Row label="Days since last" value={String(s.daysSinceLastEntry)} />
          {selected ? (
            <Row label="Selected when" value={formatLocalWhen(selected.recordedAt)} />
          ) : null}
        </dl>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
