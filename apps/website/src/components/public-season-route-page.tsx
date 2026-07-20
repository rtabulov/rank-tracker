import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { PublicRouteMeta } from "@/components/public-route-meta";
import { usePublicSeasonClient } from "@/components/public-season-provider";
import { PublicSeasonUnavailable } from "@/components/public-season-unavailable";
import { SeasonView } from "@/components/season-view";
import { TrackYourOwnRsInlineLink } from "@/components/track-your-own-rs-link";
import { ViewingStrip } from "@/components/viewing-strip";
import type { PublicSeasonPayload } from "@/lib/public-season";
import { validateDisplayName } from "@/lib/display-name";
import { parseSeasonSearchParam } from "@/lib/season-search";
import { resolveSelectedSeason } from "@/lib/resolve-selected-season";
import { getCurrentSeason, isSeasonNavigable } from "@/lib/seasons";

export function PublicSeasonRoutePage({ routeId }: { routeId: string }) {
  const { displayName: urlDisplayName } = useParams({ from: routeId as "/p/$displayName" });
  const navigate = useNavigate({ from: routeId as "/p/$displayName" });
  const search = useSearch({ from: routeId as "/p/$displayName" });
  const publicSeasonClient = usePublicSeasonClient();
  const isInvalidDisplayName = validateDisplayName(urlDisplayName) !== null;
  const [payload, setPayload] = useState<PublicSeasonPayload | null | undefined>(() =>
    isInvalidDisplayName ? null : undefined,
  );

  useEffect(() => {
    if (isInvalidDisplayName) {
      return;
    }

    let cancelled = false;
    setPayload(undefined);

    void publicSeasonClient
      .getPublicSeason(urlDisplayName)
      .then((result) => {
        if (!cancelled) {
          setPayload(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPayload(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isInvalidDisplayName, publicSeasonClient, urlDisplayName]);

  const currentSeason = getCurrentSeason();

  useEffect(() => {
    if (payload === undefined || payload === null) {
      return;
    }

    if (payload.displayName !== urlDisplayName) {
      void navigate({
        to: "/p/$displayName",
        params: { displayName: payload.displayName },
        search,
        replace: true,
      });
    }
  }, [navigate, payload, search, urlDisplayName]);

  useEffect(() => {
    if (payload === undefined || payload === null) {
      return;
    }

    if (search.season === undefined) {
      void navigate({
        search: { season: currentSeason.number },
        replace: true,
      });
      return;
    }

    if (!isSeasonNavigable(search.season, payload.entries)) {
      void navigate({
        search: { season: currentSeason.number },
        replace: true,
      });
    }
  }, [currentSeason.number, navigate, payload, search.season]);

  if (payload === undefined) {
    return <PublicRouteMeta />;
  }

  if (payload === null) {
    return (
      <>
        <PublicRouteMeta />
        <PublicSeasonUnavailable />
      </>
    );
  }

  const selectedSeason = resolveSelectedSeason(search.season, payload.entries);

  return (
    <>
      <PublicRouteMeta />
      <div className="mx-auto w-full max-w-lg px-4 pt-2">
        <ViewingStrip displayName={payload.displayName} />
      </div>
      <SeasonView
        seasonNumber={selectedSeason}
        entries={payload.entries}
        readOnly
        onSeasonSelect={(seasonNumber) => {
          void navigate({ search: { season: seasonNumber } });
        }}
      />
      <div className="mx-auto w-full max-w-lg px-4 pb-8">
        <TrackYourOwnRsInlineLink />
      </div>
    </>
  );
}

export function parsePublicSeasonSearch(search: Record<string, unknown>): { season?: number } {
  const season = parseSeasonSearchParam(search);
  return season === undefined ? {} : { season };
}
