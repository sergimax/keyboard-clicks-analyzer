# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Recording timers: accumulated **Total recorded** across start/stop intervals and a list of saved intervals (cleared by Reset stats / `npm run reset`)
- Current session duration in the collect terminal (`session mm:ss · presses N`)

### Changed

- Current session clock is console-only (not shown in the live browser UI)
## [1.1.0] - 2026-07-29

### Added

- Reset stats button in the live heatmap UI (`POST /reset` on localhost while `collect` is running)
- Canonical key aliases so alternate Windows scan/extended variants merge onto one heatmap cell

### Fixed

- Map Right Shift as scan code `54:1` (Windows often sets the extended bit); alias `54:0` → `54:1`
- Prefer stable VK-based ids in the collector for RShift / LWin / RWin / Menu when Windows reports them inconsistently
- Render live controls inside the heatmap body so placeholders cannot leak into the browser

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
