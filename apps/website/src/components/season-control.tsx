import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { getCurrentSeason } from "@/lib/seasons";
import type { Season } from "@/lib/types";

type SeasonControlProps = {
  seasons: Season[];
  selectedSeasonNumber: number;
  onSelect: (seasonNumber: number) => void;
  onIntent?: (seasonNumber: number) => void;
};

export function SeasonControl({
  seasons,
  selectedSeasonNumber,
  onSelect,
  onIntent,
}: SeasonControlProps) {
  const currentSeasonNumber = getCurrentSeason().number;

  return (
    <ToggleGroup
      type="single"
      value={String(selectedSeasonNumber)}
      onValueChange={(value) => {
        if (value === "") {
          return;
        }
        onSelect(Number(value));
      }}
      variant="outline"
      size="sm"
      spacing={1}
      role="radiogroup"
      aria-label="Season"
      className="flex-wrap rounded-none border border-border bg-card/60 p-1"
    >
      {seasons.map((season) => {
        const label =
          season.number === currentSeasonNumber ? `S${season.number}*` : `S${season.number}`;
        const selected = season.number === selectedSeasonNumber;

        return (
          <ToggleGroupItem
            key={season.number}
            value={String(season.number)}
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onPointerEnter={() => {
              onIntent?.(season.number);
            }}
            onFocus={() => {
              onIntent?.(season.number);
            }}
            className={cn(
              "rounded-none font-heading text-xs uppercase tracking-[0.15em]",
              !selected && "text-muted-foreground",
            )}
          >
            {label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
