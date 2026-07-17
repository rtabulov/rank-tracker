import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "@tanstack/react-router";
import { expect, test } from "vite-plus/test";
import { App, createAppRouter } from "./App.tsx";
import { createMemoryStorageAdapter } from "./lib/local-store";

const CURRENT_SEASON_NUMBER = 11;

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
  const user = userEvent.setup();
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
    entries: Array<{ id: string; rs: number; recordedAt: string }>;
  };
  expect(store.entries).toHaveLength(1);
  expect(store.entries[0]?.rs).toBe(42000);
  expect(store.entries[0]?.id).toBeTruthy();
  expect(store.entries[0]?.recordedAt).toMatch(/^2026-07-16T/);
});

test("populated Current Season with one Entry omits sparse summary metrics", async () => {
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

test("Local store document shape is initialized with empty entries", async () => {
  const storageAdapter = createMemoryStorageAdapter();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={storageAdapter} />);

  await screen.findByRole("button", { name: "Log RS" });

  const raw = storageAdapter.getItem("rank-tracker-local-store");
  expect(raw).not.toBeNull();
  expect(JSON.parse(raw!)).toEqual({ version: 1, entries: [] });
});
