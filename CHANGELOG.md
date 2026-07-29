# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **React + Vite** heatmap UI (`src/ui`) with JSON API (`GET /api/stats`, `POST /api/reset`)
- Shared browser-safe helpers under `src/shared/` (heat, dates, period rankings)
- **Day / last 7 days** rankings under the keyboard, each with presses, recorded time, and its own **Copy** button
- Per-day key buckets in `data/stats.json` (`daily`) so period rankings work going forward (retained ~60 days)
- **Show numpad** checkbox to hide/show the numpad on the heatmap (saved in `localStorage`)
- `npm run build:ui` / `npm run build` to produce `dist/ui`

### Changed

- `npm run report` opens a localhost React viewer (Ctrl+C to stop) instead of writing `data/heatmap.html`
- Live updates poll JSON (~1s) instead of HTML `/partial` replacement
- Ranking **Copy** blocks sit under the heatmap as three separate panels
- Top ranking lists show up to **30** keys

### Removed

- String-templated `templates/heatmap.html` / `src/report.ts` static HTML generator
- Writing or deleting `data/heatmap.html`

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
