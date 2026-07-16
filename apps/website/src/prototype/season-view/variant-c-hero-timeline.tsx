/**
 * PROTOTYPE Variant C — Hero + timeline
 * Massive Latest RS / Season net as the composition; chart as a thin sparkline;
 * Entries as a vertical timeline. Season as segmented control.
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

export const VARIANT_C_NAME = "Hero + timeline";

export function VariantC() {
  const [seasonId, setSeasonId] = useState("s11");
  const s = PROTOTYPE_SUMMARY;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-2 pb-24">
      <div className="flex flex-wrap gap-1">
        {PROTOTYPE_SEASONS.map((season) => (
          <button
            key={season.id}
            type="button"
            onClick={() => setSeasonId(season.id)}
            className={`rounded-full px-3 py-1 text-sm ${
              seasonId === season.id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {season.label.replace("Season ", "S")}
            {season.isCurrent ? "*" : ""}
          </button>
        ))}
      </div>

      <header className="text-center">
        <p className="text-sm tracking-wide text-muted-foreground uppercase">Latest RS</p>
        <p className="mt-1 text-6xl font-semibold tracking-tighter tabular-nums sm:text-7xl">
          {formatRs(s.latestRs)}
        </p>
        <p className="mt-3 text-lg">
          <span className="text-emerald-700 dark:text-emerald-400">
            {formatSigned(s.seasonNet)}
          </span>
          <span className="text-muted-foreground"> this Season</span>
          <span className="text-muted-foreground"> · </span>
          <span className="tabular-nums">{formatSigned(s.deltaLast7d)}</span>
          <span className="text-muted-foreground"> / 7d</span>
        </p>
        <div className="mt-5">
          <Button size="lg" className="min-w-40">
            Log RS
          </Button>
        </div>
      </header>

      <div className="px-4 text-muted-foreground">
        <RsLine entries={PROTOTYPE_ENTRIES} height={72} className="w-full opacity-80" />
      </div>

      <dl className="mx-auto grid w-full max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Season high</dt>
        <dd className="text-right tabular-nums">{formatRs(s.seasonHigh)}</dd>
        <dt className="text-muted-foreground">Season low</dt>
        <dd className="text-right tabular-nums">{formatRs(s.seasonLow)}</dd>
        <dt className="text-muted-foreground">Avg Δ / Entry</dt>
        <dd className="text-right tabular-nums">{formatSigned(s.avgDelta)}</dd>
        <dt className="text-muted-foreground">Entries</dt>
        <dd className="text-right tabular-nums">{s.entryCount}</dd>
        <dt className="text-muted-foreground">Days since last</dt>
        <dd className="text-right tabular-nums">{s.daysSinceLastEntry}</dd>
      </dl>

      <section>
        <h2 className="mb-4 text-center text-sm tracking-wide text-muted-foreground uppercase">
          Timeline
        </h2>
        <ol className="relative space-y-0 border-l border-border ml-3">
          {[...PROTOTYPE_ENTRIES].reverse().map((entry) => (
            <li key={entry.id} className="relative pb-6 pl-6 last:pb-0">
              <span className="absolute top-1.5 -left-[5px] size-2.5 rounded-full bg-foreground" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xl font-semibold tabular-nums">{formatRs(entry.rs)}</p>
                <p
                  className={`text-sm tabular-nums ${
                    entry.delta == null
                      ? "text-muted-foreground"
                      : entry.delta >= 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {entry.delta == null ? "first" : formatSigned(entry.delta)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{formatLocalWhen(entry.recordedAt)}</p>
              <div className="mt-1 flex gap-2">
                <Button variant="link" size="xs" className="h-auto px-0">
                  Edit
                </Button>
                <Button variant="link" size="xs" className="h-auto px-0 text-destructive">
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
