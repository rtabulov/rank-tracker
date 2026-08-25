# PROTOTYPE — companion first-run / steady-state UX

**Throwaway.** Answers [Wayfinder: prototype first-run installer UX for capture companion](https://github.com/rtabulov/rank-tracker/issues/78).

## Question

What should the **first-run and steady-state UX** look like for the capture companion installer + tray app (install steps, reboot prompt, waiting for game, RS captured, error states)?

## Run

```bash
pnpm prototype:companion-ux
```

## Variants

| Key   | Name                       | Idea                                                    |
| ----- | -------------------------- | ------------------------------------------------------- |
| **A** | Linear wizard → then tray  | Multi-step setup window; tray only after first-run      |
| **B** | Always-on checklist window | One status window with checklist + detail; tray mirrors |
| **C** | Tray-native + balloons     | Thin consent/UAC; steady state is tray balloons/menu    |

Switch with `1`/`2`/`3` or ←/→. Drive the lifecycle with the keys listed in the TUI (happy path: `a u i g s e c p v`).

## Constraints baked in (from map decisions)

- Consent + UAC required; conditional Npcap reboot; Steam+game restart; Start capture
- Localhost bridge → PWA prefill → Player Save (no auto-write Entry)
- Auto-open Rank Tracker when RS ready and PWA disconnected
