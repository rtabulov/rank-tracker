import { PRODUCTION_OG_IMAGE_URL, PRODUCTION_URL } from "@/lib/static-document";

export const PUBLIC_SEASON_UNAVAILABLE_TITLE = "Public Season view unavailable";
export const PUBLIC_SEASON_UNAVAILABLE_DESCRIPTION = "This Public link isn’t available.";

export type PublicSeasonDocumentHeadInput =
  | { kind: "available"; displayName: string }
  | { kind: "unavailable" };

export type PublicSeasonDocumentHead = {
  title: string;
  meta: Array<Record<string, string | undefined>>;
};

export function publicSeasonPageUrl(displayName: string): string {
  const origin = PRODUCTION_URL.endsWith("/") ? PRODUCTION_URL.slice(0, -1) : PRODUCTION_URL;
  return `${origin}/p/${displayName}`;
}

function availableDescription(displayName: string): string {
  return `Public Rank Score history for ${displayName} on The Finals.`;
}

function availableTitle(displayName: string): string {
  return `${displayName} · Rank Tracker`;
}

function socialMeta(input: {
  title: string;
  description: string;
  url?: string;
  robots?: string;
}): Array<Record<string, string | undefined>> {
  const meta: Array<Record<string, string | undefined>> = [
    { name: "description", content: input.description },
  ];
  if (input.robots !== undefined) {
    meta.push({ name: "robots", content: input.robots });
  }
  meta.push(
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: "website" },
  );
  if (input.url !== undefined) {
    meta.push({ property: "og:url", content: input.url });
  }
  meta.push(
    { property: "og:image", content: PRODUCTION_OG_IMAGE_URL },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: PRODUCTION_OG_IMAGE_URL },
  );
  return meta;
}

export function publicSeasonDocumentHead(
  input: PublicSeasonDocumentHeadInput,
): PublicSeasonDocumentHead {
  if (input.kind === "unavailable") {
    return {
      title: PUBLIC_SEASON_UNAVAILABLE_TITLE,
      meta: socialMeta({
        title: PUBLIC_SEASON_UNAVAILABLE_TITLE,
        description: PUBLIC_SEASON_UNAVAILABLE_DESCRIPTION,
        robots: "noindex, nofollow",
      }),
    };
  }

  const title = availableTitle(input.displayName);
  const description = availableDescription(input.displayName);

  return {
    title,
    meta: socialMeta({
      title,
      description,
      url: publicSeasonPageUrl(input.displayName),
    }),
  };
}
