import { describe, expect, test } from "vite-plus/test";
import {
  COMPANION_BRIDGE_BASE_URL,
  COMPANION_CORS_ORIGINS,
  type CompanionProposal,
} from "../src/contract.ts";
import { createLoopbackHandler } from "../src/handlers.ts";
import { createProposalStore } from "../src/proposal-store.ts";
import { startLoopbackServer } from "../src/server.ts";

function proposal(rs: number): CompanionProposal {
  return { rs, capturedAt: "2026-07-17T12:00:00.000Z" };
}

describe("loopback handlers", () => {
  test("GET /proposal returns 204 when empty", async () => {
    const store = createProposalStore();
    const handler = createLoopbackHandler({
      store,
      getHealth: () => ({ version: "0.1.0", phase: "idle", connected: false }),
      corsOrigins: [...COMPANION_CORS_ORIGINS],
    });
    const server = await startLoopbackServer(handler);
    try {
      const response = await fetch(`${server.url}/proposal`, {
        headers: { Origin: "http://localhost:5173" },
      });
      expect(response.status).toBe(204);
    } finally {
      await server.close();
    }
  });

  test("GET /proposal returns latest proposal JSON", async () => {
    const store = createProposalStore();
    store.set(proposal(25_644));
    const handler = createLoopbackHandler({
      store,
      getHealth: () => ({ version: "0.1.0", phase: "rs_ready", connected: false }),
      corsOrigins: [...COMPANION_CORS_ORIGINS],
    });
    const server = await startLoopbackServer(handler);
    try {
      const response = await fetch(`${server.url}/proposal`, {
        headers: { Origin: "https://rank.rtabulov.dev" },
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(proposal(25_644));
    } finally {
      await server.close();
    }
  });

  test("new capture overwrites pending proposal", async () => {
    const store = createProposalStore();
    store.set(proposal(10_000));
    store.set({ rs: 25_644, capturedAt: "2026-07-18T08:00:00.000Z" });
    const handler = createLoopbackHandler({
      store,
      getHealth: () => ({ version: "0.1.0", phase: "rs_ready", connected: false }),
      corsOrigins: [...COMPANION_CORS_ORIGINS],
    });
    const server = await startLoopbackServer(handler);
    try {
      const response = await fetch(`${server.url}/proposal`, {
        headers: { Origin: "http://127.0.0.1:5173" },
      });
      await expect(response.json()).resolves.toEqual({
        rs: 25_644,
        capturedAt: "2026-07-18T08:00:00.000Z",
      });
    } finally {
      await server.close();
    }
  });

  test("POST /proposal/clear is idempotent", async () => {
    const store = createProposalStore();
    store.set(proposal(12_345));
    const handler = createLoopbackHandler({
      store,
      getHealth: () => ({ version: "0.1.0", phase: "awaiting_pwa_save", connected: true }),
      corsOrigins: [...COMPANION_CORS_ORIGINS],
      onClear: () => undefined,
    });
    const server = await startLoopbackServer(handler);
    try {
      const first = await fetch(`${server.url}/proposal/clear`, {
        method: "POST",
        headers: { Origin: "http://localhost:5173" },
      });
      expect(first.status).toBe(204);
      expect(store.get()).toBeNull();

      const second = await fetch(`${server.url}/proposal/clear`, {
        method: "POST",
        headers: { Origin: "http://localhost:5173" },
      });
      expect(second.status).toBe(204);
    } finally {
      await server.close();
    }
  });

  test("GET /health exposes version and phase", async () => {
    const handler = createLoopbackHandler({
      store: createProposalStore(),
      getHealth: () => ({ version: "0.1.0", phase: "capturing", connected: false }),
      corsOrigins: [...COMPANION_CORS_ORIGINS],
    });
    const server = await startLoopbackServer(handler);
    try {
      const response = await fetch(`${server.url}/health`, {
        headers: { Origin: "http://localhost:5173" },
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        version: "0.1.0",
        phase: "capturing",
        connected: false,
      });
    } finally {
      await server.close();
    }
  });

  test("rejects disallowed Origin with 403", async () => {
    const handler = createLoopbackHandler({
      store: createProposalStore(),
      getHealth: () => ({ version: "0.1.0", phase: "idle", connected: false }),
      corsOrigins: [...COMPANION_CORS_ORIGINS],
    });
    const server = await startLoopbackServer(handler);
    try {
      const response = await fetch(`${server.url}/health`, {
        headers: { Origin: "https://evil.example" },
      });
      expect(response.status).toBe(403);
    } finally {
      await server.close();
    }
  });

  test("OPTIONS preflight returns CORS headers for allowlisted origin", async () => {
    const handler = createLoopbackHandler({
      store: createProposalStore(),
      getHealth: () => ({ version: "0.1.0", phase: "idle", connected: false }),
      corsOrigins: [...COMPANION_CORS_ORIGINS],
    });
    const server = await startLoopbackServer(handler);
    try {
      const response = await fetch(`${server.url}/proposal`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://rank.rtabulov.dev",
          "Access-Control-Request-Method": "GET",
        },
      });
      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://rank.rtabulov.dev");
    } finally {
      await server.close();
    }
  });
});

describe("default base url", () => {
  test("matches loopback host and port", () => {
    expect(COMPANION_BRIDGE_BASE_URL).toBe("http://127.0.0.1:37654");
  });
});
