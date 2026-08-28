import { createServer, type IncomingMessage, type Server } from "node:http";
import { COMPANION_BRIDGE_HOST, COMPANION_BRIDGE_PORT } from "./contract.ts";

async function readBody(request: IncomingMessage): Promise<Uint8Array | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return undefined;
  }
  return Buffer.concat(chunks);
}

export type LoopbackServer = {
  url: string;
  close: () => Promise<void>;
};

export async function startLoopbackServer(
  handleRequest: (request: Request) => Response | Promise<Response>,
  options: { host?: string; port?: number } = {},
): Promise<LoopbackServer> {
  const host = options.host ?? COMPANION_BRIDGE_HOST;
  const port = options.port ?? 0;

  const server: Server = await new Promise((resolve, reject) => {
    const created = createServer((nodeRequest, nodeResponse) => {
      void (async () => {
        try {
          const bound = created.address();
          const boundPort = bound !== null && typeof bound !== "string" ? bound.port : port;
          const url = `http://${host}:${boundPort}${nodeRequest.url ?? "/"}`;
          const headers = new Headers();
          for (const [key, value] of Object.entries(nodeRequest.headers)) {
            if (value === undefined) {
              continue;
            }
            headers.set(key, Array.isArray(value) ? value.join(", ") : value);
          }
          const body = await readBody(nodeRequest);
          const request = new Request(url, {
            method: nodeRequest.method,
            headers,
            body: body === undefined ? undefined : new Uint8Array(body),
          });
          const response = await handleRequest(request);
          nodeResponse.statusCode = response.status;
          response.headers.forEach((value, key) => {
            nodeResponse.setHeader(key, value);
          });
          const bytes = new Uint8Array(await response.arrayBuffer());
          nodeResponse.end(bytes.length > 0 ? bytes : undefined);
        } catch (error) {
          nodeResponse.statusCode = 500;
          nodeResponse.end(error instanceof Error ? error.message : "internal error");
        }
      })();
    });
    created.once("error", reject);
    created.listen(port, host, () => resolve(created));
  });

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("loopback server failed to bind");
  }

  const boundPort = address.port;
  const url = `http://${host}:${boundPort}`;

  return {
    url,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

/** Default companion listen port (fixed in production Rust host). */
export const DEFAULT_LOOPBACK_PORT = COMPANION_BRIDGE_PORT;
