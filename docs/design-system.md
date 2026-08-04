# Design system — Keyboard Heatmap

Portable visual tokens and UI recipes used by this app. Use as:

1. **In-repo reference** when adding chrome, panels, controls, and heatmap surfaces
2. **Import seed** for another project (`docs/design-tokens.json` + this file)
3. **Cross-project alignment** with other sergimax apps (sticky blurred header, shared chrome tokens) — keep core chrome stable; extend the heatmap domain layer here only

**Source of truth (code):**

| Layer | Path |
| --- | --- |
| Theme CSS variables | `src/ui/styles/tokens.css` |
| Quiet / spot links | `src/ui/styles/links.css` |
| Layout + component recipes | `src/ui/styles/app.css` |
| Color mode | `src/ui/color-mode.ts` (`kca-color-mode`) |
| Heat spectrum + key ink | `src/shared/heat.ts` |
| Sticky app chrome | `src/ui/components/AppHeader.tsx` |
| Preference switch | `src/ui/components/PreferenceSwitch.tsx` |
| Machine tokens | `docs/design-tokens.json` |

No MUI (or other component library) — plain React + CSS. When tokens change in code, update this doc and `design-tokens.json` in the same change.

---

## Visual direction

| Trait | Rule |
| --- | --- |
| Chrome | Quiet MUJI neutrals — warm paper (`#fcfbf9`), not slate-blue fog |
| Brand | Burnt orange — identity only (title, spot links, focus accents) |
| Primary CTA | Inverse ink (black on light / white on dark) — **never** brand fill |
| Ok / Danger | Forest/mint green · true red — never reuse brand orange |
| Domain heat | Fixed `#1c6052 → #d68440 → #b03a08` (never theme-branded) |
| Type | Onest display · Noto Sans body · JetBrains Mono chips/meta (Cyrillic + Latin) |
| Density | Stack gap `0.55rem`, panel pad `0.65rem`; board grid gap stays `6px` |
| Radii | Controls `8px`, panels `10px`, board `14px`; pills for switches / legend |

**Avoid:** teal-as-brand SaaS chrome; pink/magenta identity; brand≈danger or brand≈ok pairs; Latin-only display fonts (Syne, Space Grotesk).

---

## Color mode

- Modes: `light` | `dark` via `html[data-theme]`
- Default: **light**
- Preference: `localStorage` `kca-color-mode`
- FOUC guard: inline script in `src/ui/index.html` applies stored mode before paint
- Header toggle (sun/moon) in `AppHeader` meta cluster

Other prefs stay under the `kca-*` prefix (numpad, rankings, export meta) — separate from color mode.

---

## Core palette

### Light

| Role | Hex / value | CSS var |
| --- | --- | --- |
| Page background | `#fcfbf9` | `--bg` |
| Surface / card | `#ffffff` | `--surface` (`--panel` alias) |
| Chip / inset / board well | `#f3f2ef` | `--chip-bg` / `--board-bg` / `--key-bg` |
| Sticky header | `rgba(252, 251, 249, 0.96)` | `--header-bg` |
| Border | `#8a8a8a` | `--border` |
| Text | `#141414` | `--text` |
| Text strong | `#0a0a0a` | `--text-strong` |
| Text muted | `#555555` | `--text-muted` (`--muted` alias) |
| Brand | `#9a3412` | `--brand` |
| Brand soft / border | `#fff7ed` / `#c2410c` | `--brand-soft` / `--brand-border` |
| Ok | `#166534` | `--ok` (+ `--ok-bg` / `--ok-border`) |
| Danger | `#dc2626` | `--danger` (+ `--danger-bg` / `--danger-border`) |
| Link quiet / spot | `#2c5282` / `#9a3412` | `--link` / `--link-spot` |
| Primary bg / fg | `#0a0a0a` / `#ffffff` | `--primary-bg` / `--primary-fg` |
| Shadow | `0 6px 18px rgba(0, 0, 0, 0.07)` | `--shadow` |

### Dark

| Role | Hex / value | CSS var |
| --- | --- | --- |
| Page background | `#1a1a1a` | `--bg` |
| Surface / card | `#242424` | `--surface` |
| Chip / inset / board well | `#1f1f1f` | `--chip-bg` / `--board-bg` / `--key-bg` |
| Sticky header | `rgba(26, 26, 26, 0.96)` | `--header-bg` |
| Border | `#8a8a8a` | `--border` |
| Text | `#f2f2f2` | `--text` |
| Text strong | `#fafafa` | `--text-strong` |
| Text muted | `#a3a3a3` | `--text-muted` |
| Brand | `#fb923c` | `--brand` |
| Brand soft / border | `#3d2818` / `#fb923c` | `--brand-soft` / `--brand-border` |
| Ok | `#86efac` | `--ok` |
| Danger | `#ff7b72` | `--danger` |
| Link quiet / spot | `#8ab4c8` / `#fb923c` | `--link` / `--link-spot` |
| Primary bg / fg | `#fafafa` / `#111111` | `--primary-bg` / `--primary-fg` |
| Shadow | `0 8px 24px rgba(0, 0, 0, 0.4)` | `--shadow` |

**Contrast:** text / muted / brand / ok / danger / link / link-spot ≥ **4.5:1** on `--bg`. Borders ≥ ~**3:1**.

---

## Shape & radius

| Token | Value | Usage |
| --- | --- | --- |
| `--control-radius` | `8px` | Buttons, keys, inputs |
| Menu item | `6px` | Compact header menu rows |
| `--radius` | `10px` | Rank cards, menus, dialogs |
| Board | `14px` | Keyboard heatmap well |
| Switch / legend swatch | `999` | Preference track, heat legend bar |
| Focus ring clip | `4px` | Preference switch `:focus-visible` |

Spacing: `--gap` `0.55rem` (stacks), `--pad` `0.65rem`, `--board-gap` `6px` (keyboard grid only).

---

## Borders

```text
border: 1px solid var(--border); /* #8a8a8a both modes */
```

Interactive chrome uses the same `--border` (no separate soft divider family). Brand / danger / primary borders only on semantic controls.

---

## Elevation / shadows

| Token | Usage |
| --- | --- |
| `--shadow` | Rank cards, menus, dialogs (cozy Soft-lift) |
| App bar | backdrop blur + `--header-bg` |
| Key label (light ink) | soft black text-shadow from `heatKeyStyle` |

---

## Typography

| Role | Stack |
| --- | --- |
| Body | `'Noto Sans', system-ui, sans-serif` → `--font-body` |
| Display | `'Onest', 'Noto Sans', system-ui, sans-serif` → `--font-display` |
| Mono | `'JetBrains Mono', 'IBM Plex Mono', monospace` → `--font-mono` |

| Style | Rules |
| --- | --- |
| Brand title | display, weight **700**, color `--brand` |
| Section title | display, weight 700, `--text-strong` |
| Buttons | weight 600, no uppercase |
| Meta / chips / version | mono or muted body |
| Rank list | `0.78rem`, tabular nums; screen top **12**, Copy top **30** |
| Prose line-height | ~1.55 |

Fonts loaded from Google Fonts in `src/ui/index.html` (Cyrillic + Latin).

---

## Links

| Kind | When | Visual |
| --- | --- | --- |
| Quiet (`a`) | Docs / reference | `--link`, weight 500, 1px underline |
| Spot (`a.link-spot`) | Primary in-copy actions | `--link-spot`, Onest, bold italic, 2px underline |
| Icon (`a.btn-icon`) | Header meta | muted, no underline |

---

## App shell

### Sticky header (`AppHeader`)

1. **Brand left** — logo (CSS mask, `--brand-border` orange) + `Keyboard Heatmap` title (`--brand` / display)
2. **Primary actions center** (desktop ≥900px) — Export (primary ink) / Reset (danger)
3. **Meta right** — theme toggle, GitHub, author, `v.X.Y.Z`
4. **Compact under 900px** — ☰ menu for Export / Reset; meta icons stay visible

| Token | Value |
| --- | --- |
| Content max width | `1400px` |
| Toolbar min height | `56px` |
| Main padding | `20px 20px 48px` |
| Compact breakpoint | `900px` |

### Main composition

1. Intro note under header
2. **Heatmap** — numpad + heat-scale controls above the board; legend under
3. **Details** — MetaBar → panel toggles → diagnostics + ranking cards

---

## Controls & surfaces

### Recipes

1. **Toolbar primary** (`.btn-toolbar-primary`) — `--primary-bg` / `--primary-fg` (Export)
2. **Toolbar danger** (`.btn-toolbar-danger`) — `--danger` on `--danger-bg` (Reset)
3. **Outlined toolbar** (`.btn-toolbar`) — transparent + `--border` + `--text-strong`
4. **Icon button** (`.btn-icon`) — 36×36, muted → strong + `--action-hover`
5. **Preference switch** — off: chip + border; on: primary ink track
6. **Segmented control** (`.heat-scale`) — chip well; active = primary ink
7. **Rank / diagnostics card** — `--surface` + `--border` + `--radius` + `--shadow`
8. **Modal** — surface paper, neutral or danger title; Cancel / Primary / Danger actions
9. **Copy** — primary ink (compact in rank headers)
10. **Text fields** — chip fill, `--border`, focus `--brand-border`

`textTransform: none` everywhere; disabled ≈ `opacity: 0.55`.

---

## Domain: heatmap

Heat spectrum is product-specific — keep it separate from app chrome colors.

### Spectrum

Implemented in `src/shared/heat.ts` (`heatRgb`) and CSS (`--cold`, `--heat-mid`, `--hot`):

| Stop | Hex | Notes |
| --- | --- | --- |
| Idle | theme `--key-bg` | CSS only when intensity = 0 (not heat-branded) |
| Cold | `#1c6052` | `--cold` |
| Mid | `#d68440` | `--heat-mid` |
| Hot | `#b03a08` | `--hot` |

Legend:

```css
linear-gradient(90deg, var(--cold), var(--heat-mid), var(--hot))
```

### Scale modes (`kca-heat-scale`)

| Mode | Intensity | Caption |
| --- | --- | --- |
| **Absolute** (default) | `sqrt(count / max)` | Press counts |
| **Relative** | Rank / percentile among pressed keys | `%` share |

### Key ink (`heatKeyStyle`)

- Dark ink on warm mid/hot fills; light ink on deep teal
- Borders: warm `#4a3424`, cool heated `#2a4038`
- Idle keys: no inline heat style — theme `--key-bg` / `--key-border` / `--text`

Board grid: 24 columns with numpad / 19 without; rows `44px`; gap `--board-gap` (`6px`); key radius `8px`.

---

## Preference storage

| Key | Purpose | Default |
| --- | --- | --- |
| `kca-color-mode` | `light` \| `dark` | `light` |
| `kca-show-numpad` | Show numpad columns | off |
| `kca-show-side` | Diagnostics card | on |
| `kca-heat-scale` | `absolute` \| `relative` | `absolute` |
| `kca-rank-pairs` | Top pairs ranking | off |
| `kca-rank-self` | Self-repeats ranking | off |
| `kca-rank-mods` | Modifier chords ranking | off |
| `kca-device-meta` | Export layout / keyboard strings | empty |

---

## Porting checklist

**Core (reuse across sergimax apps)**

1. Copy palette + CSS variables from `design-tokens.json` / `tokens.css`
2. Wire `data-theme` light/dark + FOUC script + optional toggle
3. Quiet vs `.link-spot` link styles
4. Brand ≠ primary CTA (ink primaries); ok green / danger red
5. Cyrillic-capable fonts (Onest / Noto / JetBrains Mono)

**Domain**

- Keep heat legend fixed; idle keys theme-aware via CSS

**Do not port blindly**

- `kca-*` storage keys (rename per app)
- Keyboard grid geometry / keymap labels
- Collector / stats semantics

---

## Consistency rules for agents & humans

1. New chrome → `--surface` + `--border` + radius from the table — not ad-hoc hex families
2. Semantic color → **brand** (identity), **primary ink** (CTA), **ok**, **danger**, or **heat stops**
3. Keep sticky header layout (brand / actions / meta); no MUI
4. Prefer CSS variables; promote hard-coded repeats when touching a cluster
5. Heat intensity and heated-key ink stay in `src/shared/heat.ts`
6. When bumping tokens, update **code + this doc + `design-tokens.json`**
