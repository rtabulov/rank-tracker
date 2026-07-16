import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import { App } from "./App.tsx";

test("shell renders", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();
});

test("toggling theme updates effective light/dark on the document", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /toggle theme/i }));
  await user.click(screen.getByRole("menuitem", { name: /^dark$/i }));
  expect(document.documentElement).toHaveClass("dark");

  await user.click(screen.getByRole("button", { name: /toggle theme/i }));
  await user.click(screen.getByRole("menuitem", { name: /^light$/i }));
  expect(document.documentElement).toHaveClass("light");
  expect(document.documentElement).not.toHaveClass("dark");
});
