import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "@tanstack/react-router";
import { expect, test, vi } from "vite-plus/test";
import { App, createAppRouter } from "./App.tsx";
import { createMemoryAuthClient } from "./lib/auth";
import { createMemoryCloudEntriesClient } from "./lib/cloud-entries";
import { createMemoryProfileClient } from "./lib/profile";
import { createMemoryStorageAdapter, LOCAL_STORE_KEY } from "./lib/local-store";
import { APP_SCHEMA_VERSION } from "./lib/schema";
import { SYNC_STATE_KEY } from "./lib/sync-state";

const CURRENT_SEASON_NUMBER = 11;

function createSignedInClients(input?: {
  userId?: string;
  email?: string | null;
  displayName?: string | null;
  takenDisplayNames?: string[];
}) {
  const userId = input?.userId ?? "player-1";
  const email = input?.email === undefined ? "player@example.com" : input.email;
  const authClient = createMemoryAuthClient({ userId, email });
  const profileClient = createMemoryProfileClient({
    profiles:
      input?.displayName === undefined
        ? undefined
        : {
            [userId]:
              input.displayName === null
                ? { displayName: null, isPublic: false }
                : { displayName: input.displayName, isPublic: false },
          },
    takenDisplayNames: input?.takenDisplayNames,
  });
  const entriesClient = createMemoryCloudEntriesClient();
  return { authClient, profileClient, entriesClient, userId };
}

function entryFixture(input: { id: string; rs: number; recordedAt: string; updatedAt?: string }) {
  return {
    id: input.id,
    rs: input.rs,
    recordedAt: input.recordedAt,
    updatedAt: input.updatedAt ?? input.recordedAt,
  };
}

function createStoreWithSeason10Entry() {
  return {
    version: APP_SCHEMA_VERSION,
    entries: [entryFixture({ id: "s10-entry", rs: 8000, recordedAt: "2026-04-01T10:00:00.000Z" })],
  };
}

test("composed tree renders the home shell via the router under the base path", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  expect(await screen.findByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();
});

test("D hotkey cycles explicit light and dark on the document", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  expect(await screen.findByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /toggle theme/i }));
  await user.click(screen.getByRole("menuitem", { name: /^dark$/i }));
  expect(document.documentElement).toHaveClass("dark");

  await user.keyboard("{d}");
  expect(document.documentElement).toHaveClass("light");
  expect(document.documentElement).not.toHaveClass("dark");

  await user.keyboard("{d}");
  expect(document.documentElement).toHaveClass("dark");
  expect(document.documentElement).not.toHaveClass("light");
});

test("D hotkey from system theme sets an explicit light or dark theme", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  expect(await screen.findByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();
  expect(document.documentElement).toHaveClass("light");
  expect(document.documentElement).not.toHaveClass("dark");

  await user.keyboard("{d}");
  expect(document.documentElement).toHaveClass("dark");
  expect(document.documentElement).not.toHaveClass("light");
  expect(window.localStorage.getItem("vite-ui-theme")).toBe("dark");
});

test("toggling theme updates effective light/dark on the document", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  expect(await screen.findByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /toggle theme/i }));
  await user.click(screen.getByRole("menuitem", { name: /^dark$/i }));
  expect(document.documentElement).toHaveClass("dark");

  await user.click(screen.getByRole("button", { name: /toggle theme/i }));
  await user.click(screen.getByRole("menuitem", { name: /^light$/i }));
  expect(document.documentElement).toHaveClass("light");
  expect(document.documentElement).not.toHaveClass("dark");
});

test("empty Local store opens Current Season view with empty hero and timeline", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const storageAdapter = createMemoryStorageAdapter();

  render(<App router={router} storageAdapter={storageAdapter} />);

  expect(
    await screen.findByRole("heading", { name: /season 11 \(current\)/i }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("No RS logged")).toHaveTextContent("—");
  expect(screen.getByText("Log your first RS to get started.")).toBeInTheDocument();
  expect(screen.queryByLabelText("RS sparkline")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Season summary")).not.toBeInTheDocument();
  expect(screen.getByText("No Entries yet.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Log RS" })).toBeInTheDocument();
  expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
});

test("selected Season is represented in the URL", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  await screen.findByRole("heading", { name: /season 11 \(current\)/i });

  expect(history.location.search).toContain(`season=${CURRENT_SEASON_NUMBER}`);
});

test("season search param from the URL selects that Season", async () => {
  const history = createMemoryHistory({
    initialEntries: [`/rank-tracker/?season=${CURRENT_SEASON_NUMBER}`],
  });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  expect(
    await screen.findByRole("heading", { name: /season 11 \(current\)/i }),
  ).toBeInTheDocument();
  expect(history.location.search).toContain(`season=${CURRENT_SEASON_NUMBER}`);
});

test("Log RS opens overlay with Save and recordedAt fields", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  await user.click(await screen.findByRole("button", { name: "Log RS" }));

  expect(await screen.findByRole("dialog", { name: "Log RS" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  expect(screen.getByLabelText(/^rs$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^recorded at$/i)).toBeInTheDocument();
});

test("Escape dismisses Log RS overlay without saving", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  expect(await screen.findByRole("dialog", { name: "Log RS" })).toBeInTheDocument();

  await user.keyboard("{Escape}");

  expect(screen.queryByRole("dialog", { name: "Log RS" })).not.toBeInTheDocument();
});

test("invalid RS shows validation error in Log RS overlay", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByText("RS is required")).toBeInTheDocument();
});

test("saving Log RS persists Entry and shows populated Current Season view", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const storageAdapter = createMemoryStorageAdapter();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={storageAdapter} />);

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-07-16T10:00");
  await user.type(screen.getByLabelText(/^rs$/i), "42000");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("42,000");
  expect(screen.getByLabelText("RS sparkline")).toBeInTheDocument();
  expect(screen.getByLabelText("Season summary")).toBeInTheDocument();
  expect(screen.getByText(/RS 42,000/i)).toBeInTheDocument();
  expect(screen.queryByText("No Entries yet.")).not.toBeInTheDocument();

  const raw = storageAdapter.getItem("rank-tracker-local-store");
  expect(raw).not.toBeNull();
  const store = JSON.parse(raw!) as {
    version: number;
    entries: Array<{ id: string; rs: number; recordedAt: string; updatedAt: string }>;
  };
  expect(store.entries).toHaveLength(1);
  expect(store.entries[0]?.rs).toBe(42000);
  expect(store.entries[0]?.id).toBeTruthy();
  expect(store.entries[0]?.recordedAt).toMatch(/^2026-07-16T/);
  expect(store.entries[0]?.updatedAt).toMatch(/^2026-07-17T12:00:00/);
  vi.useRealTimers();
});

test("populated Current Season with one Entry omits sparse summary metrics", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00"));

  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      initialStore={{
        version: 1,
        entries: [
          {
            id: "entry-1",
            rs: 5000,
            recordedAt: "2026-07-15T10:00:00.000Z",
          },
        ],
      }}
    />,
  );

  const summary = await screen.findByLabelText("Season summary");
  expect(summary).toHaveTextContent("Season net");
  expect(summary).toHaveTextContent("0");
  expect(summary).toHaveTextContent("5,000");
  expect(screen.queryByText("Avg Δ per Entry")).not.toBeInTheDocument();
  expect(screen.queryByText("Δ last 7 days")).not.toBeInTheDocument();
  expect(summary).toHaveTextContent("Days since last Entry");
  expect(summary).toHaveTextContent("2");

  vi.useRealTimers();
});

test("populated season shows retro HUD chrome and entry deltas", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      initialStore={{
        version: 1,
        entries: [
          {
            id: "entry-a",
            rs: 10000,
            recordedAt: "2026-07-14T10:00:00.000Z",
          },
          {
            id: "entry-b",
            rs: 12500,
            recordedAt: "2026-07-16T10:00:00.000Z",
          },
        ],
      }}
    />,
  );

  expect(await screen.findByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();
  expect(screen.getByText(/sys \/\/ rank/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Entry timeline" })).toBeInTheDocument();
  expect(screen.getByLabelText("Season hero")).toHaveTextContent("12,500");
  expect(screen.getByLabelText("Season hero")).toHaveTextContent("+2,500");
  expect(screen.getByLabelText("Entry timeline")).toHaveTextContent("+2,500");
});

test("Entries survive remount via the Local store", async () => {
  const user = userEvent.setup();
  const storageAdapter = createMemoryStorageAdapter();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  const first = render(<App router={router} storageAdapter={storageAdapter} />);

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-07-16T10:00");
  await user.type(screen.getByLabelText(/^rs$/i), "41000");
  await user.click(screen.getByRole("button", { name: "Save" }));

  await screen.findByLabelText("Season hero");
  first.unmount();

  render(<App router={router} storageAdapter={storageAdapter} />);

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("41,000");
  expect(screen.getByLabelText("RS sparkline")).toBeInTheDocument();
});

test("Log RS overlay uses drawer chrome on narrow viewports", async () => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query === "(max-width: 640px)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  await user.click(await screen.findByRole("button", { name: "Log RS" }));

  expect(await screen.findByRole("dialog", { name: "Log RS" })).toHaveAttribute(
    "data-overlay-variant",
    "drawer",
  );
});

test("Import success replaces Local store and refreshes Season view", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const storageAdapter = createMemoryStorageAdapter({
    version: 1,
    entries: [],
  });

  render(<App router={router} storageAdapter={storageAdapter} />);

  await screen.findByText("No Entries yet.");

  const importDocument = {
    version: 1,
    entries: [
      {
        id: "imported-entry-1",
        rs: 55000,
        recordedAt: "2026-07-16T10:00:00.000Z",
      },
    ],
  };
  const file = new File([JSON.stringify(importDocument)], "backup.json", {
    type: "application/json",
  });

  await user.click(await screen.findByRole("button", { name: "Data" }));
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(fileInput, file);

  expect(await screen.findByRole("dialog", { name: "Import" })).toBeInTheDocument();
  expect(screen.getByText(/replace your current Local store/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Replace" }));

  expect(screen.queryByRole("dialog", { name: "Import" })).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog", { name: "Data" })).not.toBeInTheDocument();
  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("55,000");
  expect(screen.getByText(/RS 55,000/i)).toBeInTheDocument();

  const raw = storageAdapter.getItem("rank-tracker-local-store");
  expect(JSON.parse(raw!)).toEqual({
    version: APP_SCHEMA_VERSION,
    entries: [
      entryFixture({
        id: "imported-entry-1",
        rs: 55000,
        recordedAt: "2026-07-16T10:00:00.000Z",
      }),
    ],
  });
});

test("Import failure leaves Local store unchanged and shows category error on Data", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const initialStore = {
    version: 1,
    entries: [
      {
        id: "keep-me",
        rs: 12000,
        recordedAt: "2026-07-16T10:00:00.000Z",
      },
    ],
  };
  const storageAdapter = createMemoryStorageAdapter(initialStore);

  render(<App router={router} storageAdapter={storageAdapter} initialStore={initialStore} />);

  await screen.findByLabelText("Season hero");

  const file = new File(["not-json"], "bad.json", { type: "application/json" });
  await user.click(screen.getByRole("button", { name: "Data" }));
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(fileInput, file);

  expect(await screen.findByText("Invalid JSON.")).toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "Data" })).toBeInTheDocument();
  expect(JSON.parse(storageAdapter.getItem("rank-tracker-local-store")!)).toEqual(initialStore);
  expect(screen.getByLabelText("Season hero")).toHaveTextContent("12,000");
});

test("Import rejects duplicate Entry ids without changing Local store", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const initialStore = {
    version: 1,
    entries: [
      {
        id: "keep-me",
        rs: 12000,
        recordedAt: "2026-07-16T10:00:00.000Z",
      },
    ],
  };
  const storageAdapter = createMemoryStorageAdapter(initialStore);

  render(<App router={router} storageAdapter={storageAdapter} initialStore={initialStore} />);

  await screen.findByLabelText("Season hero");

  const importDocument = {
    version: 1,
    entries: [
      { id: "dup", rs: 1000, recordedAt: "2026-07-10T10:00:00.000Z" },
      { id: "dup", rs: 2000, recordedAt: "2026-07-11T10:00:00.000Z" },
    ],
  };
  const file = new File([JSON.stringify(importDocument)], "dup.json", {
    type: "application/json",
  });

  await user.click(screen.getByRole("button", { name: "Data" }));
  await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);

  expect(await screen.findByText("Wrong file shape.")).toBeInTheDocument();
  expect(JSON.parse(storageAdapter.getItem("rank-tracker-local-store")!)).toEqual(initialStore);
});

test("Import migrates lower version and replaces Local store", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const storageAdapter = createMemoryStorageAdapter({ version: 1, entries: [] });

  render(<App router={router} storageAdapter={storageAdapter} />);

  await screen.findByText("No Entries yet.");

  const importDocument = {
    version: 0,
    entries: [
      {
        id: "migrated-entry-1",
        rs: 42000,
        recordedAt: "2026-07-16T10:00:00.000Z",
      },
    ],
  };
  const file = new File([JSON.stringify(importDocument)], "legacy.json", {
    type: "application/json",
  });

  await user.click(await screen.findByRole("button", { name: "Data" }));
  await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
  await user.click(await screen.findByRole("button", { name: "Replace" }));

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("42,000");
  expect(JSON.parse(storageAdapter.getItem("rank-tracker-local-store")!)).toEqual({
    version: APP_SCHEMA_VERSION,
    entries: [
      entryFixture({
        id: "migrated-entry-1",
        rs: 42000,
        recordedAt: "2026-07-16T10:00:00.000Z",
      }),
    ],
  });
});

test("Import ignores unknown fields and persists only Local store shape", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const storageAdapter = createMemoryStorageAdapter({ version: 1, entries: [] });

  render(<App router={router} storageAdapter={storageAdapter} />);

  await screen.findByText("No Entries yet.");

  const importDocument = {
    version: 1,
    exportedAt: "2026-07-17T12:00:00.000Z",
    entries: [
      {
        id: "imported-entry-1",
        rs: 55000,
        recordedAt: "2026-07-16T10:00:00.000Z",
        notes: "ignore me",
      },
    ],
  };
  const file = new File([JSON.stringify(importDocument)], "forward-compat.json", {
    type: "application/json",
  });

  await user.click(await screen.findByRole("button", { name: "Data" }));
  await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
  await user.click(await screen.findByRole("button", { name: "Replace" }));

  expect(JSON.parse(storageAdapter.getItem("rank-tracker-local-store")!)).toEqual({
    version: APP_SCHEMA_VERSION,
    entries: [
      entryFixture({
        id: "imported-entry-1",
        rs: 55000,
        recordedAt: "2026-07-16T10:00:00.000Z",
      }),
    ],
  });
});

test("Import rejects unsupported version without changing Local store", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const initialStore = { version: 1, entries: [] };
  const storageAdapter = createMemoryStorageAdapter(initialStore);

  render(<App router={router} storageAdapter={storageAdapter} initialStore={initialStore} />);

  await screen.findByText("No Entries yet.");

  const importDocument = { version: 99, entries: [] };
  const file = new File([JSON.stringify(importDocument)], "future.json", {
    type: "application/json",
  });

  await user.click(screen.getByRole("button", { name: "Data" }));
  await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);

  expect(await screen.findByText("Unsupported version.")).toBeInTheDocument();
  expect(JSON.parse(storageAdapter.getItem("rank-tracker-local-store")!)).toEqual(initialStore);
});

test("Export blocked download shows failure line on Data", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
    throw new Error("blocked");
  });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  await user.click(await screen.findByRole("button", { name: "Data" }));
  await user.click(screen.getByRole("button", { name: "Export" }));

  expect(await screen.findByText(/export failed/i)).toBeInTheDocument();

  createObjectURLSpy.mockRestore();
});

test("Export downloads Local store JSON with dated filename", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const initialStore = {
    version: APP_SCHEMA_VERSION,
    entries: [
      entryFixture({
        id: "export-entry-1",
        rs: 33000,
        recordedAt: "2026-07-15T10:00:00.000Z",
      }),
    ],
  };

  const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const click = vi.fn();
  let downloadedFilename = "";
  const originalCreateElement = document.createElement.bind(document);
  const createElementSpy = vi
    .spyOn(document, "createElement")
    .mockImplementation((tagName, options) => {
      if (tagName === "a") {
        return {
          get download() {
            return downloadedFilename;
          },
          set download(value: string) {
            downloadedFilename = value;
          },
          href: "",
          click,
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName, options);
    });

  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter(initialStore)}
      initialStore={initialStore}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Data" }));
  await user.click(screen.getByRole("button", { name: "Export" }));

  expect(createObjectURLSpy).toHaveBeenCalled();
  const firstCall = createObjectURLSpy.mock.calls[0];
  expect(firstCall).toBeDefined();
  const blob = firstCall![0] as Blob;
  expect(blob.type).toBe("application/json");
  const exported = JSON.parse(await blob.text()) as typeof initialStore;
  expect(exported).toEqual(initialStore);

  expect(downloadedFilename).toBe("rank-tracker-export-2026-07-17.json");
  expect(click).toHaveBeenCalled();

  createElementSpy.mockRestore();
  createObjectURLSpy.mockRestore();
  revokeObjectURLSpy.mockRestore();
  vi.useRealTimers();
});

test("header gear opens Data sheet with Export and Import only", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={createMemoryAuthClient()}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Data" }));

  expect(await screen.findByRole("dialog", { name: "Data" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
});

test("Data sheet overlay portals to document body above the page shell", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={createMemoryAuthClient()}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Data" }));
  const dialog = await screen.findByRole("dialog", { name: "Data" });

  expect(dialog.parentElement?.parentElement).toBe(document.body);
});

test("signed-out Data sheet offers Discord, Google, and magic link sign-in", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={createMemoryAuthClient()}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });

  expect(within(data).getByRole("button", { name: "Sign in with Discord" })).toBeInTheDocument();
  expect(within(data).getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument();
  expect(within(data).getByLabelText(/^email$/i)).toBeInTheDocument();
  expect(within(data).getByRole("button", { name: "Send magic link" })).toBeInTheDocument();
  expect(within(data).queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
});

test("restored session shows signed-in state and Sign out in Data sheet", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({ displayName: "FinalsFan" });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });

  expect(within(data).getByText("Signed in as player@example.com")).toBeInTheDocument();
  expect(within(data).getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  expect(
    within(data).queryByRole("button", { name: "Sign in with Discord" }),
  ).not.toBeInTheDocument();
});

test("Sign out keeps Local store Entries intact", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({ displayName: "FinalsFan" });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
      initialStore={{
        version: 1,
        entries: [
          {
            id: "keep-me",
            rs: 42000,
            recordedAt: "2026-07-15T10:00:00.000Z",
          },
        ],
      }}
    />,
  );

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("42,000");

  await user.click(screen.getByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });
  await user.click(within(data).getByRole("button", { name: "Sign out" }));

  expect(
    await within(data).findByRole("button", { name: "Sign in with Discord" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Season hero")).toHaveTextContent("42,000");
});

test("Send magic link shows check-email status without signing in", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={createMemoryAuthClient()}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });
  await user.type(within(data).getByLabelText(/^email$/i), "player@example.com");
  await user.click(within(data).getByRole("button", { name: "Send magic link" }));

  expect(await within(data).findByRole("status")).toHaveTextContent(
    "Check your email for a magic link.",
  );
  expect(within(data).getByRole("button", { name: "Sign in with Discord" })).toBeInTheDocument();
});

test("Send magic link shows loading state until the request finishes", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const authClient = createMemoryAuthClient();
  let resolveMagicLink!: (result: { error: string | null }) => void;
  const pendingMagicLink = new Promise<{ error: string | null }>((resolve) => {
    resolveMagicLink = resolve;
  });
  authClient.signInWithMagicLink = async () => pendingMagicLink;

  render(
    <App router={router} storageAdapter={createMemoryStorageAdapter()} authClient={authClient} />,
  );

  await user.click(await screen.findByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });
  await user.type(within(data).getByLabelText(/^email$/i), "player@example.com");
  await user.click(within(data).getByRole("button", { name: "Send magic link" }));

  const sending = within(data).getByRole("button", { name: "Sending…" });
  expect(sending).toBeDisabled();
  expect(sending).toHaveAttribute("aria-busy", "true");
  expect(within(data).queryByRole("status")).not.toBeInTheDocument();

  resolveMagicLink({ error: null });

  expect(await within(data).findByRole("status")).toHaveTextContent(
    "Check your email for a magic link.",
  );
  expect(within(data).getByRole("button", { name: "Send magic link" })).toBeEnabled();
});

test("Edit on an Entry row opens Edit overlay with editable rs and recordedAt", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      initialStore={{
        version: 1,
        entries: [
          {
            id: "entry-edit-1",
            rs: 42000,
            recordedAt: "2026-07-15T10:00:00.000Z",
          },
        ],
      }}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Edit entry-edit-1" }));

  expect(await screen.findByRole("dialog", { name: "Edit Entry" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  expect(screen.getByLabelText(/^rs$/i)).toHaveValue("42000");
  expect(screen.getByLabelText(/^recorded at$/i)).toBeInTheDocument();
});

test("saving Edit Entry persists changes with stable id", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const storageAdapter = createMemoryStorageAdapter();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={storageAdapter}
      initialStore={{
        version: 1,
        entries: [
          {
            id: "entry-edit-1",
            rs: 42000,
            recordedAt: "2026-07-15T10:00:00.000Z",
          },
        ],
      }}
    />,
  );

  vi.setSystemTime(new Date("2026-07-17T16:00:00.000Z"));
  await user.click(await screen.findByRole("button", { name: "Edit entry-edit-1" }));
  await user.clear(screen.getByLabelText(/^rs$/i));
  await user.type(screen.getByLabelText(/^rs$/i), "45000");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("45,000");
  expect(screen.queryByRole("dialog", { name: "Edit Entry" })).not.toBeInTheDocument();

  const raw = storageAdapter.getItem("rank-tracker-local-store");
  const store = JSON.parse(raw!) as {
    version: number;
    entries: Array<{ id: string; rs: number; recordedAt: string; updatedAt: string }>;
  };
  expect(store.entries).toHaveLength(1);
  expect(store.entries[0]?.id).toBe("entry-edit-1");
  expect(store.entries[0]?.rs).toBe(45000);
  expect(store.entries[0]?.recordedAt).toBe("2026-07-15T10:00:00.000Z");
  expect(store.entries[0]?.updatedAt).toMatch(/^2026-07-17T16:00:00/);
  vi.useRealTimers();
});

test("Delete confirm from Entry row hard-deletes and refreshes Season view", async () => {
  const user = userEvent.setup();
  const storageAdapter = createMemoryStorageAdapter();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={storageAdapter}
      initialStore={{
        version: 1,
        entries: [
          {
            id: "entry-a",
            rs: 42000,
            recordedAt: "2026-07-15T10:00:00.000Z",
          },
          {
            id: "entry-b",
            rs: 43000,
            recordedAt: "2026-07-16T10:00:00.000Z",
          },
        ],
      }}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Delete entry-a" }));

  const dialog = await screen.findByRole("dialog", { name: "Delete Entry" });
  expect(within(dialog).getByText(/RS 42,000/i)).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Delete" })).toBeInTheDocument();

  await user.click(within(dialog).getByRole("button", { name: "Delete" }));

  expect(screen.queryByRole("dialog", { name: "Delete Entry" })).not.toBeInTheDocument();
  expect(screen.queryByText(/RS 42,000/i)).not.toBeInTheDocument();
  expect(screen.getByText(/RS 43,000/i)).toBeInTheDocument();

  const raw = storageAdapter.getItem("rank-tracker-local-store");
  const store = JSON.parse(raw!) as {
    entries: Array<{ id: string }>;
  };
  expect(store.entries).toHaveLength(1);
  expect(store.entries[0]?.id).toBe("entry-b");
});

test("Delete from Edit replaces Edit overlay and dismiss returns to Season view", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      initialStore={{
        version: 1,
        entries: [
          {
            id: "entry-edit-1",
            rs: 42000,
            recordedAt: "2026-07-15T10:00:00.000Z",
          },
        ],
      }}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Edit entry-edit-1" }));
  expect(await screen.findByRole("dialog", { name: "Edit Entry" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Delete" }));

  expect(screen.queryByRole("dialog", { name: "Edit Entry" })).not.toBeInTheDocument();
  const dialog = await screen.findByRole("dialog", { name: "Delete Entry" });
  expect(dialog).toBeInTheDocument();

  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

  expect(screen.queryByRole("dialog", { name: "Delete Entry" })).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog", { name: "Edit Entry" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Season hero")).toHaveTextContent("42,000");
});

test("deleting the last Entry on Current Season shows empty Current Season state", async () => {
  const user = userEvent.setup();
  const storageAdapter = createMemoryStorageAdapter();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={storageAdapter}
      initialStore={{
        version: 1,
        entries: [
          {
            id: "entry-only",
            rs: 42000,
            recordedAt: "2026-07-15T10:00:00.000Z",
          },
        ],
      }}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Delete entry-only" }));
  const dialog = await screen.findByRole("dialog", { name: "Delete Entry" });
  await user.click(within(dialog).getByRole("button", { name: "Delete" }));

  expect(screen.queryByRole("dialog", { name: "Delete Entry" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("No RS logged")).toHaveTextContent("—");
  expect(screen.getByText("Log your first RS to get started.")).toBeInTheDocument();
  expect(screen.queryByLabelText("RS sparkline")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Season summary")).not.toBeInTheDocument();
  expect(screen.getByText("No Entries yet.")).toBeInTheDocument();

  const raw = storageAdapter.getItem("rank-tracker-local-store");
  const store = JSON.parse(raw!) as { entries: unknown[] };
  expect(store.entries).toHaveLength(0);
});

test("season control lists Current Season and past Seasons that have Entries", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      initialStore={createStoreWithSeason10Entry()}
    />,
  );

  await screen.findByRole("radiogroup", { name: "Season" });
  expect(screen.getByRole("radio", { name: "S11*" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "S10" })).toBeInTheDocument();
  expect(screen.queryByRole("radio", { name: "S9" })).not.toBeInTheDocument();
});

test("selecting a past Season updates the URL and shows that Season view", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      initialStore={createStoreWithSeason10Entry()}
    />,
  );

  await screen.findByRole("heading", { name: /season 11 \(current\)/i });
  await user.click(screen.getByRole("radio", { name: "S10" }));

  expect(await screen.findByRole("heading", { name: /^season 10$/i })).toBeInTheDocument();
  expect(history.location.search).toContain("season=10");
  expect(screen.getByLabelText("Season hero")).toHaveTextContent("8,000");
  expect(screen.getByLabelText("RS sparkline")).toBeInTheDocument();
  expect(screen.getByLabelText("Season summary")).toBeInTheDocument();
  expect(screen.getByText(/RS 8,000/)).toBeInTheDocument();
  expect(screen.queryByText("(Current)")).not.toBeInTheDocument();
});

test("non-navigable Season in the URL snaps to Current Season", async () => {
  const history = createMemoryHistory({
    initialEntries: ["/rank-tracker/?season=9"],
  });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      initialStore={createStoreWithSeason10Entry()}
    />,
  );

  expect(
    await screen.findByRole("heading", { name: /season 11 \(current\)/i }),
  ).toBeInTheDocument();
  expect(history.location.search).toContain(`season=${CURRENT_SEASON_NUMBER}`);
  expect(screen.queryByRole("radio", { name: "S9" })).not.toBeInTheDocument();
});

test("empty Local store season control offers only Current Season", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  await screen.findByRole("radio", { name: "S11*" });
  expect(screen.queryByRole("radio", { name: "S10" })).not.toBeInTheDocument();
});

test("Local store document shape is initialized with empty entries", async () => {
  const storageAdapter = createMemoryStorageAdapter();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={storageAdapter} />);

  await screen.findByRole("button", { name: "Log RS" });

  const raw = storageAdapter.getItem("rank-tracker-local-store");
  expect(raw).not.toBeNull();
  expect(JSON.parse(raw!)).toEqual({ version: APP_SCHEMA_VERSION, entries: [] });
});

test("Log RS shows live Season preview derived from recordedAt", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-04-01T10:00");

  expect(screen.getByLabelText("Season preview")).toHaveTextContent("Season 10");

  vi.useRealTimers();
});

test("Current Season Log RS with backdated recordedAt shows info chrome and navigates on save", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const storageAdapter = createMemoryStorageAdapter();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={storageAdapter} />);

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-04-01T10:00");
  await user.type(screen.getByLabelText(/^rs$/i), "8000");

  expect(screen.getByRole("status")).toHaveTextContent("Saves to Season 10");

  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByRole("heading", { name: /^season 10$/i })).toBeInTheDocument();
  expect(history.location.search).toContain("season=10");
  expect(screen.getByLabelText("Season hero")).toHaveTextContent("8,000");

  const raw = storageAdapter.getItem("rank-tracker-local-store");
  const store = JSON.parse(raw!) as {
    entries: Array<{ rs: number; recordedAt: string }>;
  };
  expect(store.entries).toHaveLength(1);
  expect(store.entries[0]?.rs).toBe(8000);
  expect(store.entries[0]?.recordedAt).toMatch(/^2026-04-01T/);

  vi.useRealTimers();
});

test("past Season view blocks save when recordedAt belongs to another Season", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const initialStore = createStoreWithSeason10Entry();
  const storageAdapter = createMemoryStorageAdapter(initialStore);
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={storageAdapter} initialStore={initialStore} />);

  await user.click(await screen.findByRole("radio", { name: "S10" }));
  await user.click(screen.getByRole("button", { name: "Log RS" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-07-16T10:00");
  await user.type(screen.getByLabelText(/^rs$/i), "9000");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(screen.getByRole("alert")).toHaveTextContent(/not the Season you're viewing/i);
  expect(screen.getByRole("dialog", { name: "Log RS" })).toBeInTheDocument();
  expect(JSON.parse(storageAdapter.getItem("rank-tracker-local-store")!)).toEqual(initialStore);

  vi.useRealTimers();
});

test("recordedAt outside every known Season rejects save and leaves Local store unchanged", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const storageAdapter = createMemoryStorageAdapter();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={storageAdapter} />);

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2020-01-01T10:00");
  await user.type(screen.getByLabelText(/^rs$/i), "5000");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(screen.getByLabelText("Season preview")).toHaveTextContent("Outside known Seasons");
  expect(screen.getByRole("alert")).toHaveTextContent(/outside every known Season/i);
  expect(screen.getByRole("dialog", { name: "Log RS" })).toBeInTheDocument();
  expect(JSON.parse(storageAdapter.getItem("rank-tracker-local-store")!)).toEqual({
    version: APP_SCHEMA_VERSION,
    entries: [],
  });

  vi.useRealTimers();
});

test("Edit Entry applies cross-Season rules on past Season mismatch", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const initialStore = createStoreWithSeason10Entry();
  const storageAdapter = createMemoryStorageAdapter(initialStore);
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={storageAdapter} initialStore={initialStore} />);

  await user.click(await screen.findByRole("radio", { name: "S10" }));
  await user.click(screen.getByRole("button", { name: "Edit s10-entry" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-07-16T10:00");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(screen.getByRole("alert")).toHaveTextContent(/not the Season you're viewing/i);
  expect(screen.getByRole("dialog", { name: "Edit Entry" })).toBeInTheDocument();
  expect(JSON.parse(storageAdapter.getItem("rank-tracker-local-store")!)).toEqual(initialStore);

  vi.useRealTimers();
});

test("Edit Entry from Current Season with cross-Season recordedAt navigates on save", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const initialStore = {
    version: 1 as const,
    entries: [
      {
        id: "s11-entry",
        rs: 42000,
        recordedAt: "2026-07-16T10:00:00.000Z",
      },
    ],
  };
  const storageAdapter = createMemoryStorageAdapter(initialStore);
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={storageAdapter} initialStore={initialStore} />);

  await user.click(await screen.findByRole("button", { name: "Edit s11-entry" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-04-01T10:00");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByRole("heading", { name: /^season 10$/i })).toBeInTheDocument();
  expect(history.location.search).toContain("season=10");
  expect(screen.getByText(/RS 42,000/)).toBeInTheDocument();

  const store = JSON.parse(storageAdapter.getItem("rank-tracker-local-store")!) as {
    entries: Array<{ id: string; recordedAt: string }>;
  };
  expect(store.entries[0]?.id).toBe("s11-entry");
  expect(store.entries[0]?.recordedAt).toMatch(/^2026-04-01T/);

  vi.useRealTimers();
});

test("signed-in player without display name sees required display name step", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({ displayName: null });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
    />,
  );

  expect(await screen.findByRole("region", { name: "Choose display name" })).toBeInTheDocument();
  expect(screen.getByLabelText(/^display name$/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save display name" })).toBeInTheDocument();
});

test("Season view remains usable while display name step is shown", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({ displayName: null });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
    />,
  );

  expect(await screen.findByRole("region", { name: "Choose display name" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /season 11 \(current\)/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Log RS" })).toBeInTheDocument();
});

test("invalid display name shows validation error on display name step", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({ displayName: null });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
    />,
  );

  await screen.findByRole("region", { name: "Choose display name" });
  await user.type(screen.getByLabelText(/^display name$/i), "ab");
  await user.click(screen.getByRole("button", { name: "Save display name" }));

  expect(
    await screen.findByText("Display name must be at least 3 characters."),
  ).toBeInTheDocument();
});

test("taken display name shows clear error on display name step", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({
    displayName: null,
    takenDisplayNames: ["taken-name"],
  });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
    />,
  );

  await screen.findByRole("region", { name: "Choose display name" });
  await user.type(screen.getByLabelText(/^display name$/i), "Taken-Name");
  await user.click(screen.getByRole("button", { name: "Save display name" }));

  expect(await screen.findByText("That display name is already taken.")).toBeInTheDocument();
});

test("Log RS remains usable while display name step is shown", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({ displayName: null });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
    />,
  );

  await screen.findByRole("region", { name: "Choose display name" });
  await user.click(screen.getByRole("button", { name: "Log RS" }));

  expect(await screen.findByRole("dialog", { name: "Log RS" })).toBeInTheDocument();
});

test("cloud sync is blocked until display name is saved", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({ displayName: null });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });

  expect(
    within(data).getByText("Cloud sync blocked until you choose a display name."),
  ).toBeInTheDocument();
  expect(within(data).queryByText("Cloud sync ready.")).not.toBeInTheDocument();
});

test("saving a valid display name completes profile and hides display name step", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({ displayName: null });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
    />,
  );

  await screen.findByRole("region", { name: "Choose display name" });
  await user.type(screen.getByLabelText(/^display name$/i), "NewPlayer");
  await user.click(screen.getByRole("button", { name: "Save display name" }));

  expect(screen.queryByRole("region", { name: "Choose display name" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });
  expect(within(data).getByText("Display name: NewPlayer")).toBeInTheDocument();
  expect(within(data).getByText("Cloud sync ready.")).toBeInTheDocument();
  expect(within(data).queryByLabelText(/^display name$/i)).not.toBeInTheDocument();
});

test("returning signed-in player with display name skips display name step", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient } = createSignedInClients({ displayName: "FinalsFan" });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
    />,
  );

  await screen.findByRole("heading", { name: "Rank Tracker" });
  expect(screen.queryByRole("region", { name: "Choose display name" })).not.toBeInTheDocument();
});

test("sync-ready sign-in uploads local-only Entries to cloud", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const localEntry = entryFixture({
    id: "local-upload",
    rs: 44000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
      initialStore={{ version: APP_SCHEMA_VERSION, entries: [localEntry] }}
    />,
  );

  await screen.findByLabelText("Season hero");

  await waitFor(() => {
    expect(entriesClient.getEntries(userId)).toEqual([localEntry]);
  });
});

test("sync-ready sign-in downloads cloud-only Entries into Local store", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const cloudEntry = entryFixture({
    id: "cloud-download",
    rs: 51000,
    recordedAt: "2026-07-16T10:00:00.000Z",
  });
  entriesClient.setEntries(userId, [cloudEntry]);

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
    />,
  );

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("51,000");
  expect(screen.getByText(/RS 51,000/i)).toBeInTheDocument();
});

test("saving display name triggers initial cloud merge for existing local Entries", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: null,
  });
  const localEntry = entryFixture({
    id: "merge-on-name",
    rs: 47000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
      initialStore={{ version: APP_SCHEMA_VERSION, entries: [localEntry] }}
    />,
  );

  await screen.findByRole("region", { name: "Choose display name" });
  await user.type(screen.getByLabelText(/^display name$/i), "NewPlayer");
  await user.click(screen.getByRole("button", { name: "Save display name" }));

  await waitFor(() => {
    expect(entriesClient.getEntries(userId)).toEqual([localEntry]);
  });
});

test("local Log RS pushes a new Entry to cloud when sync-ready", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
    />,
  );

  await screen.findByRole("heading", { name: "Rank Tracker" });

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-07-16T10:00");
  await user.type(screen.getByLabelText(/^rs$/i), "42000");
  await user.click(screen.getByRole("button", { name: "Save" }));

  await screen.findByLabelText("Season hero");

  await waitFor(() => {
    const cloudEntries = entriesClient.getEntries(userId);
    expect(cloudEntries).toHaveLength(1);
    expect(cloudEntries[0]?.rs).toBe(42000);
  });

  vi.useRealTimers();
});

test("local Edit Entry pushes updated Entry to cloud when sync-ready", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const localEntry = entryFixture({
    id: "entry-edit-cloud",
    rs: 42000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });
  entriesClient.setEntries(userId, [localEntry]);

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
      initialStore={{ version: APP_SCHEMA_VERSION, entries: [localEntry] }}
    />,
  );

  await screen.findByLabelText("Season hero");

  vi.setSystemTime(new Date("2026-07-17T16:00:00.000Z"));
  await user.click(screen.getByRole("button", { name: "Edit entry-edit-cloud" }));
  await user.clear(screen.getByLabelText(/^rs$/i));
  await user.type(screen.getByLabelText(/^rs$/i), "45000");
  await user.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => {
    expect(entriesClient.getEntries(userId)[0]?.rs).toBe(45000);
  });

  vi.useRealTimers();
});

test("local delete removes previously synced Entry from cloud", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const syncedEntry = entryFixture({
    id: "entry-delete-cloud",
    rs: 42000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });
  entriesClient.setEntries(userId, [syncedEntry]);

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
      initialStore={{ version: APP_SCHEMA_VERSION, entries: [syncedEntry] }}
    />,
  );

  await screen.findByLabelText("Season hero");

  await user.click(screen.getByRole("button", { name: "Delete entry-delete-cloud" }));
  const dialog = await screen.findByRole("dialog", { name: "Delete Entry" });
  await user.click(within(dialog).getByRole("button", { name: "Delete" }));

  await waitFor(() => {
    expect(entriesClient.getEntries(userId)).toEqual([]);
  });
});

test("focus pull merges a remote-only Entry into Local store", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const localEntry = entryFixture({
    id: "local-stays",
    rs: 42000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });
  entriesClient.setEntries(userId, [localEntry]);

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
      initialStore={{ version: APP_SCHEMA_VERSION, entries: [localEntry] }}
    />,
  );

  await screen.findByLabelText("Season hero");
  expect(screen.queryByText(/RS 39,000/i)).not.toBeInTheDocument();

  const remoteEntry = entryFixture({
    id: "remote-only",
    rs: 39000,
    recordedAt: "2026-07-14T10:00:00.000Z",
  });
  entriesClient.setEntries(userId, [localEntry, remoteEntry]);

  window.dispatchEvent(new Event("focus"));

  expect(await screen.findByText(/RS 39,000/i)).toBeInTheDocument();
});

test("failed cloud push does not roll back a successful local Log RS", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const cloudOptions = { failUpsert: true };
  const entriesClient = createMemoryCloudEntriesClient(undefined, cloudOptions);
  const storageAdapter = createMemoryStorageAdapter();

  render(
    <App
      router={router}
      storageAdapter={storageAdapter}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
    />,
  );

  await screen.findByRole("heading", { name: "Rank Tracker" });

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-07-16T10:00");
  await user.type(screen.getByLabelText(/^rs$/i), "42000");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("42,000");

  const raw = storageAdapter.getItem("rank-tracker-local-store");
  const store = JSON.parse(raw!) as { entries: Array<{ rs: number }> };
  expect(store.entries).toHaveLength(1);
  expect(store.entries[0]?.rs).toBe(42000);
  expect(entriesClient.getEntries(userId)).toEqual([]);

  expect(screen.getByRole("status", { name: "Cloud sync pending" })).toBeInTheDocument();

  cloudOptions.failUpsert = false;
  window.dispatchEvent(new Event("focus"));

  await waitFor(() => {
    expect(entriesClient.getEntries(userId)).toHaveLength(1);
  });
  expect(screen.queryByRole("status", { name: "Cloud sync pending" })).not.toBeInTheDocument();

  vi.useRealTimers();
});

function setNavigatorOnline(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
}

test("offline Log RS queues cloud push and flushes when back online", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
  setNavigatorOnline(false);
  expect(navigator.onLine).toBe(false);

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const storageAdapter = createMemoryStorageAdapter();

  render(
    <App
      router={router}
      storageAdapter={storageAdapter}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
    />,
  );

  await screen.findByRole("heading", { name: "Rank Tracker" });
  await waitFor(() => {
    expect(entriesClient.getEntries(userId)).toEqual([]);
  });

  await user.click(await screen.findByRole("button", { name: "Log RS" }));
  await user.clear(screen.getByLabelText(/^recorded at$/i));
  await user.type(screen.getByLabelText(/^recorded at$/i), "2026-07-16T10:00");
  await user.type(screen.getByLabelText(/^rs$/i), "42000");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("42,000");
  expect(entriesClient.getEntries(userId)).toEqual([]);
  expect(screen.getByRole("status", { name: "Cloud sync pending" })).toBeInTheDocument();

  setNavigatorOnline(true);
  window.dispatchEvent(new Event("online"));

  await waitFor(() => {
    const cloudEntries = entriesClient.getEntries(userId);
    expect(cloudEntries).toHaveLength(1);
    expect(cloudEntries[0]?.rs).toBe(42000);
  });

  expect(screen.queryByRole("status", { name: "Cloud sync pending" })).not.toBeInTheDocument();

  setNavigatorOnline(true);
  vi.useRealTimers();
});

test("failed cloud delete keeps local delete and retries on focus", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const syncedEntry = entryFixture({
    id: "entry-delete-retry",
    rs: 42000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });
  const cloudOptions = { failDelete: true };
  const entriesClient = createMemoryCloudEntriesClient(undefined, cloudOptions);
  entriesClient.setEntries(userId, [syncedEntry]);

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
      initialStore={{ version: APP_SCHEMA_VERSION, entries: [syncedEntry] }}
    />,
  );

  await screen.findByLabelText("Season hero");

  await user.click(screen.getByRole("button", { name: "Delete entry-delete-retry" }));
  const dialog = await screen.findByRole("dialog", { name: "Delete Entry" });
  await user.click(within(dialog).getByRole("button", { name: "Delete" }));

  await waitFor(() => {
    expect(screen.queryByText(/RS 42,000/i)).not.toBeInTheDocument();
  });
  expect(entriesClient.getEntries(userId)).toEqual([syncedEntry]);
  expect(screen.getByRole("status", { name: "Cloud sync pending" })).toBeInTheDocument();

  cloudOptions.failDelete = false;

  window.dispatchEvent(new Event("focus"));

  await waitFor(() => {
    expect(entriesClient.getEntries(userId)).toEqual([]);
  });
  await waitFor(() => {
    expect(screen.queryByRole("status", { name: "Cloud sync pending" })).not.toBeInTheDocument();
  });
});

test("Clear local data wipes Local store and sync bookkeeping without deleting cloud Entries", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const localEntry = entryFixture({
    id: "clear-local-keep-cloud",
    rs: 42000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });
  entriesClient.setEntries(userId, [localEntry]);
  const storageAdapter = createMemoryStorageAdapter({
    version: APP_SCHEMA_VERSION,
    entries: [localEntry],
  });

  render(
    <App
      router={router}
      storageAdapter={storageAdapter}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
    />,
  );

  await screen.findByLabelText("Season hero");

  await user.click(screen.getByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });
  await user.click(within(data).getByRole("button", { name: "Clear local data" }));

  const confirm = await screen.findByRole("dialog", { name: "Clear local data" });
  await user.click(within(confirm).getByRole("button", { name: "Clear local data" }));

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("—");
  expect(entriesClient.getEntries(userId)).toEqual([localEntry]);
  expect(JSON.parse(storageAdapter.getItem(LOCAL_STORE_KEY) ?? "{}").entries).toEqual([]);
  expect(JSON.parse(storageAdapter.getItem(SYNC_STATE_KEY) ?? "{}")).toEqual({
    knownSyncedIds: [],
    syncedEntries: [],
    pendingOps: [],
  });

  window.dispatchEvent(new Event("focus"));

  expect(screen.getByLabelText("Season hero")).toHaveTextContent("—");
  expect(entriesClient.getEntries(userId)).toEqual([localEntry]);
});

test("signed-out Data sheet offers Clear local data but not Delete cloud data", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter()}
      authClient={createMemoryAuthClient()}
    />,
  );

  await user.click(await screen.findByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });

  expect(within(data).getByRole("button", { name: "Clear local data" })).toBeInTheDocument();
  expect(within(data).queryByRole("button", { name: "Delete cloud data" })).not.toBeInTheDocument();
  expect(within(data).queryByRole("button", { name: "Reset everything" })).not.toBeInTheDocument();
});

test("Delete cloud data removes cloud Entries but keeps Local store and signed-in session", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const syncedEntry = entryFixture({
    id: "delete-cloud-keep-local",
    rs: 43000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });
  entriesClient.setEntries(userId, [syncedEntry]);

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter({
        version: APP_SCHEMA_VERSION,
        entries: [syncedEntry],
      })}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
    />,
  );

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("43,000");

  await user.click(screen.getByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });
  await user.click(within(data).getByRole("button", { name: "Delete cloud data" }));

  const confirm = await screen.findByRole("dialog", { name: "Delete cloud data" });
  await user.click(within(confirm).getByRole("button", { name: "Delete cloud data" }));

  await waitFor(() => {
    expect(entriesClient.getEntries(userId)).toEqual([]);
  });
  expect(screen.getByLabelText("Season hero")).toHaveTextContent("43,000");

  const dataAfterDelete = await screen.findByRole("dialog", { name: "Data" });
  expect(within(dataAfterDelete).getByText("Signed in as player@example.com")).toBeInTheDocument();

  window.dispatchEvent(new Event("focus"));

  await waitFor(() => {
    expect(entriesClient.getEntries(userId)).toEqual([]);
  });
  expect(screen.getByLabelText("Season hero")).toHaveTextContent("43,000");
});

test("Reset everything requires typed confirmation and clears local and cloud Entries", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const syncedEntry = entryFixture({
    id: "reset-all",
    rs: 44000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });
  entriesClient.setEntries(userId, [syncedEntry]);
  const storageAdapter = createMemoryStorageAdapter({
    version: APP_SCHEMA_VERSION,
    entries: [syncedEntry],
  });

  render(
    <App
      router={router}
      storageAdapter={storageAdapter}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
    />,
  );

  await screen.findByLabelText("Season hero");

  await user.click(screen.getByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });
  await user.click(within(data).getByRole("button", { name: "Reset everything" }));

  const confirm = await screen.findByRole("dialog", { name: "Reset everything" });
  const resetButton = within(confirm).getByRole("button", { name: "Reset everything" });
  expect(resetButton).toBeDisabled();

  await user.type(within(confirm).getByLabelText(/^type reset to confirm$/i), "RESET");
  await user.click(resetButton);

  await waitFor(() => {
    expect(entriesClient.getEntries(userId)).toEqual([]);
  });
  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("—");
  expect(JSON.parse(storageAdapter.getItem(LOCAL_STORE_KEY) ?? "{}").entries).toEqual([]);
});

test("Reset everything confirmation cancel leaves local and cloud Entries unchanged", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });
  const { authClient, profileClient, entriesClient, userId } = createSignedInClients({
    displayName: "FinalsFan",
  });
  const syncedEntry = entryFixture({
    id: "reset-cancel",
    rs: 45000,
    recordedAt: "2026-07-15T10:00:00.000Z",
  });
  entriesClient.setEntries(userId, [syncedEntry]);

  render(
    <App
      router={router}
      storageAdapter={createMemoryStorageAdapter({
        version: APP_SCHEMA_VERSION,
        entries: [syncedEntry],
      })}
      authClient={authClient}
      profileClient={profileClient}
      entriesClient={entriesClient}
    />,
  );

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("45,000");

  await user.click(screen.getByRole("button", { name: "Data" }));
  const data = await screen.findByRole("dialog", { name: "Data" });
  await user.click(within(data).getByRole("button", { name: "Reset everything" }));

  const confirm = await screen.findByRole("dialog", { name: "Reset everything" });
  await user.click(within(confirm).getAllByRole("button", { name: "Cancel" })[0]!);

  expect(screen.getByLabelText("Season hero")).toHaveTextContent("45,000");
  expect(entriesClient.getEntries(userId)).toEqual([syncedEntry]);

  const dataAfterCancel = await screen.findByRole("dialog", { name: "Data" });
  expect(
    within(dataAfterCancel).getByRole("button", { name: "Reset everything" }),
  ).toBeInTheDocument();
});
