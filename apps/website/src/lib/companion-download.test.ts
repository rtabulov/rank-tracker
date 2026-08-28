import { describe, expect, test } from "vite-plus/test";
import { resolveCompanionDownload } from "./companion-download.ts";

describe("resolveCompanionDownload", () => {
  test("returns MSI link when a pre-release asset exists", () => {
    const result = resolveCompanionDownload([
      {
        prerelease: true,
        published_at: "2026-02-01T00:00:00Z",
        tag_name: "companion-v0.1.0",
        assets: [
          {
            name: "Rank Tracker Companion_0.1.0_x64_en-US.msi",
            browser_download_url: "https://github.com/download/beta.msi",
          },
        ],
      },
    ]);

    expect(result).toEqual({
      kind: "msi",
      tagName: "companion-v0.1.0",
      assetName: "Rank Tracker Companion_0.1.0_x64_en-US.msi",
      downloadUrl: "https://github.com/download/beta.msi",
    });
  });

  test("falls back to releases index when no pre-release MSI is available", () => {
    expect(resolveCompanionDownload([])).toEqual({ kind: "releases-index" });
    expect(
      resolveCompanionDownload([
        {
          prerelease: false,
          published_at: "2026-03-01T00:00:00Z",
          tag_name: "v1.0.0",
          assets: [
            {
              name: "stable.msi",
              browser_download_url: "https://github.com/download/stable.msi",
            },
          ],
        },
      ]),
    ).toEqual({ kind: "releases-index" });
  });
});
