import {
  createFileRoute,
  notFound,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { PublicRouteMeta } from "@/components/public-route-meta";
import { PublicSeasonLoadError } from "@/components/public-season-load-error";
import { PublicSeasonUnavailable } from "@/components/public-season-unavailable";
import { PublicSeasonViewSkeleton } from "@/components/season-view-skeleton";
import { SeasonView } from "@/components/season-view";
import { TrackYourOwnRsInlineLink } from "@/components/track-your-own-rs-link";
import { ViewingStrip } from "@/components/viewing-strip";
import { validateDisplayName } from "@/lib/display-name";
import { loadPublicSeasonIndex } from "@/lib/public-season-index-cache";
import { parseSeasonSearchParam } from "@/lib/season-search";
import { isSeasonNumberNavigable, seasonsFromNumbers } from "@/lib/season-navigability";
import { getCurrentSeason } from "@/lib/seasons";

type PublicSeasonSearch = {
  season?: number;
};

const ENTRIES_STALE_MS = 30_000;

export const Route = createFileRoute("/p/$displayName")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): PublicSeasonSearch => {
    const season = parseSeasonSearchParam(search);
    return season === undefined ? {} : { season };
  },
  loaderDeps: ({ search }) => ({ season: search.season }),
  staleTime: ENTRIES_STALE_MS,
  pendingComponent: PublicSeasonViewSkeleton,
  notFoundComponent: PublicSeasonUnavailable,
  errorComponent: PublicSeasonLoadError,
  beforeLoad: async ({ params, search, context }) => {
    if (validateDisplayName(params.displayName) !== null) {
      throw notFound();
    }

    const index = await loadPublicSeasonIndex(
      context.publicSeasonClient.getPublicSeasonIndex,
      params.displayName,
    );
    if (index === null) {
      throw notFound();
    }

    if (index.displayName !== params.displayName) {
      throw redirect({
        to: "/p/$displayName",
        params: { displayName: index.displayName },
        search,
        replace: true,
      });
    }

    const currentSeasonNumber = getCurrentSeason().number;
    if (
      search.season === undefined ||
      !isSeasonNumberNavigable(search.season, index.seasonNumbers)
    ) {
      throw redirect({
        to: "/p/$displayName",
        params: { displayName: index.displayName },
        search: { season: currentSeasonNumber },
        replace: true,
      });
    }

    return { publicIndex: index };
  },
  loader: async ({ params, deps, context }) => {
    const seasonNumber = deps.season;
    if (seasonNumber === undefined) {
      throw new Error("Season search param missing after beforeLoad");
    }

    const publicIndex = context.publicIndex;
    if (publicIndex === undefined) {
      throw new Error("Public season index missing after beforeLoad");
    }

    const payload = await context.publicSeasonClient.getPublicSeasonEntries(
      params.displayName,
      seasonNumber,
    );
    if (payload === null) {
      throw notFound();
    }

    return {
      displayName: payload.displayName,
      seasonNumber: payload.seasonNumber,
      entries: payload.entries,
      seasonNumbers: publicIndex.seasonNumbers,
    };
  },
  component: PublicSeasonViewPage,
});

function PublicSeasonViewPage() {
  const navigate = useNavigate({ from: Route.id });
  const router = useRouter();
  const { displayName, seasonNumber, entries, seasonNumbers } = Route.useLoaderData();
  const navigableSeasons = seasonsFromNumbers(seasonNumbers);

  return (
    <>
      <PublicRouteMeta />
      <div className="mx-auto w-full max-w-lg px-4 pt-2">
        <ViewingStrip displayName={displayName} />
      </div>
      <SeasonView
        seasonNumber={seasonNumber}
        entries={entries}
        navigableSeasons={navigableSeasons}
        readOnly
        onSeasonSelect={(nextSeason) => {
          void navigate({ search: { season: nextSeason } });
        }}
        onSeasonIntent={(nextSeason) => {
          void router.preloadRoute({
            to: "/p/$displayName",
            params: { displayName },
            search: { season: nextSeason },
          });
        }}
      />
      <div className="mx-auto w-full max-w-lg px-4 pb-8">
        <TrackYourOwnRsInlineLink />
      </div>
    </>
  );
}
