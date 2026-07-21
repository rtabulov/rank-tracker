import { SITE_BASEPATH } from "@/lib/paths";

export function publicSeasonLinkPath(displayName: string): string {
  const base = SITE_BASEPATH.endsWith("/") ? SITE_BASEPATH.slice(0, -1) : SITE_BASEPATH;
  return `${base}/p/${displayName}`;
}

export function publicSeasonLinkUrl(displayName: string): string {
  return `${window.location.origin}${publicSeasonLinkPath(displayName)}`;
}
