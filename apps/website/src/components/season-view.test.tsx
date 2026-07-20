import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vite-plus/test";
import { LocalStoreProvider } from "@/components/local-store-provider";
import { SeasonView } from "@/components/season-view";
import { createMemoryStorageAdapter } from "@/lib/local-store";
import type { Entry } from "@/lib/types";

function entryFixture(input: { id: string; rs: number; recordedAt: string }): Entry {
  return {
    id: input.id,
    rs: input.rs,
    recordedAt: input.recordedAt,
    updatedAt: input.recordedAt,
  };
}

function renderReadOnlySeasonView(props: {
  seasonNumber?: number;
  entries: Entry[];
  onSeasonSelect?: (seasonNumber: number) => void;
}) {
  const onSeasonSelect = props.onSeasonSelect ?? (() => {});
  return render(
    <LocalStoreProvider storageAdapter={createMemoryStorageAdapter()}>
      <SeasonView
        seasonNumber={props.seasonNumber ?? 11}
        entries={props.entries}
        readOnly
        onSeasonSelect={onSeasonSelect}
      />
    </LocalStoreProvider>,
  );
}

test("read-only Season view renders provided Entries without Log RS, edit, or delete", async () => {
  renderReadOnlySeasonView({
    entries: [
      entryFixture({ id: "visitor-entry", rs: 33000, recordedAt: "2026-07-16T10:00:00.000Z" }),
    ],
  });

  expect(await screen.findByLabelText("Season hero")).toHaveTextContent("33,000");
  expect(screen.getByLabelText("RS sparkline")).toBeInTheDocument();
  expect(screen.getByLabelText("Season summary")).toBeInTheDocument();
  expect(screen.getByText(/RS 33,000/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Log RS" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Edit visitor-entry" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete visitor-entry" })).not.toBeInTheDocument();
});

test("read-only empty Current Season omits Log RS and keeps empty hero and timeline regions", async () => {
  renderReadOnlySeasonView({ entries: [] });

  expect(
    await screen.findByRole("heading", { name: /season 11 \(current\)/i }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("No RS logged")).toHaveTextContent("—");
  expect(screen.getByText("No RS logged yet.")).toBeInTheDocument();
  expect(screen.queryByLabelText("RS sparkline")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Season summary")).not.toBeInTheDocument();
  expect(screen.getByText("No Entries yet.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Log RS" })).not.toBeInTheDocument();
});

test("read-only mode applies navigable Season rules to provided Entries", async () => {
  const user = userEvent.setup();
  const onSeasonSelect = vi.fn();
  renderReadOnlySeasonView({
    entries: [entryFixture({ id: "s10-entry", rs: 8000, recordedAt: "2026-04-01T10:00:00.000Z" })],
    onSeasonSelect,
  });

  await screen.findByRole("radio", { name: "S11*" });
  expect(screen.getByRole("radio", { name: "S10" })).toBeInTheDocument();
  expect(screen.queryByRole("radio", { name: "S9" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("radio", { name: "S10" }));

  expect(onSeasonSelect).toHaveBeenCalledWith(10);
});
