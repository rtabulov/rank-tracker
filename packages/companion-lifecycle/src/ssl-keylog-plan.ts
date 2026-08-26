/** Windows per-user TLS key-log layout for the companion MSI / first-run setup. */

export const SSLKEYLOGFILE_ENV = "SSLKEYLOGFILE" as const;

export type SslKeyLogPlan = {
  envName: typeof SSLKEYLOGFILE_ENV;
  /** Directory that must exist with restrictive ACLs (TLS secrets). */
  keyLogDirPath: string;
  /** Absolute path `SSLKEYLOGFILE` should point at. */
  keyLogFilePath: string;
  requiresRestrictiveAcl: true;
  scope: "per-user";
};

function joinWindowsPath(...parts: string[]): string {
  return parts
    .map((part, index) => {
      if (index === 0) {
        return part.replace(/[/\\]+$/u, "");
      }
      return part.replace(/^[/\\]+|[/\\]+$/gu, "");
    })
    .filter((part) => part.length > 0)
    .join("\\");
}

/**
 * Pure plan for where the MSI / elevated setup writes the per-user key log.
 * Does not touch the filesystem — adapters apply this plan on Windows.
 */
export function sslKeyLogPlan(userProfileDir: string): SslKeyLogPlan {
  const keyLogDirPath = joinWindowsPath(
    userProfileDir,
    "AppData",
    "Local",
    "RankTrackerCompanion",
    "tls",
  );
  return {
    envName: SSLKEYLOGFILE_ENV,
    keyLogDirPath,
    keyLogFilePath: joinWindowsPath(keyLogDirPath, "sslkeys.log"),
    requiresRestrictiveAcl: true,
    scope: "per-user",
  };
}
