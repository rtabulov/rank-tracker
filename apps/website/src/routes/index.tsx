import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { SeasonView } from "@/components/season-view";
import { parseSeasonSearchParam } from "@/lib/season-search";
import { getCurrentSeason, getNavigableSeasons, isSeasonNavigable } from "@/lib/seasons";

type SeasonSearch = {
  season?: number;
};

export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SeasonSearch => {
    const season = parseSeasonSearchParam(search);
    return season === undefined ? {} : { season };
  },
  loaderDeps: ({ search }) => ({ season: search.season }),
  beforeLoad: ({ search, context }) => {
    const entries = context.getLocalEntries();
    const currentSeasonNumber = getCurrentSeason().number;
    if (search.season === undefined) {
      throw redirect({
        to: "/",
        search: { season: currentSeasonNumber },
        replace: true,
      });
    }
    if (!isSeasonNavigable(search.season, entries)) {
      throw redirect({
        to: "/",
        search: { season: currentSeasonNumber },
        replace: true,
      });
    }
  },
  loader: ({ deps, context }) => {
    const seasonNumber = deps.season;
    if (seasonNumber === undefined) {
      throw new Error("Season search param missing after beforeLoad");
    }
    const entries = context.getLocalEntries();
    return {
      seasonNumber,
      navigableSeasons: getNavigableSeasons(entries),
    };
  },
  component: SeasonViewPage,
});

function SeasonViewPage() {
  const navigate = useNavigate({ from: Route.id });
  const router = useRouter();
  const { seasonNumber } = Route.useLoaderData();

  return (
    <SeasonView
      seasonNumber={seasonNumber}
      onSeasonSelect={(nextSeason) => {
        void navigate({ search: { season: nextSeason } });
      }}
      onSeasonIntent={(nextSeason) => {
        void router.preloadRoute({
          to: "/",
          search: { season: nextSeason },
        });
      }}
    />
  );
}
