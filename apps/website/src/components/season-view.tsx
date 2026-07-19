import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useLocalStore } from "@/components/local-store-provider";
import { DeleteEntryOverlay } from "@/components/delete-entry-overlay";
import { EditEntryOverlay } from "@/components/edit-entry-overlay";
import { LogRsOverlay } from "@/components/log-rs-overlay";
import { RsSparkline } from "@/components/rs-sparkline";
import { SeasonControl } from "@/components/season-control";
import { Badge } from "@/components/ui/badge";
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
  const timeline = [...entries].reverse();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-28 pt-5">
      <section aria-label="Season hero" className="mb-5 flex flex-col gap-2">
        <p className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.3em] text-hud-magenta">
          <span>S{season.number}</span>
          {isCurrentSeason && (
            <Badge
              variant="outline"
              className="rounded-none border-hud-magenta/40 px-1.5 font-sans text-[10px] tracking-[0.3em] text-hud-magenta"
            >
              LIVE
            </Badge>
          )}
        </p>
        {isEmpty ? (
          <>
            <p
              className="font-heading text-6xl font-black tracking-tight text-muted-foreground"
              aria-label="No RS logged"
            >
              —
            </p>
            <p className="text-sm text-muted-foreground">Log your first RS to get started.</p>
          </>
        ) : (
          <>
            <p className="font-heading text-6xl font-black tracking-tight text-foreground tabular-nums hud-glow-primary">
              {summary?.latestRs.toLocaleString()}
            </p>
            {summary !== null && (
              <p className="font-sans text-sm text-primary">
                NET {formatSigned(summary.seasonNet)}{" "}
                <span className="text-muted-foreground">· THIS SEASON</span>
                {isCurrentSeason && summary.deltaLast7Days !== null && (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span>{formatSigned(summary.deltaLast7Days)}</span>
                    <span className="text-muted-foreground"> / 7D</span>
                  </>
                )}
              </p>
            )}
          </>
        )}
        <h2 className="font-heading text-sm tracking-[0.2em] text-hud-cyan">
          Season {season.number}
          {isCurrentSeason ? " (Current)" : ""}
        </h2>
      </section>

      {!isEmpty && summary !== null && (
        <>
          <section
            aria-label="RS sparkline"
            className="mb-5 border border-hud-cyan/25 bg-card/70 p-3 text-primary"
          >
            <RsSparkline entries={entries} showDots showArea className="w-full" height={88} />
          </section>

          <section aria-label="Season summary" className="mb-5 font-sans text-xs">
            <dl>
              <StatRow label="Latest RS" value={summary.latestRs.toLocaleString()} />
              <StatRow label="Season high" value={summary.seasonHigh.toLocaleString()} />
              <StatRow label="Season low" value={summary.seasonLow.toLocaleString()} />
              <StatRow label="Season net" value={formatSigned(summary.seasonNet)} accent />
              <StatRow label="Entry count" value={String(summary.entryCount)} />
              {summary.avgDeltaPerEntry !== null && (
                <StatRow
                  label="Avg Δ per Entry"
                  value={formatSigned(Math.round(summary.avgDeltaPerEntry))}
                />
              )}
              {isCurrentSeason && summary.deltaLast7Days !== null && (
                <StatRow
                  label="Δ last 7 days"
                  value={formatSigned(summary.deltaLast7Days)}
                  accent
                />
              )}
              {isCurrentSeason && summary.daysSinceLastEntry !== null && (
                <StatRow label="Days since last Entry" value={String(summary.daysSinceLastEntry)} />
              )}
            </dl>
          </section>
        </>
      )}

      <section aria-label="Entry timeline" className="mb-4 flex flex-col gap-3">
        <h3 className="font-heading text-xs tracking-[0.25em] text-hud-cyan">Entry timeline</h3>
        {isEmpty ? (
          <p className="text-muted-foreground">No Entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {timeline.map((entry) => {
              const chronologicalIndex = entries.findIndex((item) => item.id === entry.id);
              const previous = chronologicalIndex > 0 ? entries[chronologicalIndex - 1] : undefined;
              const delta = previous !== undefined ? entry.rs - previous.rs : null;

              return (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-2 border border-border bg-card/80 px-3 py-2 font-sans text-sm"
                >
                  <div>
                    <p className="text-primary">
                      RS {entry.rs.toLocaleString()}
                      {delta !== null && (
                        <span
                          className={cn("ml-2", delta < 0 ? "text-destructive" : "text-hud-cyan")}
                        >
                          {formatSigned(delta)}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatLocalWhen(entry.recordedAt)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-lg"
                      className="rounded-none border-hud-cyan/40 text-hud-cyan"
                      aria-label={`Edit ${entry.id}`}
                      onClick={() => setEditingEntry(entry)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-lg"
                      className="rounded-none border-destructive/50 text-destructive"
                      aria-label={`Delete ${entry.id}`}
                      onClick={() => setDeletingEntry(entry)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
          className="h-12 w-full rounded-none border border-primary font-heading text-sm font-bold uppercase tracking-[0.25em] hud-glow-box active:scale-[0.98]"
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

      <EditEntryOverlay
        open={editingEntry !== null && deletingEntry === null}
        entry={editingEntry ?? PLACEHOLDER_ENTRY}
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
          if (editingEntry === null) {
            return;
          }
          setDeletingEntry(editingEntry);
          setEditingEntry(null);
        }}
      />

      <DeleteEntryOverlay
        open={deletingEntry !== null}
        entry={deletingEntry ?? PLACEHOLDER_ENTRY}
        onClose={() => setDeletingEntry(null)}
        onConfirm={() => {
          if (deletingEntry === null) {
            return;
          }
          setStore({ ...store, entries: deleteEntry(store.entries, deletingEntry.id) });
          setDeletingEntry(null);
        }}
      />
    </main>
  );
}

const PLACEHOLDER_ENTRY: Entry = {
  id: "placeholder",
  rs: 0,
  recordedAt: "1970-01-01T00:00:00.000Z",
  updatedAt: "1970-01-01T00:00:00.000Z",
};

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", accent ? "text-primary" : "text-foreground")}>{value}</dd>
    </div>
  );
}
