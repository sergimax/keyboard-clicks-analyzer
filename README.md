# Keyboard Clicks Analyzer
![App version](https://img.shields.io/badge/App_version-2.1.0-purple)

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
  - **Active recording** — sum of *completed* start→stop intervals (current session is not included until you stop)
  - **Saved intervals** — count of completed intervals; list under **Recording intervals**
  - **All time / Today / Last 7 days** — top-30 rankings with presses + recorded time; each has its own **Copy** button
  - **Reset stats** — clears key counts, day buckets, timers, and intervals (confirm dialog); requires collect still running
  - **Show numpad** — toggle numpad visibility (default Off; saved in the browser)
  - **Heatmap Absolute / Relative (%)** — absolute uses sqrt scale vs hottest key; relative shows % captions and rank-based colors (Space won’t wash out mid keys; preference saved in the browser)
  - **Export JSON** — download summary + rankings + stats; includes `meta`, `timing`, `intensity`, top `share`, top-20 `transitions`
  - **Top transitions** — consecutive physical key pairs (e.g. LCtrl→C) per period

`npm run report` serves the same UI from disk stats (no Reset button). There is no standalone `data/heatmap.html` anymore — use the report viewer.

### Data file

`data/stats.json` (gitignored) stores:

- `keys` — per physical key (`sc` + `ext`): `count` (first-downs) and `repeatCount` (OS auto-repeat while held)
- `transitions` — consecutive first-down pairs (`from→to` aggregates; ignores auto-repeat)
- `bursts` — press-run aggregates (`count`, `longest`); a new burst starts after >1s idle (physical presses only)
- `suspiciousRepeats` — sparse same-key double-taps under 30ms / 50ms (`under30ms`, `under50ms`; bounce / double register); full interval lists are not stored
- `daily` — per local calendar day key counts + transitions (for today / last 7 days; older days pruned)
- `recordingMs` / `sessions` — completed recording intervals
- `totalPresses`, `updatedAt` (`totalPresses` = sum of `count` only)

Built UI assets live in `dist/ui/` (gitignored; produced by `npm run build:ui`).

## What is counted

- Physical keys via Windows low-level hook (`WH_KEYBOARD_LL`)
- Aggregation key: scan code + extended flag (layout-independent: `Q` and `Й` are the same key)
- Key-up is ignored; OS auto-repeat while holding increments `repeatCount` (not `count` / heatmap / transitions / bursts)
- Bursts group physical presses separated by >1s idle — UI/export show avg burst length and bursts/hour (activity chunking, not switch wear)
- Suspicious repeats: same physical key again within 30ms / 50ms (OS auto-repeat ignored); side panel lists keys that may bounce or double-register
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
