import { render, screen } from "@testing-library/react";
import { expect, test } from "vite-plus/test";
import { App } from "./App.tsx";

test("shell renders", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Rank Tracker" })).toBeInTheDocument();
});
