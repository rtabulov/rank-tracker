import { createFileRoute } from "@tanstack/react-router";
import {
  PublicSeasonRoutePage,
  parsePublicSeasonSearch,
} from "@/components/public-season-route-page";

export const Route = createFileRoute("/p/$displayName")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => parsePublicSeasonSearch(search),
  component: PublicSeasonViewPage,
});

function PublicSeasonViewPage() {
  return <PublicSeasonRoutePage routeId={Route.id} />;
}
