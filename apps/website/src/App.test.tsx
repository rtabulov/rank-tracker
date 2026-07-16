import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "@tanstack/react-router";
import { expect, test } from "vite-plus/test";
import { App, createAppRouter } from "./App.tsx";

test("composed tree renders the home shell via the router under the base path", async () => {
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} />);

  expect(await screen.findByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();
});

test("toggling theme updates effective light/dark on the document", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} />);

  expect(await screen.findByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /toggle theme/i }));
  await user.click(screen.getByRole("menuitem", { name: /^dark$/i }));
  expect(document.documentElement).toHaveClass("dark");

  await user.click(screen.getByRole("button", { name: /toggle theme/i }));
  await user.click(screen.getByRole("menuitem", { name: /^light$/i }));
  expect(document.documentElement).toHaveClass("light");
  expect(document.documentElement).not.toHaveClass("dark");
});

test("invalid form input surfaces a visible validation error", async () => {
  const user = userEvent.setup();
  const history = createMemoryHistory({ initialEntries: ["/rank-tracker/"] });
  const router = createAppRouter({ history });

  render(<App router={router} />);

  expect(await screen.findByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();

  await user.type(screen.getByLabelText(/^name$/i), "a");
  await user.click(screen.getByRole("button", { name: /^submit$/i }));

  expect(await screen.findByText("Name must be at least 2 characters")).toBeInTheDocument();
});
