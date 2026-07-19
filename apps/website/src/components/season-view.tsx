import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useLocalStore } from "@/components/local-store-provider";
import { DeleteEntryOverlay } from "@/components/delete-entry-overlay";
import { EditEntryOverlay } from "@/components/edit-entry-overlay";
import { LogRsOverlay } from "@/components/log-rs-overlay";
import { RsSparkline } from "@/components/rs-sparkline";
import { SeasonControl } from "@/components/season-control";
import { Button } from "@/components/ui/button";
import { addEntry, deleteEntry, updateEntry } from "@/lib/entries";
import { formatLocalWhen, formatSigned } from "@/lib/format";
import type { Entry } from "@/lib/types";
import { computeSeasonSummary } from "@/lib/season-summary";
import {
  getCurrentSeason,
  getEntriesForSeason,
  getNavigableSeasons,
  getSeasonByNumber,
  getSeasonForTimestamp,
} from "@/lib/seasons";
import { cn } from "@/lib/utils";

type SeasonViewProps = {
  seasonNumber: number;
  onSeasonSelect: (seasonNumber: number) => void;
};

function netToneLabel(seasonNet: number): "up" | "down" | "flat" {
  if (seasonNet > 0) {
    return "up";
  }
  if (seasonNet < 0) {
    return "down";
  }
  return "flat";
}

export function SeasonView({ seasonNumber, onSeasonSelect }: SeasonViewProps) {
  const { store, setStore } = useLocalStore();
  const [logRsOpen, setLogRsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<Entry | null>(null);
  const season = getSeasonByNumber(seasonNumber) ?? getCurrentSeason();
  const entries = getEntriesForSeason(store.entries, season.number);
  const isEmpty = entries.length === 0;
  const isCurrentSeason = season.number === getCurrentSeason().number;
  const summary = computeSeasonSummary(entries, { isCurrentSeason });
  const navigableSeasons = getNavigableSeasons(store.entries);
  const seasonNet = summary?.seasonNet ?? 0;
  const netTone = netToneLabel(seasonNet);
  const timeline = [...entries].reverse();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-28 pt-5">
      <section aria-label="Season hero" className="mb-4 grid grid-cols-[1.4fr_1fr] gap-3">
        <div className="border-2 border-border bg-card p-4">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Rank score
          </p>
          {isEmpty ? (
            <>
              <p
                className="mt-1 font-heading text-6xl font-bold leading-none tracking-tight text-muted-foreground"
                aria-label="No RS logged"
              >
                —
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Log your first RS to get started.
              </p>
            </>
          ) : (
            <p className="mt-1 font-heading text-6xl font-bold leading-none tracking-tight tabular-nums">
              {summary?.latestRs.toLocaleString()}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex flex-col justify-between border-2 p-4",
            isEmpty || netTone === "flat"
              ? "border-border bg-card text-foreground"
              : netTone === "up"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-destructive bg-destructive text-destructive-foreground",
          )}
        >
          <p className="font-heading text-xs font-bold uppercase tracking-[0.18em]">
            {isEmpty
              ? "Season"
              : netTone === "up"
                ? "Season up"
                : netTone === "down"
                  ? "Season down"
                  : "Season net"}
          </p>
          <p className="font-heading text-3xl font-bold leading-none tabular-nums">
            {isEmpty ? "—" : formatSigned(seasonNet)}
          </p>
          <h2 className="font-sans text-xs font-medium uppercase tracking-wide">
            Season {season.number}
            {isCurrentSeason ? " (Current)" : ""}
          </h2>
        </div>
      </section>

      {!isEmpty && summary !== null && (
        <>
          <section
            aria-label="RS sparkline"
            className="mb-4 border-y-2 border-primary bg-background px-2 py-3 text-primary"
          >
            <RsSparkline
              entries={entries}
              showDots={false}
              showArea
              className="w-full"
              height={88}
            />
          </section>

          <section aria-label="Season summary" className="mb-5">
            <h3 className="mb-2 font-heading text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Season board
            </h3>
            <dl className="border-2 border-border">
              <BoardRow label="Latest RS" value={summary.latestRs.toLocaleString()} />
              <BoardRow label="Season high" value={summary.seasonHigh.toLocaleString()} />
              <BoardRow label="Season low" value={summary.seasonLow.toLocaleString()} />
              <BoardRow label="Season net" value={formatSigned(summary.seasonNet)} highlight />
              <BoardRow label="Entry count" value={String(summary.entryCount)} />
              {summary.avgDeltaPerEntry !== null && (
                <BoardRow
                  label="Avg Δ per Entry"
                  value={formatSigned(Math.round(summary.avgDeltaPerEntry))}
                />
              )}
              {isCurrentSeason && summary.deltaLast7Days !== null && (
                <BoardRow label="Δ last 7 days" value={formatSigned(summary.deltaLast7Days)} />
              )}
              {isCurrentSeason && summary.daysSinceLastEntry !== null && (
                <BoardRow
                  label="Days since last Entry"
                  value={String(summary.daysSinceLastEntry)}
                />
              )}
            </dl>
          </section>
        </>
      )}

      <section aria-label="Entry timeline" className="mb-4 flex flex-col">
        <h3 className="mb-2 font-heading text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Entry timeline
        </h3>
        {isEmpty ? (
          <p className="text-muted-foreground">No Entries yet.</p>
        ) : (
          <ul className="flex flex-col">
            {timeline.map((entry, index) => {
              const chronologicalIndex = entries.length - 1 - index;
              const previous = chronologicalIndex > 0 ? entries[chronologicalIndex - 1] : undefined;
              const delta = previous !== undefined ? entry.rs - previous.rs : null;

              return (
                <li
                  key={entry.id}
                  className="flex items-stretch border-2 border-t-0 border-border first:border-t-2"
                >
                  <div className="flex min-w-12 items-center justify-center border-r-2 border-border bg-muted font-heading text-lg font-bold text-primary">
                    {String(timeline.length - index).padStart(2, "0")}
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-2 px-3 py-2">
                    <div>
                      <p className="font-heading text-xl font-bold uppercase leading-none">
                        RS {entry.rs.toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatLocalWhen(entry.recordedAt)}
                        {delta !== null && (
                          <span
                            className={cn(
                              "ml-2 font-semibold",
                              delta < 0 ? "text-destructive" : "text-primary",
                            )}
                          >
                            {formatSigned(delta)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        className="rounded-none border-2"
                        aria-label={`Edit ${entry.id}`}
                        onClick={() => setEditingEntry(entry)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        className="rounded-none border-2 text-destructive hover:text-destructive"
                        aria-label={`Delete ${entry.id}`}
                        onClick={() => setDeletingEntry(entry)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mb-4">
        <SeasonControl
          seasons={navigableSeasons}
          selectedSeasonNumber={season.number}
          onSelect={onSeasonSelect}
        />
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-none border-2 border-primary-foreground font-heading text-xl font-bold uppercase tracking-[0.18em]"
          onClick={() => setLogRsOpen(true)}
        >
          Log RS
        </Button>
      </div>

      <LogRsOverlay
        open={logRsOpen}
        seasonNumber={season.number}
        onClose={() => setLogRsOpen(false)}
        onSaved={(entry) => {
          setStore({ ...store, entries: addEntry(store.entries, entry) });
          const targetSeason = getSeasonForTimestamp(entry.recordedAt);
          if (targetSeason !== null && targetSeason.number !== season.number) {
            onSeasonSelect(targetSeason.number);
          }
        }}
      />

      {editingEntry !== null && deletingEntry === null && (
        <EditEntryOverlay
          open
          entry={editingEntry}
          seasonNumber={season.number}
          onClose={() => setEditingEntry(null)}
          onSaved={(entry) => {
            setStore({ ...store, entries: updateEntry(store.entries, entry.id, entry) });
            const targetSeason = getSeasonForTimestamp(entry.recordedAt);
            if (targetSeason !== null && targetSeason.number !== season.number) {
              onSeasonSelect(targetSeason.number);
            }
          }}
          onDeleteRequest={() => {
            setDeletingEntry(editingEntry);
            setEditingEntry(null);
          }}
        />
      )}

      {deletingEntry !== null && (
        <DeleteEntryOverlay
          open
          entry={deletingEntry}
          onClose={() => setDeletingEntry(null)}
          onConfirm={() => {
            setStore({ ...store, entries: deleteEntry(store.entries, deletingEntry.id) });
            setDeletingEntry(null);
          }}
        />
      )}
    </main>
  );
}

function BoardRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b-2 border-border px-3 py-2 last:border-b-0",
        highlight ? "bg-primary text-primary-foreground" : "bg-card",
      )}
    >
      <dt className="font-heading text-sm font-semibold uppercase tracking-[0.12em]">{label}</dt>
      <dd className="font-heading text-lg font-bold tabular-nums">{value}</dd>
    </div>
  );
}
