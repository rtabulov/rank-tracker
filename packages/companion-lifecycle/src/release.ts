export const COMPANION_REPO = "rtabulov/rank-tracker";
export const COMPANION_REPO_RELEASES_URL = `https://github.com/${COMPANION_REPO}/releases`;
export const COMPANION_DOWNLOAD_PAGE_URL = "https://rank.rtabulov.dev/companion";
export const COMPANION_KNOWN_ISSUES_URL = `${COMPANION_DOWNLOAD_PAGE_URL}#known-issues`;
export const COMPANION_GITHUB_RELEASES_API = `https://api.github.com/repos/${COMPANION_REPO}/releases`;

/** Private beta disclaimers shown on the download page and in release docs. */
export const COMPANION_BETA_DISCLAIMERS = [
  "Private beta: the MSI is unsigned. Windows SmartScreen may warn — choose More info → Run anyway if you accept the risk.",
  "THE FINALS Terms of Service prohibit packet capture. Account ban is possible. This companion is not Embark-approved.",
  "Patch survival is best-effort, not guaranteed. Check known issues after major game updates.",
] as const;

export type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

export type GitHubRelease = {
  prerelease: boolean;
  published_at: string;
  tag_name: string;
  assets: GitHubReleaseAsset[];
};

export type PrereleaseMsiAsset = {
  tagName: string;
  assetName: string;
  downloadUrl: string;
};

const MSI_PATTERN = /\.msi$/i;

/** Pick the newest GitHub pre-release that ships an MSI asset. */
export function pickLatestPrereleaseMsi(
  releases: readonly GitHubRelease[],
): PrereleaseMsiAsset | null {
  const candidates = releases
    .filter((release) => release.prerelease)
    .map((release) => {
      const msi = release.assets.find((asset) => MSI_PATTERN.test(asset.name));
      if (!msi) {
        return null;
      }
      return {
        tagName: release.tag_name,
        assetName: msi.name,
        downloadUrl: msi.browser_download_url,
        publishedAt: release.published_at,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  if (candidates.length === 0) {
    return null;
  }

  const latest = candidates[0];
  return {
    tagName: latest.tagName,
    assetName: latest.assetName,
    downloadUrl: latest.downloadUrl,
  };
}
