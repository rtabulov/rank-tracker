import { actionLabel, primaryCta, trayBalloon, trayTooltip } from "companion-lifecycle";
import { availableActionTypes, getState, subscribe } from "./store.ts";

export function renderDevPanel(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>("#dev-panel");
  const titleEl = root.querySelector<HTMLElement>("#balloon-title");
  const bodyEl = root.querySelector<HTMLElement>("#balloon-body");
  const actionsEl = root.querySelector<HTMLElement>("#actions");

  if (!panel || !titleEl || !bodyEl || !actionsEl) {
    return;
  }

  panel.classList.remove("hidden");

  subscribe((state) => {
    const balloon = trayBalloon(state);
    titleEl.textContent = `${balloon.title} — ${trayTooltip(state)}`;
    bodyEl.textContent = balloon.body;
    document.title = `Companion: ${state.phase}`;

    const cta = primaryCta(state);
    const actionTypes = availableActionTypes();
    const menuIds = new Set<string>(actionTypes);
    if (cta) {
      const ctaId = actionTypes[0];
      if (ctaId) {
        menuIds.add(ctaId);
      }
    }
    menuIds.add("RESET");

    actionsEl.replaceChildren(
      ...[...menuIds].map((id) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.actionId = id;
        button.textContent = actionLabel(id);
        return button;
      }),
    );
  });
}

export function bindDevPanelActions(onAction: (id: string) => void): void {
  document.querySelector("#actions")?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    const id = target.dataset.actionId;
    if (id) {
      onAction(id);
    }
  });
}

export function currentUiSnapshot() {
  const state = getState();
  return {
    balloon: trayBalloon(state),
    tooltip: trayTooltip(state),
    primary: primaryCta(state),
    actions: availableActionTypes(),
  };
}
