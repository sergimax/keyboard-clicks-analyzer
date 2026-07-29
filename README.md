# Keyboard Clicks Analyzer
![App version](https://img.shields.io/badge/App_version-2.0.0-purple)

Local, offline heatmap of **physical** keyboard key presses on Windows. Use it to decide which switches to replace first.

No outbound network calls. No character/text logging — only scan codes, counts, and recording timers under `data/`.

UI is a **Vite + React** app served on `127.0.0.1` during `collect` / `report`.

See [CHANGELOG.md](CHANGELOG.md) for history.

## Requirements

- Windows
- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rust-lang.org/) (stable) with `cargo` — builds the small collector binary

## Setup

```bash
npm install
npm run build
```

`npm run build` builds the Rust collector and the React UI (`dist/ui`). After pulling UI changes, run `npm run build:ui` (or full `build`) and restart `collect`.

## Usage

```bash
# Capture a session (Ctrl+C to stop). Stats accumulate across sessions.
# Opens a live localhost React heatmap (~1s JSON refresh).
npm run collect

# Open a localhost viewer from saved stats (Ctrl+C to stop)
npm run report

# Delete data/stats.json
npm run reset
```

### During `collect`

- Terminal status line: `session mm:ss · presses N` (current run only; resets with **Reset stats**)
- Browser: **http://127.0.0.1:17823/** (loopback only; usually opens automatically)
  - **LIVE** badge, heatmap, rankings
  - **Total recorded** — sum of *completed* start→stop intervals (current session is not included until you stop)
  - **Saved intervals** — count of completed intervals; list under **Recording intervals**
  - **All time / Today / Last 7 days** — top-30 rankings with presses + recorded time; each has its own **Copy** button
  - **Reset stats** — clears key counts, day buckets, timers, and intervals (confirm dialog); requires collect still running
  - **Show numpad** — toggle numpad visibility (default Off; saved in the browser)
  - **Export JSON** — download summary + period rankings + full stats; `timing`, `intensity.pressesPerMinute`, top items with `share`

`npm run report` serves the same UI from disk stats (no Reset button). There is no standalone `data/heatmap.html` anymore — use the report viewer.

### Data file

`data/stats.json` (gitignored) stores:

- `keys` — per physical key counts (`sc` + `ext`), all time
- `daily` — per local calendar day key counts (for today / last 7 days; older days pruned)
- `recordingMs` / `sessions` — completed recording intervals
- `totalPresses`, `updatedAt`

Built UI assets live in `dist/ui/` (gitignored; produced by `npm run build:ui`).

## What is counted

- Physical keys via Windows low-level hook (`WH_KEYBOARD_LL`)
- Aggregation key: scan code + extended flag (layout-independent: `Q` and `Й` are the same key)
- Key-up and OS auto-repeat while holding a key are ignored (one count per press)
- Right Shift / Win / Menu variants are normalized when Windows reports inconsistent codes

## Privacy

- Runs only locally
- Live HTTP server binds to `127.0.0.1` only (not reachable from the LAN/internet)
- Writes `data/stats.json` (gitignored)
- Does not log typed text, window titles, or keyboard layout

## Notes

- Antivirus may prompt on first run of `collector.exe` (expected for a keyboard hook)
- If a game runs elevated, start the collector with matching privileges so hooks still see input
- Heatmap labels use US QWERTY **positions** for readability; they are not your active layout
- RWin / Menu may still be missed if Windows swallows them before the low-level hook
