import {
  COMPANION_BRIDGE_ROUTES,
  type CompanionHealth,
  type CompanionProposal,
} from "./contract.ts";
import type { ProposalStore } from "./proposal-store.ts";

type LoopbackHandlerDeps = {
  store: ProposalStore;
  getHealth: () => CompanionHealth;
  corsOrigins: readonly string[];
  onClear?: () => void;
  onPwaRequest?: (origin: string) => void;
};

function corsHeaders(origin: string | null, allowed: readonly string[]): HeadersInit {
  if (origin === null || !allowed.includes(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
  allowed: readonly string[],
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin, allowed),
    },
  });
}

function emptyResponse(
  status: number,
  origin: string | null,
  allowed: readonly string[],
): Response {
  return new Response(null, {
    status,
    headers: corsHeaders(origin, allowed),
  });
}

function requestOrigin(request: Request): string | null {
  return request.headers.get("Origin");
}

function isAllowedOrigin(origin: string | null, allowed: readonly string[]): boolean {
  return origin !== null && allowed.includes(origin);
}

function pathname(request: Request): string {
  return new URL(request.url).pathname;
}

export function createLoopbackHandler(deps: LoopbackHandlerDeps) {
  const { store, getHealth, corsOrigins, onClear, onPwaRequest } = deps;

  return async function handleLoopbackRequest(request: Request): Promise<Response> {
    const origin = requestOrigin(request);
    const method = request.method.toUpperCase();
    const path = pathname(request);

    if (method === "OPTIONS") {
      if (!isAllowedOrigin(origin, corsOrigins)) {
        return emptyResponse(403, origin, corsOrigins);
      }
      return emptyResponse(204, origin, corsOrigins);
    }

    if (!isAllowedOrigin(origin, corsOrigins)) {
      return emptyResponse(403, origin, corsOrigins);
    }

    onPwaRequest?.(origin!);

    if (method === "GET" && path === COMPANION_BRIDGE_ROUTES.health) {
      return jsonResponse(getHealth(), 200, origin, corsOrigins);
    }

    if (method === "GET" && path === COMPANION_BRIDGE_ROUTES.proposal) {
      const proposal = store.get();
      if (proposal === null) {
        return emptyResponse(204, origin, corsOrigins);
      }
      return jsonResponse(proposal satisfies CompanionProposal, 200, origin, corsOrigins);
    }

    if (method === "POST" && path === COMPANION_BRIDGE_ROUTES.clear) {
      store.clear();
      onClear?.();
      return emptyResponse(204, origin, corsOrigins);
    }

    return emptyResponse(404, origin, corsOrigins);
  };
}
