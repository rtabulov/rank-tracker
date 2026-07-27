import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { OwnerSeasonPending } from "@/components/owner-season-pending";
import { SeasonView } from "@/components/season-view";
import { parseSeasonSearchParam } from "@/lib/season-search";
import { getCurrentSeason, getNavigableSeasons, isSeasonNavigable } from "@/lib/seasons";

type SeasonSearch = {
  /** Always filled by validateSearch; optional on Link targets. */
  season?: number;
};

export const Route = createFileRoute("/")({
  ssr: false,
  // ClientOnly uses pendingComponent as hydration fallback for ssr:false —
  // keep it on Local-store Season chrome, never the global skeleton.
  pendingComponent: OwnerSeasonPending,
  pendingMs: Infinity,
  validateSearch: (search: Record<string, unknown>): SeasonSearch => {
    const parsed = parseSeasonSearchParam(search);
    return { season: parsed ?? getCurrentSeason().number };
  },
  loaderDeps: ({ search }) => ({
    season: search.season ?? getCurrentSeason().number,
  }),
  beforeLoad: ({ search, context }) => {
    const entries = context.getLocalEntries();
    const currentSeasonNumber = getCurrentSeason().number;
    const seasonNumber = search.season ?? currentSeasonNumber;
    if (!isSeasonNavigable(seasonNumber, entries)) {
      throw redirect({
        to: "/",
        search: { season: currentSeasonNumber },
        replace: true,
      });
    }
  },
  loader: ({ deps, context }) => {
    const entries = context.getLocalEntries();
    return {
      seasonNumber: deps.season,
      navigableSeasons: getNavigableSeasons(entries),
    };
  },
  component: SeasonViewPage,
});

function SeasonViewPage() {
  const navigate = useNavigate({ from: Route.id });
  const router = useRouter();
  const { seasonNumber } = Route.useLoaderData();

  // validateSearch defaults season without a beforeLoad redirect (avoids a
  // ClientOnly remount flash). Mirror the default into the URL without a
  // router navigation (which would remount the ClientOnly boundary).
  useLayoutEffect(() => {
    if (new URLSearchParams(window.location.search).has("season")) {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("season", String(seasonNumber));
    window.history.replaceState(window.history.state, "", url);
  }, [seasonNumber]);

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
