# PROTOTYPE — companion first-run / Npcap link-out (tray)

**Throwaway.** Answers [Wayfinder: revise tray first-run for official Npcap link-out](https://github.com/rtabulov/rank-tracker/issues/108).

Prior chrome decision ([#78](https://github.com/rtabulov/rank-tracker/issues/78)): **tray-native + balloons**. This revision is about **Npcap after dropping OEM** ([#82](https://github.com/rtabulov/rank-tracker/issues/82)).

## Question

How should tray-native first-run present **official Npcap link-out + detect** — balloon copy, ordering vs risk disclaimer / MSI UAC / Steam restart, and **ready-to-capture** criteria?

## Run

```bash
pnpm prototype:companion-ux
```

## Orderings (all tray-native)

| Key   | Name                               | Flow gist                                                                       |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------- |
| **A** | Npcap early — before Steam restart | risk → MSI UAC → Npcap link-out+detect → (reboot?) → restart game → Ready       |
| **B** | Npcap late — gate Start capture    | risk → MSI UAC → restart game → almost-Ready; **Start** forces Npcap if missing |
| **C** | Either-order checklist after MSI   | risk → MSI UAC → one checklist balloon; Npcap ↔ restart in either order         |

Switch with `1`/`2`/`3` or ←/→.

### Suggested drives

- **A happy (Npcap missing):** `a u i` → `o` → `N` → `g` → `s e c`
- **A Npcap already there:** `a u i` → `y` → `g` → `s …`
- **A + Npcap reboot:** `a u i o R b g s …`
- **B late Npcap:** `a u i g s` → (lands on Npcap) `o N` → `s e c`
- **C either order (restart first):** `a u i g` → `o N` → `s …`
- **C either order (Npcap first):** `a u i m o N g s …`

## Ready-to-capture (same predicate for all)

1. Companion MSI done + `SSLKEYLOGFILE` written
2. Npcap detected (official GUI install — never bundled)
3. Npcap reboot done if the official installer asked
4. Steam + THE FINALS restarted **after** env was set

Start capture is enabled only when all four are true (B may look “ready” early; Start still gates).

## Constraints from map

- No Npcap OEM / no redistribution; link-out + detect only
- MSI = companion + tshark; Npcap is tray first-run
- Consent + UAC for **our** MSI; Npcap has **their** UAC
- Localhost bridge → PWA prefill → Player Save
