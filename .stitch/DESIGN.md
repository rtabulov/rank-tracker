---
name: Rank Tracker Design
colors:
  background: "#0A0A0F"
  foreground: "#E0E0E0"
  card: "#12121A"
  card-foreground: "#E0E0E0"
  popover: "#12121A"
  popover-foreground: "#E0E0E0"
  primary: "#00FF88"
  primary-foreground: "#0A0A0F"
  secondary: "#1C1C2E"
  secondary-foreground: "#E0E0E0"
  muted: "#1C1C2E"
  muted-foreground: "#A1A1AA"
  accent: "#00D4FF"
  accent-foreground: "#0A0A0F"
  destructive: "#FF3366"
  border: "#2A2A3A"
  input: "#2A2A3A"
  ring: "#00FF88"
typography:
  headline-lg:
    fontFamily: Orbitron
    fontSize: 60px
    fontWeight: "900"
    lineHeight: "1.0"
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Orbitron
    fontSize: 18px
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: 0.2em
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: "400"
    lineHeight: "1.5"
  body-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: "400"
    lineHeight: "1.5"
rounded:
  sm: 0
  DEFAULT: 0
  md: 0
  lg: 0
  xl: 0
spacing:
  unit: 8px
  container-padding: 16px
  gutter: 12px
---

# Design System: Rank Tracker

## 1. Visual Theme & Atmosphere

Rank Tracker uses a **retro-futurism / cyberpunk HUD** aesthetic: deep void background, neon green primary, cyan and magenta accents, Orbitron display type, JetBrains Mono data type, chamfered frames, and a light CRT scanline overlay (disabled under `prefers-reduced-motion` for glow intensity).

## 2. Color Palette & Roles

### Dark (product feel)

- **Background (`#0A0A0F`)**: Void
- **Card (`#12121A`)**: HUD panels
- **Primary (`#00FF88`)**: RS, CTA, positive values
- **Accent / cyan (`#00D4FF`)**: Labels, chart frame
- **Magenta (`#FF00FF`)**: Season live badge
- **Destructive (`#FF3366`)**: Delete / negative Δ

### Light

Same structure with softened neon greens/cyans on a light canvas for contrast.

## 3. Typography

- **Display:** Orbitron 700–900, tracked uppercase for brand and section labels
- **Body / data:** JetBrains Mono
- Hero RS: ~60px black weight with optional neon text glow

## 4. Component Stylings

### Header

Chamfered panel (`clip-path`), `SYS // RANK` eyebrow, neon brand wordmark, outline icon actions.

### Season summary

Terminal-style `<dl>` rows: muted label left, tabular value right; net/Δ may use primary.

### Sparkline

Primary stroke + soft area fill + dots on a cyan-bordered panel.

### Entry timeline

Card rows with neon Edit / destructive Delete icon buttons (≥44px).

### Log RS

Full-width primary flood, Orbitron tracking, soft neon box glow.

## 5. Do / Don't

- **Do** keep data labels in plain English for a11y (`Latest RS`, `Entry timeline`).
- **Do** respect `prefers-reduced-motion` for glow intensity.
- **Don't** use acid-yellow broadcast chrome, THE FINALS logos, or endless glitch animation.
