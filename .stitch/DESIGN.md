---
name: Rank Tracker
colors:
  background: "#ffffff"
  foreground: "#252525"
  card: "#ffffff"
  card-foreground: "#252525"
  popover: "#ffffff"
  popover-foreground: "#252525"
  primary: "#343434"
  on-primary: "#fbfbfb"
  secondary: "#f7f7f7"
  on-secondary: "#343434"
  muted: "#f7f7f7"
  muted-foreground: "#8e8e8e"
  accent: "#f7f7f7"
  accent-foreground: "#343434"
  destructive: "#e7000b"
  border: "#ebebeb"
  input: "#ebebeb"
  ring: "#b5b5b5"
  chart-1: "#dedede"
  chart-2: "#8e8e8e"
  chart-3: "#707070"
  chart-4: "#5f5f5f"
  chart-5: "#454545"
  overlay-scrim: "#00000080"
  dark-background: "#252525"
  dark-foreground: "#fbfbfb"
  dark-card: "#343434"
  dark-primary: "#ebebeb"
  dark-on-primary: "#343434"
  dark-secondary: "#454545"
  dark-muted-foreground: "#b5b5b5"
  dark-destructive: "#ff6467"
  dark-border: "#ffffff1a"
  dark-input: "#ffffff26"
  dark-ring: "#8e8e8e"
typography:
  display-rs:
    fontFamily: Geist Variable
    fontSize: 60px
    fontWeight: "600"
    lineHeight: 1
    letterSpacing: -0.025em
  headline-app:
    fontFamily: Geist Variable
    fontSize: 24px
    fontWeight: "500"
    lineHeight: 32px
    letterSpacing: -0.025em
  title-section:
    fontFamily: Geist Variable
    fontSize: 18px
    fontWeight: "500"
    lineHeight: 28px
    letterSpacing: "0"
  label-section:
    fontFamily: Geist Variable
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
    letterSpacing: "0"
  body-base:
    fontFamily: Geist Variable
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
    letterSpacing: "0"
  body-muted:
    fontFamily: Geist Variable
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
    letterSpacing: "0"
  button:
    fontFamily: Geist Variable
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
    letterSpacing: "0"
  button-sm:
    fontFamily: Geist Variable
    fontSize: 12.8px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: "0"
rounded:
  sm: 0.375rem
  md: 0.5rem
  DEFAULT: 0.625rem
  lg: 0.625rem
  xl: 0.875rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 24px
  margin-desktop: 24px
  section-gap: 24px
---

# Design System: Rank Tracker

## 1. Visual Theme & Atmosphere

Rank Tracker is a quiet, monochrome personal scorebook for The Finals ranked play. The interface feels like a well-made notebook page — flat white (or near-black in dark mode), no decorative chrome, and almost no color beyond ink and ash. Everything exists to make one number legible: the latest Rank Score. The mood is calm, precise, and slightly athletic in its restraint — closer to a sports watch face than a marketing dashboard.

Whitespace is deliberate but not luxurious. Sections stack in a single column with consistent 24px gaps, and density stays compact: small buttons, tight form fields, and a definition-list summary that reads like a stats strip without becoming a card grid. Light and dark themes are first-class equals (system preference by default). The visual language is shadcn’s radix-nova neutral base rendered through Geist — geometric, modern, and deliberately unbranded in hue.

## 2. Color Palette & Roles

### Primary Foundation

| Token                    | Hex       | Role                                                           |
| :----------------------- | :-------- | :------------------------------------------------------------- |
| **Pure Canvas White**    | `#ffffff` | Page background, card/popover surfaces, input fills (light)    |
| **Ink Near-Black**       | `#252525` | Primary text / foreground; dark-mode page background           |
| **Charcoal Primary**     | `#343434` | Primary buttons and filled controls (light); dark card/popover |
| **Snow Primary Invert**  | `#ebebeb` | Primary buttons in dark mode; light borders/inputs             |
| **Mist Secondary**       | `#f7f7f7` | Secondary/muted/accent fills (light)                           |
| **Slate Secondary Dark** | `#454545` | Secondary/muted/accent fills (dark)                            |

### Accent & Interactive

| Token                     | Hex              | Role                                                  |
| :------------------------ | :--------------- | :---------------------------------------------------- |
| **Charcoal Primary**      | `#343434`        | Default CTA fill (Log RS, Save, Export) in light mode |
| **Snow Primary Invert**   | `#ebebeb`        | Default CTA fill in dark mode                         |
| **On-Primary Soft White** | `#fbfbfb`        | Text/icons on primary fills (light)                   |
| **Focus Ring Silver**     | `#b5b5b5`        | Focus rings and ring outlines (`ring-3 ring-ring/50`) |
| **Hairline Border**       | `#ebebeb`        | Borders, input edges, season-control chrome (light)   |
| **Overlay Scrim**         | `#000000` at 50% | Full-viewport dim behind dialogs/drawers              |
| **Ghost Hover Mist**      | `#f7f7f7`        | Ghost/outline hover and selected menu backgrounds     |

There is no chromatic brand accent in the shipped UI. Interactivity is communicated through value contrast (ink on white / white on ink), not hue.

### Typography & Text Hierarchy

| Token                 | Hex       | Role                                                      |
| :-------------------- | :-------- | :-------------------------------------------------------- |
| **Ink Near-Black**    | `#252525` | Headings, RS hero, body, summary values (light)           |
| **Ash Muted**         | `#8e8e8e` | Secondary copy, empty states, summary labels, helper text |
| **Silver Muted Dark** | `#b5b5b5` | Muted text in dark mode                                   |
| **Snow Soft**         | `#fbfbfb` | Primary text in dark mode                                 |

### Functional States

| Token                | Hex                        | Role                                                       |
| :------------------- | :------------------------- | :--------------------------------------------------------- |
| **Alert Crimson**    | `#e7000b`                  | Destructive actions, validation errors, alert copy (light) |
| **Soft Alert Rose**  | `#ff6467`                  | Destructive in dark mode                                   |
| **Destructive Wash** | Crimson at ~10–20% opacity | Destructive button background wash                         |
| **Chart Ash Ladder** | `#dedede` → `#454545`      | Neutral five-step chart scale (grayscale only)             |

## 3. Typography Rules

### Hierarchy & Weights

**Family:** Geist Variable (`"Geist Variable", sans-serif`) for all UI — headings and body share one geometric sans with a high x-height and clean tabular presence. Heading font token aliases to the same family.

| Role               | Size               | Weight         | Tracking                 | Usage                                           |
| :----------------- | :----------------- | :------------- | :----------------------- | :---------------------------------------------- |
| **RS Display**     | `text-6xl` (~60px) | Semibold (600) | Tight (`tracking-tight`) | Latest RS hero; always `tabular-nums`           |
| **App Title**      | `text-2xl` (24px)  | Medium (500)   | Tight                    | “Rank Tracker” in the header                    |
| **Season Title**   | `text-lg` (18px)   | Medium (500)   | Default                  | “Season N (Current)” and overlay titles         |
| **Section Label**  | `text-sm` (14px)   | Medium (500)   | Default                  | “Entry timeline”, form labels                   |
| **Body / Summary** | `text-sm` (14px)   | Regular (400)  | Default                  | Timeline rows, muted helpers, description lists |
| **Button**         | `text-sm` (14px)   | Medium (500)   | Default                  | Default/lg buttons                              |
| **Button Compact** | ~0.8rem            | Medium (500)   | Default                  | `size="sm"` season chips and row actions        |

Empty RS state uses the same display size in **Ash Muted** with an em dash (“—”), never a zero.

### Spacing Principles

- Line length stays narrow by virtue of the single-column layout; body does not chase a wide measure.
- Labels sit directly above fields with a tight `gap-1.5` (6px) stack.
- Numeric data prefers `tabular-nums` so RS columns and summary values align.
- Muted secondary lines under the hero (season net, 7-day delta) use middots (`·`) as separators — sparse punctuation, not badges.

## 4. Component Stylings

### Buttons

- **Shape:** `rounded-lg` (~10px). Compact sizes clamp toward `rounded-md` (~8–10px). Communicates soft utility, not pill playfulness.
- **Primary (default):** Charcoal fill + soft-white text; hover at 80% opacity; active presses down 1px (`translate-y-px`).
- **Outline:** Hairline border, canvas fill; hover to mist muted. Icon outline buttons (settings, theme) are 32×32 (`size="icon"`).
- **Ghost:** No border; muted hover fill — used for Cancel in overlays and unselected season chips.
- **Destructive:** Crimson text on a light crimson wash (not a solid red brick); stronger wash on hover.
- **Sizes:** Default height 32px (`h-8`); sm 28px; lg 36px; xs 24px. Padding is horizontally modest (`px-2.5`) — compact tooling density.
- **Focus:** Ring border + 3px ring at 50% opacity; invalid states swap to destructive ring.
- **Icons:** Lucide, typically 1.2rem in header icon buttons; default inline icons 16px.

### Cards & Surfaces

The product largely **avoids cards**. Content sits directly on the page background. Surfaces appear only when needed for interaction:

- **Overlays / dialogs:** `bg-background`, `border-border`, `p-6`, `gap-4`. Desktop: `rounded-xl`, `max-w-md`, `shadow-lg`. Mobile (≤640px): bottom drawer, `rounded-t-xl`, full width up to `max-w-lg`, no heavy shadow.
- **Dropdown menus:** Popover surface, `rounded-lg`, `shadow-md`, subtle `ring-1 ring-foreground/10`, short open/close zoom+fade.
- **Season control chrome:** Inline flex group with `rounded-lg border p-1` — a segmented control, not a card.

### Navigation

- **Header:** Full-width bar, `p-6`, space-between layout — app title left, actions right (Data settings + theme toggle). No sidebar, no tab bar.
- **Season control:** Radiogroup of small ghost/default buttons (`S8*`, `S7`, …). Selected = primary fill; unselected = ghost + muted text. Current season marked with `*`.
- **Primary CTA:** “Log RS” sits in the main column as a full-width-feeling default button after timeline and season control — not sticky, not floating.

### Inputs & Forms

- Height 32px, `rounded-lg`, hairline border, canvas background, `px-2.5`, `text-sm`.
- Focus: border becomes ring color + 3px soft ring (same language as buttons).
- Labels always visible above the field (`text-sm font-medium`).
- Errors: `text-sm text-destructive` with `role="alert"` directly under the field.
- Form stacks use `gap-4`; label-to-control stacks use `gap-1.5`.
- Season preview chrome under datetime fields: medium “Season preview:” label + muted info or destructive alert message.

### Domain-Specific Components

**RS Hero**
Large semibold tabular number (or muted em dash when empty). One muted supporting sentence for season net / 7-day delta. Season title beneath at `text-lg`. No badges, chips, or card framing.

**RS Sparkline**
Full-width SVG, height ~72px, stroke `currentColor` at 3px with round joins/caps, 4px dots on each Entry. Inherits foreground ink — grayscale continuity with the page.

**Season Summary**
Two-column definition list (`grid-cols-[1fr_auto]`): muted labels left, right-aligned tabular values. No borders, no alternating rows — pure typographic table.

**Entry Timeline**
Plain list (`gap-2`). Each row: “RS {n} · {local when}” plus compact outline Edit/Delete. No avatars, no status pills.

**Viewport Overlay**
Shared shell for Log RS, Edit, Delete, Data, Import confirm. Scrim dismiss, Escape to close, Cancel ghost in the title row. Adapts drawer ↔ dialog at 640px.

## 5. Layout Principles

### Grid & Structure

- Single-column Season view; no multi-column dashboard.
- Root shell: `min-h-svh` flex column; header then flexible main.
- Main: `flex-1 flex-col gap-6 px-6 pb-6`.
- Overlay content max widths: `max-w-md` (desktop dialog), `max-w-lg` (mobile drawer).
- No global `max-w-*` on the page itself — content breathes to the viewport edges with 24px padding.

### Whitespace Strategy

- **Base unit:** 4px (Tailwind default).
- **Section rhythm:** 24px (`gap-6`) between hero, sparkline, summary, timeline, season control, and CTA.
- **Edge padding:** 24px (`p-6` / `px-6`) on header and main — same on mobile and desktop.
- **Compact clusters:** 8px (`gap-2`) for timeline rows and header action groups; 4px (`gap-1`) inside the season segmented control.

### Alignment & Visual Balance

- Hero and body are left-aligned; summary values right-aligned for scanability.
- Header balances title weight against a small icon cluster — brand signal is the wordmark-sized title, not a logo mark.
- Visual weight concentrates at the top: oversized RS number, then progressively quieter sections.

### Responsive Behavior & Touch

- Mobile-first drawer overlays below `640px`; centered dialogs from `sm` up.
- Season view structure is identical on mobile and desktop (per product language: same single-column Season view).
- Icon buttons are 32×32 — compact but usable; primary actions use full text buttons rather than FABs.
- Theme follows system by default; user can force light/dark via the header menu.

## 6. Design System Notes for Stitch Generation

### Language to Use

Prefer prompts like: “monochrome personal score tracker”, “flat notebook UI”, “oversized tabular Rank Score hero”, “no cards”, “compact shadcn tooling”, “Geist geometric sans”, “single-column season view”, “bottom sheet on mobile / simple dialog on desktop”, “ash muted secondary text”, “hairline borders”, “grayscale sparkline”.

Avoid: purple accents, glassmorphism, gradient heroes, stat-card grids, pill badge clusters, heavy drop shadows on content, colorful charts, dashboard sidebars.

### Color References

- **Pure Canvas White** `#ffffff` — page
- **Ink Near-Black** `#252525` — text / dark page
- **Charcoal Primary** `#343434` — CTAs (light)
- **Mist Secondary** `#f7f7f7` — subtle fills
- **Ash Muted** `#8e8e8e` — secondary copy
- **Hairline Border** `#ebebeb` — structure
- **Alert Crimson** `#e7000b` — errors / delete
- **Overlay Scrim** black @ 50% — modal backdrop

### Component Prompts

1. “Season view: left-aligned layout on a white canvas with a 60px semibold tabular Rank Score as the hero, a one-line muted season delta under it, a thin grayscale sparkline, a two-column label/value summary list, and a plain entry timeline — no cards.”
2. “Compact charcoal primary button labeled Log RS, 32px tall, 10px corners, Geist medium 14px; outline icon button 32×32 with hairline border for settings.”
3. “Mobile bottom sheet with rounded top corners, white surface, hairline border, title ‘Log RS’ and ghost Cancel, form fields 32px tall with visible labels and soft gray focus rings.”

### Incremental Iteration

- Start from the empty Current Season state (muted em dash + “Log your first RS…”) before adding populated sparkline/summary.
- Keep hue at zero unless introducing a deliberate brand accent later; if accent arrives, reserve it for CTAs only and leave summary/timeline neutral.
- When adding screens, reuse Viewport Overlay patterns (drawer ≤640px, dialog above) instead of inventing new modal chrome.
- Prefer typography and spacing hierarchy over new surface treatments — if a border/shadow/radius isn’t required for interaction, omit it.
