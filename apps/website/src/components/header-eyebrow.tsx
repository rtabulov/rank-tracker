import { useSearch } from "@tanstack/react-router";
import { useLocalStore } from "@/components/local-store-provider";
import { useProfile } from "@/components/profile-provider";
import { formatHeaderEyebrow } from "@/lib/header-eyebrow";
import { resolveSelectedSeason } from "@/lib/resolve-selected-season";

export function HeaderEyebrow() {
  const search = useSearch({ strict: false });
  const { store } = useLocalStore();
  const { profile } = useProfile();
  const selectedSeason = resolveSelectedSeason(search.season, store.entries);
  const eyebrow = formatHeaderEyebrow({
    displayName: profile?.displayName,
    entries: store.entries,
    seasonNumber: selectedSeason,
  });

  return <p className="font-heading text-[10px] tracking-[0.35em] text-hud-cyan">{eyebrow}</p>;
}
