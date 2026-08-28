import {
  COMPANION_GITHUB_RELEASES_API,
  COMPANION_REPO_RELEASES_URL,
  pickLatestPrereleaseMsi,
  type GitHubRelease,
} from "companion-lifecycle";

export type CompanionDownloadTarget =
  | {
      kind: "msi";
      tagName: string;
      assetName: string;
      downloadUrl: string;
    }
  | { kind: "releases-index" };

export function resolveCompanionDownload(
  releases: readonly GitHubRelease[],
): CompanionDownloadTarget {
  const msi = pickLatestPrereleaseMsi(releases);
  if (!msi) {
    return { kind: "releases-index" };
  }
  return { kind: "msi", ...msi };
}

export async function fetchCompanionDownloadTarget(
  fetchImpl: typeof fetch = fetch,
): Promise<CompanionDownloadTarget> {
  const response = await fetchImpl(COMPANION_GITHUB_RELEASES_API, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    return { kind: "releases-index" };
  }
  const releases = (await response.json()) as GitHubRelease[];
  return resolveCompanionDownload(releases);
}

export { COMPANION_REPO_RELEASES_URL };
