import { useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useLocalStore } from "@/components/local-store-provider";
import { SeasonView } from "@/components/season-view";
import { parseSeasonSearchParam } from "@/lib/season-search";
import { resolveSelectedSeason } from "@/lib/resolve-selected-season";
import { getCurrentSeason, isSeasonNavigable } from "@/lib/seasons";

type SeasonSearch = {
  season?: number;
};

export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SeasonSearch => {
    const season = parseSeasonSearchParam(search);
    return season === undefined ? {} : { season };
  },
  component: SeasonViewPage,
});

function SeasonViewPage() {
  const navigate = useNavigate({ from: Route.id });
  const search = useSearch({ from: Route.id });
  const { store } = useLocalStore();
  const currentSeason = getCurrentSeason();
  const selectedSeason = resolveSelectedSeason(search.season, store.entries);

  useEffect(() => {
    if (search.season === undefined) {
      void navigate({
        search: { season: currentSeason.number },
        replace: true,
      });
      return;
    }

    if (!isSeasonNavigable(search.season, store.entries)) {
      void navigate({
        search: { season: currentSeason.number },
        replace: true,
      });
    }
  }, [currentSeason.number, navigate, search.season, store.entries]);

  return (
    <SeasonView
      seasonNumber={selectedSeason}
      onSeasonSelect={(seasonNumber) => {
        void navigate({ search: { season: seasonNumber } });
      }}
    />
  );
}
