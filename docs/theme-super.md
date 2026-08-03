# Super ★ — unified theme rules

**Status:** Applied to live `src/theme/` (site **v1.3.0+**).  
**Interactive preview:** [theme-proposals.html](./theme-proposals.html) → **Super ★**  
**Machine tokens:** [theme-super.json](./theme-super.json)  
**Live mirror:** [design-system.md](../design-system.md) · [design-tokens.json](../design-tokens.json) · `src/theme/tokens.css`  
**Shortlist context:** [theme-liked.md](./theme-liked.md)

Rules below are the contract for porting Super across bilingual (RU+EN) portfolio apps: `my`, my-raid-cds, simple-name-picker, keyboard-heatmap.

---

## Hard requirements

1. **Bilingual type** — Every UI/display/mono stack must include **Cyrillic + Latin**. Preferred: Noto Sans, Onest, JetBrains Mono / IBM Plex Mono. Do not ship Latin-only display (Syne, Space Grotesk) as sole UI fonts.
2. **Brand ≠ primary CTA** — Brand is identity (name, spot links, hover accents). Primary buttons are **inverse ink** (black on light / white on dark).
3. **Ok = green · Danger = red** — Never reuse brand orange for success or error.
4. **Brand ≠ danger ≠ ok** — Orange identity, true red errors, forest/mint success — must stay visually separable in both modes.
5. **Interactive borders** — Chrome borders `#8a8a8a` (≥ ~3:1 non-text contrast vs page bg).
6. **Heatmap legend** — Domain-only fixed gradient `#1c6052 → #d68440 → #b03a08` (never theme-branded).

---

## Visual direction

| Trait | Rule |
| --- | --- |
| Chrome | Quiet MUJI neutrals — warm paper, not slate-blue fog, not blush pink wash |
| Brand | Burnt orange (Signal energy), darkened on light for readable mock-brand / titles |
| Cozy | Soft card shadow + modest radii — Soft-lift comfort **without** pink identity |
| Type | Onest display · Noto Sans body · JetBrains Mono chips/meta |
| Density | Tighter gap/pad than default lab (`0.55rem` / `0.65rem`) |

**Avoid:** Facebook/SaaS blue as brand; pink/magenta identity; gold/brown/yellow brand; brand≈danger crimson pairs; brand≈ok mint pairs; sharp 2px Signal corners; flat zero-radius Bauhaus as default.

---

## Color mode

- Modes: `light` | `dark` (preview uses dual columns; apps use `data-theme` / equivalent)
- Default for new ports: `light`
- Both modes are first-class — do not design light-only or dark-only

---

## Core palette

### Light

| Role | Hex / value | Token |
| --- | --- | --- |
| Page background | `#fcfbf9` | `--bg` |
| Surface / card | `#ffffff` | `--surface` |
| Chip / inset | `#f3f2ef` | `--chip-bg` |
| Sticky header | `rgba(252, 251, 249, 0.96)` | `--header-bg` |
| Border | `#8a8a8a` | `--border` |
| Text | `#141414` | `--text` |
| Text strong | `#0a0a0a` | `--text-strong` |
| Text muted | `#555555` | `--text-muted` |
| Brand | `#9a3412` | `--brand` |
| Brand soft | `#fff7ed` | `--brand-soft` |
| Brand border | `#c2410c` | `--brand-border` |
| Ok | `#166534` | `--ok` |
| Ok soft / border | `#ecfdf5` / `#166534` | `--ok-bg` / `--ok-border` |
| Danger | `#dc2626` | `--danger` |
| Danger soft / border | `#fef2f2` / `#dc2626` | `--danger-bg` / `--danger-border` |
| Link (quiet) | `#2c5282` | `--link` |
| Link spot | `#9a3412` | `--link-spot` |
| Primary bg / fg | `#0a0a0a` / `#ffffff` | `--primary-bg` / `--primary-fg` |
| Shadow | `0 6px 18px rgba(0, 0, 0, 0.07)` | `--shadow` |

### Dark

| Role | Hex / value | Token |
| --- | --- | --- |
| Page background | `#1a1a1a` | `--bg` |
| Surface / card | `#242424` | `--surface` |
| Chip / inset | `#1f1f1f` | `--chip-bg` |
| Sticky header | `rgba(26, 26, 26, 0.96)` | `--header-bg` |
| Border | `#8a8a8a` | `--border` |
| Text | `#f2f2f2` | `--text` |
| Text strong | `#fafafa` | `--text-strong` |
| Text muted | `#a3a3a3` | `--text-muted` |
| Brand | `#fb923c` | `--brand` |
| Brand soft | `#3d2818` | `--brand-soft` |
| Brand border | `#fb923c` | `--brand-border` |
| Ok | `#86efac` | `--ok` |
| Ok soft / border | `rgba(134, 239, 172, 0.12)` / `#86efac` | `--ok-bg` / `--ok-border` |
| Danger | `#ff7b72` | `--danger` |
| Danger soft / border | `rgba(255, 123, 114, 0.14)` / `#ff7b72` | `--danger-bg` / `--danger-border` |
| Link (quiet) | `#8ab4c8` | `--link` |
| Link spot | `#fb923c` | `--link-spot` |
| Primary bg / fg | `#fafafa` / `#111111` | `--primary-bg` / `--primary-fg` |
| Shadow | `0 8px 24px rgba(0, 0, 0, 0.4)` | `--shadow` |

**Contrast targets:** text / muted / brand / ok / danger / link / link-spot ≥ **4.5:1** on `--bg` (WCAG AA). Borders ≥ ~**3:1**. Brand-soft is for fills/spotlight — keep opaque enough that brand text on soft still reads (dark soft is solid `#3d2818`, not translucent orange).

---

## Typography

| Role | Stack | Notes |
| --- | --- | --- |
| Body | `'Noto Sans', system-ui, sans-serif` | UI copy, paragraphs |
| Display | `'Onest', 'Noto Sans', system-ui, sans-serif` | Brand name, spot links, titles that need presence |
| Mono | `'JetBrains Mono', 'IBM Plex Mono', monospace` | Chips, meta, code-like chrome |

- Profile / product **brand name** on identity surfaces: display stack, **weight 700** (not light 500)
- Body line-height ~**1.55–1.65** in prose

---

## Shape & density

| Token | Value |
| --- | --- |
| Card / panel radius | `10px` (`--radius`) |
| Control / button radius | `8px` (`--control-radius`) |
| Stack gap | `0.55rem` (`--gap`) |
| Panel padding | `0.65rem` (`--pad`) |

---

## Links (two kinds)

| Kind | When | Visual |
| --- | --- | --- |
| **Quiet** (`a` / `--link`) | Informational, secondary, “about / docs / changelog” | Slate color **≠ body text**; weight 500; **1px** underline; underline-offset ~3px |
| **Spot** (`a.link-spot` / `--link-spot`) | Must be found immediately in prose / primary text CTAs | Brand color; **Onest**; **bold + italic**; **2px** underline; slight letter-spacing |

Rules:

- Quiet links must **not** match `--text` / `--text-strong` (they are slate, not ink).
- Spot links must **not** look like quiet links — heavier type + thicker underline + brand hue.
- Hover may intensify toward brand; do not turn quiet links into full spot styling on hover alone.
- Prefer spot for “Open CV”, “Export”, “Open BiS”, primary in-copy actions; quiet for reference footnotes.

---

## Components (recipes)

### Primary button

- Fill `--primary-bg`, text `--primary-fg`, border matches fill
- Never fill with `--brand`

### Outlined / secondary button

- Surface or transparent + `--border` + `--text-strong`

### Status buttons / chips

- Ok → `--ok` + `--ok-bg` + `--ok-border`
- Danger → `--danger` + `--danger-bg` + `--danger-border`
- Brand chip → brand border/text on soft brand fill (identity only)

### Cards

- `--surface`, `1px` `--border`, `--radius`, optional `--shadow` on bars/cards for cozy lift

### Spotlight / emphasis panel

- Border `--brand-border`; background mix of `--brand-soft` into `--surface`

### Brand wordmark

- Color `--brand`; display font; weight **700**

---

## Domain exceptions

| App | Keep separate from Super chrome |
| --- | --- |
| keyboard-heatmap | Heat legend gradient fixed (see Hard requirements) |
| simple-name-picker | Like = ok green · Ban = danger red (no purple) |
| my-raid-cds | BiS/ready = ok · Defect = danger |

---

## Porting checklist

1. Copy tokens from [theme-super.json](./theme-super.json) into the app theme layer (`tokens.css` or equivalent).
2. Wire light/dark to the app’s color-mode attribute.
3. Implement quiet vs `.link-spot` link styles (or shared `links.css`).
4. Swap brand/primary usage so CTAs stay ink.
5. Verify Cyrillic glyph coverage for Onest / Noto / JetBrains Mono.
6. Run contrast checks (text, muted, brand, ok, danger, link, link-spot, border).
7. Keep heatmap domain colors untouched if that app is in scope.

---

## Provenance (why these rules)

Synthesized from shortlist feedback: Wasabi/Beni quiet chrome · Signal orange (readable, ≠ danger/ok) · Coral radii · Soft-lift shadow without pink · Coral Onest type · brighter dark danger · slate quiet links ≠ text · lighter paper in both modes. See [theme-liked.md](./theme-liked.md).
