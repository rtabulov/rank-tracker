# Client state preference

Prefer durable, shareable UI state in the **URL** (search params / route state). Prefer **React Context** for app-level concerns such as theme. Do **not** add Zustand, Redux, or similar global client stores by default.

## Hierarchy

1. **URL** — filters, selections, and other state that should be linkable or reload-stable.
2. **React Context** — cross-tree app concerns that are not shareable URL state (for example theme).
3. **Local component state** — everything else that can stay colocated.

## Rare carve-outs for a global store

Only consider a dedicated client store library when:

- updates are high-frequency with many subscribers and Context would thrash, or
- state must live outside the React tree.

If neither applies, keep Context / URL / local state.
