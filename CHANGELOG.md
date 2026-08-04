# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- UI chrome: warm MUJI neutrals, burnt-orange brand (≠ primary CTA), true red danger / green ok, Onest + Noto Sans + JetBrains Mono (Cyrillic+Latin)
- Light/dark color modes via `data-theme` (default light; `localStorage` `kca-color-mode`); header toggle
- Primary actions use inverse ink; heatmap legend stays fixed `#1c6052 → #d68440 → #b03a08`

## [2.3.2] - 2026-08-03

### Added

- Design system docs: `docs/design-system.md` and `docs/design-tokens.json` (dark chrome, teal accent, heatmap spectrum / ink rules)

## [2.3.1] - 2026-08-01

### Changed

- Project rename to **Keyboard Heatmap** (`keyboard-heatmap`): package name, GitHub repo link, Export JSON download filename, and README title

## [2.3.0] - 2026-08-01

### Added

- **Diagnostics** toggle (`localStorage` `kca-show-side`) to show/hide suspicious repeats, recording intervals, and unmapped codes
- Ranking section toggles for **Top pairs** / **Self-repeats** / **Modifier chords** (default off; most-popular keys always shown)
- Sticky blurred app bar with logo, GitHub / author links, and `v.X.Y.Z` chrome (compact ☰ menu under 900px)

### Changed

- Layout: project note under the header; numpad toggle and heatmap-number scale above the board; **Details** groups summary stats, panel toggles, then compact diagnostics + ranking cards
- **Export** and **Reset** are toolbar actions with modals (layout/keyboard meta in Export; Reset only while collect is live)
- Ranking blocks are denser (fit-content columns, top 12 on screen; Copy still includes full top 30)

## [2.2.0] - 2026-07-31

### Added

- Per-key `repeatCount` in `stats.json` — OS auto-repeat while a key is held (separate from physical `count`); shown in heatmap key tooltips
- **Bursts** — press runs separated by >1s idle (`stats.bursts.count` / `longest`); MetaBar + Export JSON show avg burst length and bursts/hour
- Heatmap scale toggle **Absolute** / **Relative (%)** (`localStorage` `kca-heat-scale`): relative shows share captions and rank-based colors so dominant keys (e.g. Space) do not wash out the board
- **Suspicious repeats** — sparse per-key counters for same-key gaps under 30ms / 50ms (`stats.suspiciousRepeats`); side panel list for bounce / double-register / dying switches (no full interval storage)
- **Modifier chords** (`stats.modifierPairs`) — true held-modifier + key combos via collector `mods` bitmask; UI/export separate from sequential bigrams
- Rankings split transitions into **Top pairs** (A≠B), **Self-repeats** (A→A), and **Modifier chords** (top 30 each)
- Export JSON metadata: `appVersion` (from package.json) and `schemaVersion` (export shape; currently `2`), alongside existing `exportedAt`
- App version shown in the UI header (`vX.Y.Z`)

### Changed

- Collector emits NDJSON `rep` (`0` = first-down, `1` = auto-repeat) and `mods` (held-modifier bitmask); heatmaps, rankings, transitions, and session press totals still use physical first-downs only
- **Reset stats** opens an in-app confirm dialog (Cancel focused by default; Escape / backdrop dismiss) instead of a one-click/`window.confirm` path that was easy to miss
- Export `rankings.*.transitions` is now `{ topPairs, selfRepeats, modifierPairs }` (full maps remain under `stats`)
- MetaBar split into presses/hottest vs burst/recording stats; toolbar separates display options from export fields
- Heatmap legend explains Absolute vs Relative with concrete anchors (e.g. hottest key label)

## [2.1.0] - 2026-07-31

### Added

- Export JSON `intensity.pressesPerMinute` (presses ÷ active recording minutes; computed at export)
- Export JSON / UI top rows include `share` (fraction of period presses); UI shows e.g. `Space — 963 · 11.7%`
- Export JSON `meta` (`platform`, user-supplied `keyboardLayout` / `keyboardModel`; not OS-detected; saved in `localStorage`)
- **Key transitions** — consecutive first-down pairs aggregated in `stats.transitions` / daily buckets; top-20 in UI + Export JSON (hotkeys / nav patterns; O(1) per press)

### Changed

- Export JSON period timing: `recordingMs` → `timing.activeRecordingMs` plus `periodMs` / `idleMs` (calendar window vs completed collect overlap)
- UI labels: **Active recording** instead of **Recorded**
- Heatmap key text picks high-contrast ink (dark on warm mid/hot keys); key labels use a monospace stack for readability
- Ranking list number padding so two-digit indexes are not clipped

## [2.0.0] - 2026-07-29

### Added

- **React + Vite** heatmap UI (`src/ui`) with JSON API (`GET /api/stats`, `POST /api/reset`)
- Shared browser-safe helpers under `src/shared/` (heat, dates, period rankings)
- **Day / last 7 days** rankings under the keyboard, each with presses, recorded time, and its own **Copy** button
- Per-day key buckets in `data/stats.json` (`daily`) so period rankings work going forward (retained ~60 days)
- **Export JSON** button — downloads summary, period rankings (top 30), and full `stats` snapshot
- **Show numpad** switch (default Off / hidden; preference in `localStorage`)
- `npm run build:ui` / `npm run build` to produce `dist/ui`

### Changed

- `npm run report` opens a localhost React viewer (Ctrl+C to stop) instead of writing `data/heatmap.html`
- Live updates poll JSON (~1s) instead of HTML `/partial` replacement
- Ranking **Copy** blocks sit under the heatmap as three separate panels
- Top ranking lists show up to **30** keys

### Removed

- String-templated `templates/heatmap.html` / `src/report.ts` static HTML generator
- Writing or deleting `data/heatmap.html` — open the report viewer instead of a standalone HTML file

## [1.1.0] - 2026-07-29
### Added

- Reset stats button in the live heatmap UI (`POST /reset` on localhost while `collect` is running)
- Canonical key aliases so alternate Windows scan/extended variants merge onto one heatmap cell
- Recording timers stored in `data/stats.json` (`recordingMs`, `sessions`)
- Live/static UI: **Total recorded** and **Recording intervals** (completed start→stop runs only)
- Current session duration in the collect terminal only (`session mm:ss · presses N`)

### Fixed

- Map Right Shift as scan code `54:1` (Windows often sets the extended bit); alias `54:0` → `54:1`
- Prefer stable VK-based ids in the collector for RShift / LWin / RWin / Menu when Windows reports them inconsistently
- Render live controls inside the heatmap body so template placeholders cannot appear in the browser

## [1.0.0] - 2026-07-29

### Added

- Local Windows collector (Rust) using `WH_KEYBOARD_LL` for physical key-down events (scan code + extended flag)
- Node/TypeScript CLI: `collect`, `report`, `reset`
- Accumulating stats in `data/stats.json` (offline, gitignored)
- Static HTML keyboard heatmap with intensity coloring and top-keys list
- Live localhost heatmap during `collect` at `http://127.0.0.1:17823/` (bound to loopback only, ~1s refresh)
- Colored CLI success/error markers
- Ignore key-up and OS auto-repeat (one count per physical press)
- README with setup, usage, and privacy notes
