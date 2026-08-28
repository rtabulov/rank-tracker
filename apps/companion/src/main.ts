import { isTauri } from "@tauri-apps/api/core";
import { initBridge } from "./bridge-actions.ts";
import { bindDevPanelActions, renderDevPanel } from "./dev-panel.ts";
import { handleSetupMenuId } from "./setup-actions.ts";
import { initTray } from "./tray.ts";

async function bootstrap(): Promise<void> {
  if (isTauri()) {
    try {
      await initBridge();
      await initTray();
      // Hidden shell window — UI is the system tray only.
      document.body.innerHTML = "";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      document.body.innerHTML = `<pre style="font-family:system-ui;padding:1rem;color:#f87171">Tray init failed:\n${message}</pre>`;
    }
    return;
  }

  renderDevPanel(document.body);
  bindDevPanelActions((id) => {
    void handleSetupMenuId(id);
  });
}

void bootstrap();
