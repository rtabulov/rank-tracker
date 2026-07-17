import { Button } from "@/components/ui/button.tsx";
import { useLocalStore } from "@/components/local-store-provider.tsx";
import { getCurrentSeason, getEntriesForSeason, getSeasonByNumber } from "@/lib/seasons.ts";

type SeasonViewProps = {
  seasonNumber: number;
};

export function SeasonView({ seasonNumber }: SeasonViewProps) {
  const { store } = useLocalStore();
  const season = getSeasonByNumber(seasonNumber) ?? getCurrentSeason();
  const entries = getEntriesForSeason(store.entries, season.number);
  const isEmpty = entries.length === 0;
  const isCurrentSeason = season.number === getCurrentSeason().number;

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
          <p className="text-6xl font-semibold tracking-tight">{entries.at(-1)?.rs}</p>
        )}
        <h2 className="text-lg font-medium">
          Season {season.number}
          {isCurrentSeason ? " (Current)" : ""}
        </h2>
      </section>

      {!isEmpty && (
        <>
          <section aria-label="RS sparkline">
            <p className="text-sm text-muted-foreground">Sparkline</p>
          </section>
          <section aria-label="Season summary">
            <p className="text-sm text-muted-foreground">Season summary</p>
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
                RS {entry.rs} · {entry.recordedAt}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button type="button">Log RS</Button>
    </main>
  );
}
