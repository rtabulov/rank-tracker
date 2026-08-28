import { render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { expect, test } from "vite-plus/test";
import { App, createAppRouter } from "@/App.tsx";

test("companion download page shows beta disclaimers and known issues", async () => {
  const history = createMemoryHistory({ initialEntries: ["/companion"] });
  const router = createAppRouter({ history });

  render(<App router={router} />);

  expect(
    await screen.findByRole("heading", { name: /rank tracker companion/i }),
  ).toBeInTheDocument();
  expect(screen.getAllByText(/SmartScreen/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/Terms of Service prohibit packet capture/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /known issues/i })).toBeInTheDocument();
  expect(document.getElementById("known-issues")).toBeInTheDocument();
});
