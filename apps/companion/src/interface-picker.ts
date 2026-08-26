export type PickerInterface = {
  id: string;
  name: string;
  isLoopback: boolean;
};

/**
 * Compact adapter picker shown only when auto-detection / capture fails.
 */
export function renderInterfacePicker(
  root: HTMLElement,
  interfaces: PickerInterface[],
  onPick: (id: string) => void | Promise<void>,
): void {
  const usable = interfaces.filter((iface) => !iface.isLoopback);
  root.innerHTML = "";
  root.style.cssText =
    "font-family:system-ui,sans-serif;padding:1rem;background:#0f1419;color:#e7ecf1;min-height:100vh;box-sizing:border-box;";

  const title = document.createElement("h1");
  title.textContent = "Pick network adapter";
  title.style.cssText = "font-size:1.1rem;font-weight:600;margin:0 0 0.35rem;";
  root.appendChild(title);

  const hint = document.createElement("p");
  hint.textContent = "No packets on the auto-picked adapter. Choose the one THE FINALS uses.";
  hint.style.cssText = "margin:0 0 1rem;color:#9aa7b5;font-size:0.9rem;line-height:1.35;";
  root.appendChild(hint);

  if (usable.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No Npcap interfaces found. Install Npcap and retry.";
    empty.style.color = "#f87171";
    root.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.style.cssText = "display:flex;flex-direction:column;gap:0.5rem;";
  for (const iface of usable) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = iface.name || iface.id;
    btn.title = iface.id;
    btn.style.cssText =
      "text-align:left;padding:0.65rem 0.75rem;border:1px solid #2a3540;background:#161d24;color:inherit;border-radius:6px;cursor:pointer;";
    btn.addEventListener("click", () => {
      void onPick(iface.id);
    });
    list.appendChild(btn);
  }
  root.appendChild(list);
}
