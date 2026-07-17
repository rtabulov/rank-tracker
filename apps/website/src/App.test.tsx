import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "@tanstack/react-router";
import { expect, test } from "vite-plus/test";
import { App, createAppRouter } from "./App.tsx";
import { createMemoryStorageAdapter } from "./lib/local-store.ts";

const CURRENT_SEASON_NUMBER = 11;

test("composed tree renders the home shell via the router under the base path", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} storageAdapter={createMemoryStorageAdapter()} />);

  expect(await screen.findByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();
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
