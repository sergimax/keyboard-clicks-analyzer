# Design system — Keyboard Heatmap

Portable visual tokens and UI recipes for this app. Chrome follows **Super ★** ([theme-super.md](./theme-super.md) · [theme-super.json](./theme-super.json)). Heatmap spectrum is a **domain exception** and stays fixed.

Use as:

1. **In-repo reference** when adding chrome, panels, controls, and heatmap surfaces
2. **Import seed** for another project (`docs/design-tokens.json` + this file)
3. **Cross-project alignment** with other sergimax Super ports — keep core tokens stable; extend domain layers per app

**Source of truth (code):**

| Layer | Path |
| --- | --- |
| Super CSS variables | `src/ui/styles/tokens.css` |
| Quiet / spot links | `src/ui/styles/links.css` |
| Layout + components | `src/ui/styles/app.css` |
| Color mode | `src/ui/color-mode.ts` (`html[data-theme]`) |
| Heat spectrum + key ink | `src/shared/heat.ts` |
| Sticky app chrome | `src/ui/components/AppHeader.tsx` |
| Machine tokens | `docs/design-tokens.json` |
| Super contract | `docs/theme-super.md` |

No MUI — plain React + CSS. When tokens change in code, update this doc, `design-tokens.json`, and keep Super hard rules in sync.

---

## Hard requirements (from Super)

1. **Bilingual type** — stacks include Cyrillic + Latin: Noto Sans (body), Onest (display), JetBrains Mono / IBM Plex Mono (mono). System fallbacks (`Segoe UI`, Consolas) cover Windows when webfonts are not bundled (offline / no CDN).
2. **Brand ≠ primary CTA** — brand is identity (title, logo, focus, spot links). Primary buttons are **inverse ink**.
3. **Ok = green · Danger = red** — never brand orange for success or error.
4. **Brand ≠ danger ≠ ok** — burnt orange / true red / forest-mint stay separable in both modes.
5. **Interactive borders** — `#8a8a8a` (≥ ~3:1 vs page bg).
6. **Heatmap legend** — domain-fixed `#1c6052 → #d68440 → #b03a08` (never theme-branded).

---

## Visual direction

- **Chrome:** Quiet MUJI neutrals — warm paper light / charcoal dark (not slate-blue fog)
- **Brand:** Burnt orange Signal energy (`#9a3412` light → `#fb923c` dark)
- **Primary CTA:** Inverse ink (`#0a0a0a` on light / `#fafafa` on dark)
- **Cozy:** Soft card shadow + modest radii (10 / 8)
- **Type:** Onest display · Noto Sans body · JetBrains Mono chips/meta
- **Density:** `--gap` `0.55rem` · `--pad` `0.65rem`
- **Domain heat:** Fixed teal→amber→rust on the board and legend

---

## Color mode

- Attribute: `document.documentElement.dataset.theme` = `light` | `dark`
- Storage key: `kca-color-mode`
- Default: **light**
- Early paint: inline script in `src/ui/index.html` + `applyColorMode` in `main.tsx`
- Theme-color meta: light `#fcfbf9`, dark `#1a1a1a`
- Toggle: header icon (moon / sun)

Other preferences stay under `kca-*` (numpad, diagnostics, rankings, heat scale, device meta).

---

## Core palette

### Light

| Role | Hex / value | CSS var |
| --- | --- | --- |
| Page background | `#fcfbf9` | `--bg` |
| Surface / card | `#ffffff` | `--surface` |
| Chip / inset / board | `#f3f2ef` | `--chip-bg` / `--board-bg` |
| Sticky header | `rgba(252, 251, 249, 0.96)` | `--header-bg` |
| Border | `#8a8a8a` | `--border` |
| Text | `#141414` | `--text` |
| Text strong | `#0a0a0a` | `--text-strong` |
| Text muted | `#555555` | `--text-muted` |
| Brand | `#9a3412` | `--brand` |
| Brand soft / border | `#fff7ed` / `#c2410c` | `--brand-soft` / `--brand-border` |
| Ok | `#166534` | `--ok` |
| Ok soft / border | `#ecfdf5` / `#166534` | `--ok-bg` / `--ok-border` |
| Danger | `#dc2626` | `--danger` |
| Danger soft / border | `#fef2f2` / `#dc2626` | `--danger-bg` / `--danger-border` |
| Link / link spot | `#2c5282` / `#9a3412` | `--link` / `--link-spot` |
| Primary bg / fg | `#0a0a0a` / `#ffffff` | `--primary-bg` / `--primary-fg` |
| Shadow | `0 6px 18px rgba(0, 0, 0, 0.07)` | `--shadow` |

### Dark

| Role | Hex / value | CSS var |
| --- | --- | --- |
| Page background | `#1a1a1a` | `--bg` |
| Surface / card | `#242424` | `--surface` |
| Chip / board | `#1f1f1f` | `--chip-bg` / `--board-bg` |
| Sticky header | `rgba(26, 26, 26, 0.96)` | `--header-bg` |
| Border | `#8a8a8a` | `--border` |
| Text / strong / muted | `#f2f2f2` / `#fafafa` / `#a3a3a3` | `--text*` |
| Brand | `#fb923c` | `--brand` |
| Brand soft / border | `#3d2818` / `#fb923c` | `--brand-soft` / `--brand-border` |
| Ok | `#86efac` | `--ok` |
| Danger | `#ff7b72` | `--danger` |
| Link / link spot | `#8ab4c8` / `#fb923c` | `--link` / `--link-spot` |
| Primary bg / fg | `#fafafa` / `#111111` | `--primary-bg` / `--primary-fg` |
| Shadow | `0 8px 24px rgba(0, 0, 0, 0.4)` | `--shadow` |

Aliases: `--panel` → `--surface`, `--muted` → `--text-muted`.

---

## Typography

| Role | Stack |
| --- | --- |
| Body | `'Noto Sans', 'Segoe UI', system-ui, sans-serif` |
| Display | `'Onest', 'Noto Sans', 'Segoe UI', system-ui, sans-serif` |
| Mono | `'JetBrains Mono', 'IBM Plex Mono', Consolas, monospace` |

- Product title / brand wordmark: display stack, weight **700**, color `--brand`
- Section titles: display, weight 700, `--text-strong`
- Buttons: weight 600, no uppercase
- Version / keycaps / meta chips: mono, tabular nums where useful
- Prose line-height ~1.55

Fonts are **not** loaded from a CDN (privacy / offline). Install Noto / Onest / JetBrains locally for full bilingual coverage; Windows Segoe UI covers Cyrillic as fallback.

---

## Shape & density

| Token | Value | Usage |
| --- | --- | --- |
| `--radius` | `10px` | Cards, menus, modals |
| `--control-radius` | `8px` | Buttons, keys, inputs |
| `--gap` | `0.55rem` | Stack rhythm |
| `--pad` | `0.65rem` | Panel padding |
| `--board-gap` | `6px` | Keyboard grid only |
| Board well radius | `14px` | Heatmap board |
| Switch / legend | `999` | Pills |

---

## Links

| Kind | Visual |
| --- | --- |
| Quiet (`a`) | `--link`, weight 500, 1px underline |
| Spot (`a.link-spot`) | `--link-spot`, Onest, bold italic, 2px underline |
| Icon chrome (`a.btn-icon`) | No underline; muted → strong on hover |

---

## Components (recipes)

### Sticky header (`AppHeader`)

Brand left (logo + title) · primary actions center (Export / Reset) · meta right (theme, GitHub, author, version). Compact ☰ under 900px.

### Primary button (Export, Download JSON)

`--primary-bg` / `--primary-fg` / matching border — **never** `--brand` fill.

### Outlined / secondary (Cancel, Copy)

`--surface` + `--border` + `--text-strong`.

### Danger (Reset)

`--danger` + `--danger-bg` + `--danger-border`.

### Preference switch

Off: chip track + border. On: `--ok-bg` / `--ok-border` / `--ok` thumb (green enabled — not brand).

### Segmented heat scale

Active segment: inverse primary ink (selected, not ok).

### Cards (rank / diagnostics)

`--surface`, `1px` `--border`, `--radius`, `--shadow`.

### Modals

Surface + border + shadow. Reset dialog may use `.modal-danger` border tint. Titles: danger red or neutral strong.

---

## Domain: heatmap

| Stop | Hex |
| --- | --- |
| Cold | `#1c6052` (`--cold`) |
| Mid | `#d68440` (`--heat-mid`) |
| Hot | `#b03a08` (`--hot`) |

- Legend: `linear-gradient(90deg, var(--cold), var(--heat-mid), var(--hot))`
- Intensity / ink contrast: `src/shared/heat.ts` (unchanged algorithm)
- Idle keys (intensity 0): CSS `--key-bg` / `--key-border` (theme-aware); heated keys keep inline heat colors
- Scale modes: Absolute (`sqrt`) / Relative (rank) via `kca-heat-scale`

---

## Preference storage

| Key | Purpose |
| --- | --- |
| `kca-color-mode` | `light` \| `dark` |
| `kca-show-numpad` | Numpad columns |
| `kca-show-side` | Diagnostics |
| `kca-heat-scale` | `absolute` \| `relative` |
| `kca-rank-pairs` / `kca-rank-self` / `kca-rank-mods` | Ranking panels |
| `kca-device-meta` | Export layout / keyboard strings |

---

## Porting checklist

1. Copy Super tokens into `tokens.css` (or equivalent)
2. Wire `data-theme` + storage before first paint
3. Quiet vs `.link-spot` (+ icon-link exception)
4. Primary = inverse ink; brand only for identity
5. Ok green / danger red; borders `#8a8a8a`
6. Keep heatmap gradient fixed
7. Prefer local/system bilingual fonts (no tracking CDN)

---

## Consistency rules

1. New chrome → `--surface` + `--border` + radii from the table
2. New semantic color → brand / ok / danger / primary / link first
3. Sticky header layout stays brand | actions | meta
4. Heat intensity + heated-key ink stay in `heat.ts`
5. When bumping tokens: **code + this doc + `design-tokens.json`** (+ Super docs if the contract changes)
