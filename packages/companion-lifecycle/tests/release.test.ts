import { describe, expect, test } from "vite-plus/test";
import {
  COMPANION_BETA_DISCLAIMERS,
  COMPANION_KNOWN_ISSUES_URL,
  COMPANION_REPO_RELEASES_URL,
  pickLatestPrereleaseMsi,
  type GitHubRelease,
} from "../src/release.ts";

describe("pickLatestPrereleaseMsi", () => {
  const msiAsset = (name: string, url: string) => ({
    name,
    browser_download_url: url,
  });

  test("returns the newest pre-release MSI by published_at", () => {
    const releases: GitHubRelease[] = [
      {
        prerelease: true,
        published_at: "2026-01-01T00:00:00Z",
        tag_name: "companion-v0.1.0",
        assets: [
          msiAsset("Rank Tracker Companion_0.1.0_x64_en-US.msi", "https://example.com/old.msi"),
        ],
      },
      {
        prerelease: true,
        published_at: "2026-02-01T00:00:00Z",
        tag_name: "companion-v0.2.0",
        assets: [
          msiAsset("Rank Tracker Companion_0.2.0_x64_en-US.msi", "https://example.com/new.msi"),
        ],
      },
    ];

    expect(pickLatestPrereleaseMsi(releases)).toEqual({
      tagName: "companion-v0.2.0",
      assetName: "Rank Tracker Companion_0.2.0_x64_en-US.msi",
      downloadUrl: "https://example.com/new.msi",
    });
  });

  test("ignores stable releases and pre-releases without MSI assets", () => {
    const releases: GitHubRelease[] = [
      {
        prerelease: false,
        published_at: "2026-03-01T00:00:00Z",
        tag_name: "v1.0.0",
        assets: [msiAsset("stable.msi", "https://example.com/stable.msi")],
      },
      {
        prerelease: true,
        published_at: "2026-02-15T00:00:00Z",
        tag_name: "companion-v0.1.1",
        assets: [msiAsset("notes.txt", "https://example.com/notes.txt")],
      },
      {
        prerelease: true,
        published_at: "2026-02-01T00:00:00Z",
        tag_name: "companion-v0.1.0",
        assets: [msiAsset("beta.msi", "https://example.com/beta.msi")],
      },
    ];

    expect(pickLatestPrereleaseMsi(releases)).toEqual({
      tagName: "companion-v0.1.0",
      assetName: "beta.msi",
      downloadUrl: "https://example.com/beta.msi",
    });
  });

  test("returns null when no qualifying pre-release exists", () => {
    expect(pickLatestPrereleaseMsi([])).toBeNull();
    expect(
      pickLatestPrereleaseMsi([
        {
          prerelease: false,
          published_at: "2026-01-01T00:00:00Z",
          tag_name: "v1.0.0",
          assets: [msiAsset("stable.msi", "https://example.com/stable.msi")],
        },
      ]),
    ).toBeNull();
  });
});

describe("release constants", () => {
  test("known issues URL points at the website companion page anchor", () => {
    expect(COMPANION_KNOWN_ISSUES_URL).toBe("https://rank.rtabulov.dev/companion#known-issues");
  });

  test("repo releases URL is the GitHub releases page", () => {
    expect(COMPANION_REPO_RELEASES_URL).toBe("https://github.com/rtabulov/rank-tracker/releases");
  });

  test("beta disclaimers cover SmartScreen, ToS risk, and best-effort patches", () => {
    const joined = COMPANION_BETA_DISCLAIMERS.join(" ");
    expect(joined).toMatch(/SmartScreen/i);
    expect(joined).toMatch(/Terms of Service|ToS/i);
    expect(joined).toMatch(/ban/i);
    expect(joined).toMatch(/best-effort|patch/i);
  });
});
