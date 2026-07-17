import { useState } from "react";
import { useLocalStore } from "@/components/local-store-provider";
import { LogRsOverlay } from "@/components/log-rs-overlay";
import { RsSparkline } from "@/components/rs-sparkline";
import { SeasonControl } from "@/components/season-control";
import { Button } from "@/components/ui/button";
import { addEntry } from "@/lib/entries";
import { formatLocalWhen, formatSigned } from "@/lib/format";
import { computeSeasonSummary } from "@/lib/season-summary";
import {
  getCurrentSeason,
  getEntriesForSeason,
  getNavigableSeasons,
  getSeasonByNumber,
} from "@/lib/seasons";

type SeasonViewProps = {
  seasonNumber: number;
  onSeasonSelect: (seasonNumber: number) => void;
};

export function SeasonView({ seasonNumber, onSeasonSelect }: SeasonViewProps) {
  const { store, setStore } = useLocalStore();
  const [logRsOpen, setLogRsOpen] = useState(false);
  const season = getSeasonByNumber(seasonNumber) ?? getCurrentSeason();
  const entries = getEntriesForSeason(store.entries, season.number);
  const isEmpty = entries.length === 0;
  const isCurrentSeason = season.number === getCurrentSeason().number;
  const summary = computeSeasonSummary(entries, { isCurrentSeason });
  const navigableSeasons = getNavigableSeasons(store.entries);

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 pb-6">
      <section aria-label="Season hero" className="flex flex-col gap-2">
        {isEmpty ? (
          <>
            <p
              className="text-6xl font-semibold tracking-tight text-muted-foreground"
              aria-label="No RS logged"
            >
              —
            </p>
            <p className="text-muted-foreground">Log your first RS to get started.</p>
          </>
        ) : (
          <>
            <p className="text-6xl font-semibold tracking-tight tabular-nums">
              {summary?.latestRs.toLocaleString()}
            </p>
            {summary !== null && (
              <p className="text-muted-foreground">
                <span>{formatSigned(summary.seasonNet)}</span> this Season
                {isCurrentSeason && summary.deltaLast7Days !== null && (
                  <>
                    <span> · </span>
                    <span>{formatSigned(summary.deltaLast7Days)}</span> / 7d
                  </>
                )}
              </p>
            )}
          </>
        )}
        <h2 className="text-lg font-medium">
          Season {season.number}
          {isCurrentSeason ? " (Current)" : ""}
        </h2>
      </section>

      {!isEmpty && summary !== null && (
        <>
          <section aria-label="RS sparkline">
            <RsSparkline entries={entries} className="w-full text-foreground" />
          </section>

          <section aria-label="Season summary">
            <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Latest RS</dt>
              <dd className="text-right tabular-nums">{summary.latestRs.toLocaleString()}</dd>
              <dt className="text-muted-foreground">Season high</dt>
              <dd className="text-right tabular-nums">{summary.seasonHigh.toLocaleString()}</dd>
              <dt className="text-muted-foreground">Season low</dt>
              <dd className="text-right tabular-nums">{summary.seasonLow.toLocaleString()}</dd>
              <dt className="text-muted-foreground">Season net</dt>
              <dd className="text-right tabular-nums">{formatSigned(summary.seasonNet)}</dd>
              <dt className="text-muted-foreground">Entry count</dt>
              <dd className="text-right tabular-nums">{summary.entryCount}</dd>
              {summary.avgDeltaPerEntry !== null && (
                <>
                  <dt className="text-muted-foreground">Avg Δ per Entry</dt>
                  <dd className="text-right tabular-nums">
                    {formatSigned(Math.round(summary.avgDeltaPerEntry))}
                  </dd>
                </>
              )}
              {isCurrentSeason && summary.deltaLast7Days !== null && (
                <>
                  <dt className="text-muted-foreground">Δ last 7 days</dt>
                  <dd className="text-right tabular-nums">
                    {formatSigned(summary.deltaLast7Days)}
                  </dd>
                </>
              )}
              {isCurrentSeason && summary.daysSinceLastEntry !== null && (
                <>
                  <dt className="text-muted-foreground">Days since last Entry</dt>
                  <dd className="text-right tabular-nums">{summary.daysSinceLastEntry}</dd>
                </>
              )}
            </dl>
          </section>
        </>
      )}

      <section aria-label="Entry timeline" className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Entry timeline</h3>
        {isEmpty ? (
          <p className="text-muted-foreground">No Entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li key={entry.id}>
                RS {entry.rs.toLocaleString()} · {formatLocalWhen(entry.recordedAt)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <SeasonControl
        seasons={navigableSeasons}
        selectedSeasonNumber={season.number}
        onSelect={onSeasonSelect}
      />

      <Button type="button" onClick={() => setLogRsOpen(true)}>
        Log RS
      </Button>

      <LogRsOverlay
        open={logRsOpen}
        seasonNumber={season.number}
        onClose={() => setLogRsOpen(false)}
        onSaved={(entry) => {
          setStore({ ...store, entries: addEntry(store.entries, entry) });
        }}
      />
    </main>
  );
}
