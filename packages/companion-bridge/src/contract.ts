export const COMPANION_BRIDGE_HOST = "127.0.0.1";
export const COMPANION_BRIDGE_PORT = 37_654;
export const COMPANION_BRIDGE_BASE_URL = `http://${COMPANION_BRIDGE_HOST}:${COMPANION_BRIDGE_PORT}`;

/** Production Rank Tracker origin plus local dev servers. */
export const COMPANION_CORS_ORIGINS = [
  "https://rank.rtabulov.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
] as const;

export const RANK_TRACKER_PRODUCTION_URL = "https://rank.rtabulov.dev/";

export type CompanionProposal = {
  rs: number;
  capturedAt: string;
};

export type CompanionHealth = {
  version: string;
  phase: string;
  connected: boolean;
};

export const COMPANION_BRIDGE_ROUTES = {
  proposal: "/proposal",
  clear: "/proposal/clear",
  health: "/health",
} as const;
