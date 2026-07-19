import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentSeason } from "@/lib/seasons";
import type { Season } from "@/lib/types";

type SeasonControlProps = {
  seasons: Season[];
  selectedSeasonNumber: number;
  onSelect: (seasonNumber: number) => void;
};

export function SeasonControl({ seasons, selectedSeasonNumber, onSelect }: SeasonControlProps) {
  const currentSeasonNumber = getCurrentSeason().number;

  return (
    <div
      role="radiogroup"
      aria-label="Season"
      className="inline-flex flex-wrap gap-1 border border-border bg-card/60 p-1"
    >
      {seasons.map((season) => {
        const label =
          season.number === currentSeasonNumber ? `S${season.number}*` : `S${season.number}`;
        const selected = season.number === selectedSeasonNumber;

        return (
          <Button
            key={season.number}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            variant={selected ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-none font-heading text-xs uppercase tracking-[0.15em]",
              !selected && "text-muted-foreground",
            )}
            onClick={() => onSelect(season.number)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
