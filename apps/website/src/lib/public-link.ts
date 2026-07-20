import { PAGES_BASEPATH } from "@/lib/paths";

export function publicSeasonLinkPath(displayName: string): string {
  const base = PAGES_BASEPATH.endsWith("/") ? PAGES_BASEPATH.slice(0, -1) : PAGES_BASEPATH;
  return `${base}/p/${displayName}`;
}

export function publicSeasonLinkUrl(displayName: string): string {
  return `${window.location.origin}${publicSeasonLinkPath(displayName)}`;
}
