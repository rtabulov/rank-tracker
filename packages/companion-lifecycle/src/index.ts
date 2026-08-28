export {
  type Action,
  type CompanionState,
  type Phase,
  type Variant,
  initialState,
  legalActions,
  readyToCapture,
  reduce,
} from "./machine.ts";
export {
  actionLabel,
  primaryCta,
  trayBalloon,
  trayTooltip,
  type TrayBalloon,
} from "./tray-copy.ts";
export {
  NPCAP_DOWNLOAD_URL,
  interpretNpcapProbe,
  type NpcapProbeContext,
  type NpcapProbeFacts,
} from "./npcap.ts";
export { SSLKEYLOGFILE_ENV, sslKeyLogPlan, type SslKeyLogPlan } from "./ssl-keylog-plan.ts";
export {
  EMBEDDED_DEFAULT_CARRIER,
  extractRsFromHttpJson,
  hostMatchesPattern,
  type ExtractRsResult,
  type HttpJsonFrame,
  type RsCarrier,
} from "./rs-carrier.ts";
export {
  autoPickInterface,
  interpretCaptureObservation,
  type CaptureInterface,
  type CaptureObservation,
} from "./capture-runtime.ts";
export {
  COMPANION_MANIFEST_URL,
  compareSemver,
  defaultMergedCarriers,
  manifestTrayWarnings,
  mergeRsCarriers,
  parseCompanionManifest,
  type CompanionManifest,
  type CompanionManifestJson,
  type KnownBroken,
} from "./manifest.ts";
export { bodyScanForRs, DEFAULT_RS_FIELD_ALIASES, type BodyScanResult } from "./body-scan.ts";
export {
  extractBestRsFromFrames,
  type ExtractionResult,
  type TimestampedHttpJsonFrame,
} from "./rs-extraction.ts";
export {
  isQualifiedCaptureAttempt,
  shouldReportCaptureBroken,
  type QualifiedCaptureContext,
} from "./break-detection.ts";
export { buildCaptureDebugInfo, type CaptureDebugInput } from "./debug-info.ts";
export {
  COMPANION_BETA_DISCLAIMERS,
  COMPANION_DOWNLOAD_PAGE_URL,
  COMPANION_GITHUB_RELEASES_API,
  COMPANION_KNOWN_ISSUES_URL,
  COMPANION_REPO,
  COMPANION_REPO_RELEASES_URL,
  pickLatestPrereleaseMsi,
  type GitHubRelease,
  type GitHubReleaseAsset,
  type PrereleaseMsiAsset,
} from "./release.ts";
