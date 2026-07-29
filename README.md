# Keyboard Clicks Analyzer

**v1.1.0** — local, offline heatmap of **physical** keyboard key presses on Windows. Use it to decide which switches to replace first.

No outbound network calls. No character/text logging — only scan codes, counts, and recording timers under `data/`.

See [CHANGELOG.md](CHANGELOG.md) for history.

## Requirements

- Windows
- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/) (stable) with `cargo` — builds the small collector binary

## Setup

```bash
npm install
npm run build:collector
```

## Usage

```bash
# Capture a session (Ctrl+C to stop). Stats accumulate across sessions.
# Opens a live localhost heatmap (~1s refresh).
npm run collect

# Rebuild static HTML from saved stats
npm run report

# Delete data/stats.json and data/heatmap.html
npm run reset
```

### During `collect`

- Terminal status line: `session mm:ss · presses N` (current run only; resets with **Reset stats**)
- Browser: **http://127.0.0.1:17823/** (loopback only; usually opens automatically)
  - **LIVE** badge, heatmap, top keys
  - **Total recorded** — sum of *completed* start→stop intervals (current session is not included until you stop)
  - **Saved intervals** — count of completed intervals; list under **Recording intervals**
  - **Reset stats** — clears key counts, timers, and intervals (confirm dialog); requires collect still running
  - **Copy top list** — copies the top presses ranking to the clipboard
  - **Show numpad** — toggle numpad visibility (saved in the browser)

After stop (or `npm run report`), open `data/heatmap.html` for a static snapshot. That file has no Reset button — use `npm run reset` in the CLI.

Restart `collect` after pulling code changes so the live UI loads the new build.

### Data file

`data/stats.json` (gitignored) stores:

- `keys` — per physical key counts (`sc` + `ext`)
- `recordingMs` / `sessions` — completed recording intervals
- `totalPresses`, `updatedAt`

## What is counted

- Physical keys via Windows low-level hook (`WH_KEYBOARD_LL`)
- Aggregation key: scan code + extended flag (layout-independent: `Q` and `Й` are the same key)
- Key-up and OS auto-repeat while holding a key are ignored (one count per press)
- Right Shift / Win / Menu variants are normalized when Windows reports inconsistent codes

## Privacy

- Runs only locally
- Live HTTP server binds to `127.0.0.1` only (not reachable from the LAN/internet)
- Writes `data/stats.json` and `data/heatmap.html` (gitignored)
- Does not log typed text, window titles, or keyboard layout

## Notes

- Antivirus may prompt on first run of `collector.exe` (expected for a keyboard hook)
- If a game runs elevated, start the collector with matching privileges so hooks still see input
- Heatmap labels use US QWERTY **positions** for readability; they are not your active layout
- RWin / Menu may still be missed if Windows swallows them before the low-level hook
