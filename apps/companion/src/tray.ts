import { invoke, isTauri } from "@tauri-apps/api/core";
import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { actionLabel, trayBalloon, trayTooltip } from "companion-lifecycle";
import { handleSetupMenuId } from "./setup-actions.ts";
import { availableActionTypes, getState, subscribe } from "./store.ts";

/** Must match the id used in src-tauri/src/lib.rs */
const TRAY_ID = "main";

let tray: TrayIcon | null = null;

async function buildMenu(): Promise<Menu> {
  const state = getState();
  const items: Array<MenuItem | PredefinedMenuItem> = [];
  const balloon = trayBalloon(state);

  items.push(
    await MenuItem.new({
      id: "status",
      text: `${balloon.title}: ${balloon.body.slice(0, 48)}…`,
      enabled: false,
    }),
  );

  for (const actionType of availableActionTypes()) {
    items.push(
      await MenuItem.new({
        id: actionType,
        text: actionLabel(actionType),
        action: () => {
          void handleSetupMenuId(actionType);
        },
      }),
    );
  }

  items.push(
    await MenuItem.new({
      id: "RESET",
      text: actionLabel("RESET"),
      action: () => {
        void handleSetupMenuId("RESET");
      },
    }),
  );

  items.push(await PredefinedMenuItem.new({ item: "Separator" }));
  items.push(
    await MenuItem.new({
      id: "QUIT",
      text: "Quit",
      action: () => {
        void invoke("quit");
      },
    }),
  );

  return Menu.new({ items });
}

async function refreshTray(): Promise<void> {
  if (!tray) {
    return;
  }
  const state = getState();
  await tray.setTooltip(trayTooltip(state));
  await tray.setMenu(await buildMenu());
}

export async function initTray(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  tray = await TrayIcon.getById(TRAY_ID);
  if (!tray) {
    throw new Error(`Tray icon "${TRAY_ID}" was not created by the Rust host`);
  }

  await refreshTray();

  subscribe(() => {
    void refreshTray();
  });
}
