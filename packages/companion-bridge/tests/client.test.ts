import { describe, expect, test } from "vite-plus/test";
import {
  createFetchCompanionProposalClient,
  createMemoryCompanionProposalClient,
} from "../src/client.ts";
import { createLoopbackHandler } from "../src/handlers.ts";
import { createProposalStore } from "../src/proposal-store.ts";
import { startLoopbackServer } from "../src/server.ts";
import { COMPANION_CORS_ORIGINS } from "../src/contract.ts";

describe("companion proposal client", () => {
  test("memory client returns configured proposal", async () => {
    const client = createMemoryCompanionProposalClient({
      proposal: { rs: 25_644, capturedAt: "2026-07-17T12:00:00.000Z" },
      health: { version: "0.1.0", phase: "rs_ready", connected: false },
    });
    await expect(client.getProposal()).resolves.toEqual({
      rs: 25_644,
      capturedAt: "2026-07-17T12:00:00.000Z",
    });
    await expect(client.getHealth()).resolves.toEqual({
      version: "0.1.0",
      phase: "rs_ready",
      connected: false,
    });
  });

  test("memory clearProposal removes proposal", async () => {
    const client = createMemoryCompanionProposalClient({
      proposal: { rs: 12_345, capturedAt: "2026-07-17T12:00:00.000Z" },
    });
    await client.clearProposal();
    await expect(client.getProposal()).resolves.toBeNull();
  });

  test("fetch client reads live loopback server", async () => {
    const store = createProposalStore();
    store.set({ rs: 42_000, capturedAt: "2026-07-17T12:00:00.000Z" });
    const handler = createLoopbackHandler({
      store,
      getHealth: () => ({ version: "0.1.0", phase: "rs_ready", connected: false }),
      corsOrigins: [...COMPANION_CORS_ORIGINS],
    });
    const server = await startLoopbackServer(handler);
    const client = createFetchCompanionProposalClient(server.url);
    try {
      await expect(client.getProposal()).resolves.toEqual({
        rs: 42_000,
        capturedAt: "2026-07-17T12:00:00.000Z",
      });
      await client.clearProposal();
      await expect(client.getProposal()).resolves.toBeNull();
    } finally {
      await server.close();
    }
  });
});
