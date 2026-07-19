---
name: Rank Tracker Design
colors:
  background: "#09090B"
  foreground: "#FAFAFA"
  card: "#121212"
  card-foreground: "#FAFAFA"
  popover: "#121212"
  popover-foreground: "#FAFAFA"
  primary: "#DFE104"
  primary-foreground: "#09090B"
  secondary: "#18181B"
  secondary-foreground: "#FAFAFA"
  muted: "#18181B"
  muted-foreground: "#A1A1AA"
  accent: "#18181B"
  accent-foreground: "#FAFAFA"
  destructive: "#FF3366"
  border: "#3F3F46"
  input: "#3F3F46"
  ring: "#DFE104"
typography:
  headline-lg:
    fontFamily: Barlow Condensed
    fontSize: 60px
    fontWeight: "700"
    lineHeight: "1.0"
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Barlow Condensed
    fontSize: 30px
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: 0
  body-md:
    fontFamily: Barlow
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.5"
  body-sm:
    fontFamily: Barlow
    fontSize: 14px
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

Rank Tracker uses a **broadcast scoreboard** aesthetic inspired by competitive game-show energy (THE FINALS-adjacent, not a brand clone): high-contrast near-black surfaces, acid-yellow accents, condensed uppercase display type, and sharp zero-radius frames. The UI should feel like a live results board — legible, kinetic on milestones, calm on persistent data.

Whitespace is moderate. Density favors scannable season stats and a reverse-chronological results list without card chrome.

## 2. Color Palette & Roles

### Dark (default product feel)

- **Background (`#09090B`)**: Void canvas.
- **Card (`#121212`)**: Scoreboard panels.
- **Primary (`#DFE104`)**: Accent, CTA, positive season net, chart stroke.
- **Destructive (`#FF3366`)**: Deletes and season-down floods.
- **Border (`#3F3F46`)**: 2px hard frames.

### Light

Same structure with light canvas (`#F4F4F5`), white cards, and a slightly deeper yellow primary (`#C4C700`) for contrast.

## 3. Typography

- **Display / headings:** Barlow Condensed, uppercase, bold.
- **Body / meta:** Barlow.
- Hero RS uses tabular numerals at ~60px condensed.

## 4. Component Stylings

### Buttons

- Sharp corners (`radius: 0`), 2px borders on outline/icon actions.
- Primary CTA: full-width yellow flood, condensed uppercase label (`Log RS`).

### Season board

- Definition list as bordered rows; season net row may invert to primary flood.

### Sparkline

- Primary-colored stroke with soft area fill; no dots by default on the season board strip.

### Results list

- Numbered rows, newest first, with per-entry Δ in primary/destructive.

## 5. Do / Don't

- **Do** keep brand as a hero signal in the header strip.
- **Do** use one accent + semantic up/down colors.
- **Don't** use CRT scanlines, neon cyan/magenta cyberpunk, or THE FINALS logos/key art.
