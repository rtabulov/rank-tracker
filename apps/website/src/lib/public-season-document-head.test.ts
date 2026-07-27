import { expect, test } from "vite-plus/test";
import {
  PUBLIC_SEASON_UNAVAILABLE_DESCRIPTION,
  PUBLIC_SEASON_UNAVAILABLE_TITLE,
  publicSeasonDocumentHead,
  publicSeasonPageUrl,
} from "./public-season-document-head.ts";
import { PRODUCTION_OG_IMAGE_URL, SITE_TITLE } from "./static-document.ts";

function metaValue(
  meta: ReadonlyArray<Record<string, string | undefined>>,
  key: "name" | "property",
  value: string,
): string | undefined {
  return meta.find((entry) => entry[key] === value)?.content;
}

test("available Public Season head titles with display name and allows indexing", () => {
  const head = publicSeasonDocumentHead({
    kind: "available",
    displayName: "FinalsFan",
  });

  expect(head.title).toBe("FinalsFan · Rank Tracker");
  expect(metaValue(head.meta, "name", "description")).toBe(
    "Public Rank Score history for FinalsFan on The Finals.",
  );
  expect(metaValue(head.meta, "name", "robots")).toBeUndefined();
  expect(metaValue(head.meta, "property", "og:title")).toBe("FinalsFan · Rank Tracker");
  expect(metaValue(head.meta, "property", "og:description")).toBe(
    "Public Rank Score history for FinalsFan on The Finals.",
  );
  expect(metaValue(head.meta, "property", "og:url")).toBe(publicSeasonPageUrl("FinalsFan"));
  expect(metaValue(head.meta, "property", "og:image")).toBe(PRODUCTION_OG_IMAGE_URL);
  expect(metaValue(head.meta, "name", "twitter:card")).toBe("summary_large_image");
  expect(metaValue(head.meta, "name", "twitter:title")).toBe("FinalsFan · Rank Tracker");
  expect(metaValue(head.meta, "name", "twitter:description")).toBe(
    "Public Rank Score history for FinalsFan on The Finals.",
  );
  expect(metaValue(head.meta, "name", "twitter:image")).toBe(PRODUCTION_OG_IMAGE_URL);
});

test("unavailable Public Season head uses generic copy and noindex", () => {
  const head = publicSeasonDocumentHead({ kind: "unavailable" });

  expect(head.title).toBe(PUBLIC_SEASON_UNAVAILABLE_TITLE);
  expect(metaValue(head.meta, "name", "description")).toBe(PUBLIC_SEASON_UNAVAILABLE_DESCRIPTION);
  expect(metaValue(head.meta, "name", "robots")).toBe("noindex, nofollow");
  expect(metaValue(head.meta, "property", "og:title")).toBe(PUBLIC_SEASON_UNAVAILABLE_TITLE);
  expect(metaValue(head.meta, "property", "og:description")).toBe(
    PUBLIC_SEASON_UNAVAILABLE_DESCRIPTION,
  );
  expect(metaValue(head.meta, "property", "og:image")).toBe(PRODUCTION_OG_IMAGE_URL);
  expect(metaValue(head.meta, "name", "twitter:title")).toBe(PUBLIC_SEASON_UNAVAILABLE_TITLE);
  expect(metaValue(head.meta, "name", "twitter:description")).toBe(
    PUBLIC_SEASON_UNAVAILABLE_DESCRIPTION,
  );
});

test("unavailable Public Season head does not mention a display name or SITE_TITLE alone", () => {
  const head = publicSeasonDocumentHead({ kind: "unavailable" });
  const preview = [
    head.title,
    metaValue(head.meta, "name", "description"),
    metaValue(head.meta, "property", "og:title"),
    metaValue(head.meta, "property", "og:description"),
  ]
    .filter(Boolean)
    .join("\n");

  expect(preview).not.toMatch(/FinalsFan|PrivateFan|unknown/i);
  expect(head.title).not.toBe(SITE_TITLE);
});

test("publicSeasonPageUrl builds the production Public link URL", () => {
  expect(publicSeasonPageUrl("FinalsFan")).toBe("https://rank.rtabulov.dev/p/FinalsFan");
});
