# Design system — Keyboard Heatmap

Portable visual tokens and UI recipes used by this app. Use as:

1. **In-repo reference** when adding chrome, panels, controls, and heatmap surfaces
2. **Import seed** for another project (`docs/design-tokens.json` + this file)
3. **Cross-project alignment** with other sergimax apps (sticky blurred header, soft borders) — keep core chrome stable; extend the heatmap domain layer here only

**Source of truth (code):**

| Layer | Path |
| --- | --- |
| CSS variables + layout | `src/ui/styles/app.css` |
| Heat spectrum + key ink | `src/shared/heat.ts` |
| Sticky app chrome | `src/ui/components/AppHeader.tsx` |
| Preference switch | `src/ui/components/PreferenceSwitch.tsx` |
| Machine tokens | `docs/design-tokens.json` |

No MUI (or other component library) — plain React + CSS. When tokens change in code, update this doc and `design-tokens.json` in the same change.

---

## Visual direction

- **Base:** Cool slate / ink dark (`#12151a` page, `#1a1f27` panels) — not pure black
- **Accent / primary:** Teal (`#1f6f5b` fill → `#2f9e82` border → `#3db894` hover)
- **Danger / warm chrome:** Rust-orange (`#f4a261` text, `#5a4030` / `#e85d04` borders) — Reset, error, warm modal frame
- **Domain heat:** Teal cold → amber mid → rust hot (`--cold` / `#d68440` / `--hot`)
- **Surfaces:** Soft panels with `1px` divider borders and light elevation; no heavy multi-layer glow
- **Radii:** Soft but not pill-heavy — controls `8px`, panels/menus `10px`, keyboard board `14px`; pills only for switches / legend swatch
- **Type:** Segoe UI / IBM Plex Sans stack for chrome; monospace stack on keycaps
- **Atmosphere:** Fixed teal + warm radial washes on `body` over `--bg`

Avoid defaulting new work to purple-on-white gradients, cream/serif “AI landing” looks, or neon glow chrome. This product is intentionally **dark-only**.

---

## Color mode

- **Dark only** — no `data-color-mode` toggle and no light palette
- Preferences live in `localStorage` under the `kca-*` prefix (display toggles, export device meta) — not theme mode

---

## Core palette (dark)

| Role | Hex / value | CSS var |
| --- | --- | --- |
| Text | `#e8edf5` | `--text` |
| Text muted | `#8b95a8` | `--muted` |
| Text soft (toolbar btn) | `#c5cddb` | — |
| Page background | `#12151a` | `--bg` |
| Surface / panel | `#1a1f27` | `--panel` |
| Board well | `#141820` | — |
| Divider / chrome border | `#2a3140` | — |
| Control border | `#3a4456` | — |
| Idle key fill / border | `#252b36` / `#343c4a` | `--key-bg` / `--key-border` |
| Accent fill | `#1f6f5b` | — |
| Accent border | `#2f9e82` | — |
| Accent soft fill | `#1a2e28` | — |
| Accent foreground | `#b8e0d4` | — |
| Danger text | `#f4a261` | — |
| Danger border | `#5a4030` | — |
| Danger hot border | `#e85d04` | — |
| Hover wash | `rgba(232, 237, 245, 0.08)` | — |

Declared on `:root` today: `--bg`, `--panel`, `--text`, `--muted`, `--key-bg`, `--key-border`, `--cold`, `--hot`, `--gap`. Many chrome colors are still hard-coded hex in `app.css` — prefer mapping new work to the table above (and promote to CSS vars when touching a cluster).

### Page atmosphere (`body`)

```text
radial-gradient(1200px 600px at 10% -10%, #1e3a34 0%, transparent 55%),
radial-gradient(900px 500px at 100% 0%, #3a2418 0%, transparent 50%),
var(--bg)
```

Teal wash top-left + warm wash top-right — echoes the cold→hot heat story without competing with the board.

---

## Shape & radius

| Token | Value (px) | Usage |
| --- | --- | --- |
| Control | `8` | Toolbar buttons, icon buttons, keys, inputs, modal actions, Copy |
| Menu item | `6` | Compact header menu rows |
| Panel / menu / dialog | `10` | Rank cards, overflow menu, modals |
| Board | `14` | Keyboard heatmap well |
| Switch / legend swatch | `999` | Preference track, heat legend bar |
| Focus ring clip | `4` | Preference switch `:focus-visible` |

---

## Borders

Default chrome:

```text
border: 1px solid #2a3140
```

| Surface | Border | Notes |
| --- | --- | --- |
| App bar bottom | `#2a3140` | Over translucent blurred bar |
| Rank / diagnostics cards | `#2a3140` on `--panel` | Dense fit-content columns |
| Keyboard board | `#2a3140` on `#141820` | |
| Toolbar / cancel / inputs | `#3a4456` | Hover often `#5a6a82` |
| Accent actions (Copy, primary modal, switch on) | `#2f9e82` | Hover `#3db894` |
| Danger / Reset / warm modal frame | `#5a4030` → `#e85d04` / `#8a3a2a` | Keep warm family together |

Do **not** invent a second generic divider — reuse `#2a3140` / `#3a4456`.

---

## Elevation / shadows

Keep shadows soft and dark (no colored glow).

| Token | Value | Usage |
| --- | --- | --- |
| Menu | `0 10px 28px rgba(0, 0, 0, 0.35)` | Compact header ☰ menu |
| Dialog | `0 16px 48px rgba(0, 0, 0, 0.45)` | Export / Reset modals |
| App bar | backdrop blur only | `saturate(1.2) blur(12px)` + `rgba(26, 31, 39, 0.72)` fill |
| Key label (light ink) | `0 0 2px rgba(0,0,0,0.85), 0 1px 1px rgba(0,0,0,0.7)` | From `heatKeyStyle` when ink is light |

---

## Typography

```text
"Segoe UI", "IBM Plex Sans", system-ui, sans-serif
```

Keycaps:

```text
"Cascadia Mono", "Cascadia Code", Consolas, "SF Mono", "Segoe UI Mono", ui-monospace, monospace
```

| Style | Rules |
| --- | --- |
| App / Details title | `1.15rem`, weight `650`, `letter-spacing: 0.02em` |
| Buttons | weight `600`, no uppercase transform |
| Meta / notes | muted `--muted`, ~`0.85`–`0.95rem` |
| Rank list | `0.78rem`, tabular nums; screen shows top **12**, Copy still top **30** |
| Rank subheads | uppercase, muted, `0.75rem` |
| Version chip | `0.75rem`, muted, tabular nums |

---

## App shell

### Sticky header (`AppHeader`)

Same sergimax chrome pattern as sibling apps:

1. **Brand left** — logo + `Keyboard Heatmap` title
2. **Primary actions center** (desktop ≥900px) — Export / Reset
3. **Meta right** — GitHub, author, `v.X.Y.Z`
4. **Compact under 900px** — ☰ menu for Export / Reset; meta icons stay visible

Shell metrics:

| Token | Value |
| --- | --- |
| Content max width | `1400px` (toolbar + main) |
| Toolbar min height | `56px` |
| Main padding | `20px 20px 48px` |
| Compact breakpoint | `900px` |

### Main composition

1. Intro note under header
2. **Heatmap** — numpad + heat-scale controls above the board; legend under
3. **Details** — MetaBar summary → panel toggles → compact diagnostics + ranking cards

---

## Controls & surfaces

### Recipes

1. **Toolbar button** (`.btn-toolbar`) — transparent, `#3a4456` border, soft text; hover shifts to accent teal. Danger variant uses warm border/text (Reset).
2. **Icon button** (`.btn-icon`) — 36×36, radius 8, muted → text + hover wash.
3. **Preference switch** (`PreferenceSwitch` / `.numpad-toggle`) — pill track; off slate, on accent teal; shared by numpad, diagnostics, ranking toggles.
4. **Segmented control** (`.heat-scale`) — Absolute / Relative; active segment accent fill `#1f6f5b`.
5. **Rank / diagnostics card** (`.rank-block`) — `--panel` + divider border + radius 10; width ~`15rem`.
6. **Modal** — warm-bordered paper `#1a1520` (danger title `#ffd4a8`, neutral title uses `--text`); Cancel / Primary (teal) / Danger actions; backdrop `rgba(8, 10, 14, 0.72)`.
7. **Copy** (`.btn-copy`) — accent outlined fill; compact size inside rank headers.
8. **Text fields** (`.device-meta-input`) — board-well fill, control border, accent focus ring via border color.

### Buttons (summary)

| Variant | Border | Fill | Text |
| --- | --- | --- | --- |
| Toolbar default | `#3a4456` | transparent → `#1a2e28` hover | `#c5cddb` |
| Toolbar danger | `#5a4030` | → `#3a2a20` | `#f4a261` → `#ffd4a8` |
| Modal cancel | `#3a4456` | `#222a3a` | `--text` |
| Modal primary | `#2f9e82` | `#1a2e28` | `#b8e0d4` |
| Modal danger | `#8a3a2a` | `#3a1c18` | `#ffb4a2` |
| Copy | `#1f6f5b` | `#1a2e28` | `#b8e0d4` |

`textTransform: none` everywhere; disabled ≈ `opacity: 0.55`.

---

## Domain: heatmap

Port only when the target UI needs a physical-key heat board.

### Spectrum

Implemented in `src/shared/heat.ts` (`heatRgb`) and mirrored in CSS (`--cold`, `--hot`, legend mid `#d68440`):

| Stop | RGB | Hex |
| --- | --- | --- |
| Idle / zero | `37, 43, 54` | `#252b36` (matches `--key-bg`) |
| Cold | `28, 96, 82` | `#1c6052` (`--cold`) |
| Mid | `214, 132, 64` | `#d68440` |
| Hot | `176, 58, 8` | `#b03a08` (`--hot`) |

Interpolation: cold→mid for intensity `0…0.5`, mid→hot for `0.5…1`.

Legend swatch:

```css
linear-gradient(90deg, var(--cold), #d68440, var(--hot))
```

### Scale modes (`kca-heat-scale`)

| Mode | Intensity | Caption |
| --- | --- | --- |
| **Absolute** (default) | `sqrt(count / max)` | Press counts |
| **Relative** | Rank / percentile among pressed keys | `%` share of total presses |

Relative mode keeps mid-tier keys visible when Space (or another dominant key) would otherwise wash the board.

### Key ink (`heatKeyStyle`)

- Prefer **dark ink** on warm mid/hot fills (high R vs B) and brighter backgrounds
- Prefer **light ink** on deep teal / idle; add soft black text-shadow for contrast
- Borders: warm `#4a3424`, cool heated `#2a4038`, idle `#343c4a`

Board grid: 24 columns with numpad / 19 without; rows `44px`; gap `--gap` (`6px`); key radius `8px`.

---

## Preference storage

| Key | Purpose | Default |
| --- | --- | --- |
| `kca-show-numpad` | Show numpad columns | off |
| `kca-show-side` | Diagnostics card | on |
| `kca-heat-scale` | `absolute` \| `relative` | `absolute` |
| `kca-rank-pairs` | Top pairs ranking | off |
| `kca-rank-self` | Self-repeats ranking | off |
| `kca-rank-mods` | Modifier chords ranking | off |
| `kca-device-meta` | Export layout / keyboard strings | empty |

Rename the prefix if seeding another app.

---

## Porting checklist

**Core (reuse across sergimax dark tools)**

1. Copy palette + CSS variables from `design-tokens.json` / this doc
2. Sticky blurred app bar: brand | actions | meta; compact menu under ~900px
3. Border recipe: `1px solid` divider / control / accent — radii 8 / 10 / 14
4. Accent teal for primary actions; warm rust only for destructive / caution
5. Body atmosphere: dual radial washes over page bg

**Optional / domain**

- Heat spectrum + `heatKeyStyle` ink rules
- Preference switch + segmented Absolute/Relative control
- Rank card denseness (top 12 on screen / Copy 30)

**Do not port blindly**

- `kca-*` storage keys (rename per app)
- Keyboard grid geometry / keymap labels
- Collector / stats semantics

---

## Consistency rules for agents & humans

1. New chrome surfaces → `--panel` or board well + `#2a3140` / `#3a4456` border + radius from the table — not ad-hoc hex families
2. New semantic color → map to **accent teal**, **danger warm**, or **heat stops** first
3. Keep the sticky header layout (brand / actions / meta); no MUI
4. Prefer CSS variables for anything reused more than once; promote hard-coded repeats when you touch them
5. Heat intensity and ink contrast stay in `src/shared/heat.ts` — don’t fork a second gradient in components
6. When bumping tokens, update **code + this doc + `design-tokens.json`**
