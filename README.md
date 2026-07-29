# Keyboard Clicks Analyzer

**v1.1.0** — local, offline heatmap of **physical** keyboard key presses on Windows. Use it to decide which switches to replace first.

No outbound network. No character/text logging — only scan codes and counts under `data/`.

See [CHANGELOG.md](CHANGELOG.md) for release history.

## Requirements

- Windows
- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/) (stable) with `cargo` — for the small collector binary

## Setup

```bash
npm install
npm run build:collector
```

## Usage

```bash
# Capture a session (Ctrl+C to stop). Stats accumulate across sessions.
# Opens a live localhost heatmap that updates about once per second.
npm run collect

# Rebuild static HTML report from saved stats
npm run report

# Wipe local stats and heatmap (CLI)
npm run reset
```

### Live view

During `collect`, the app serves **http://127.0.0.1:17823/** (loopback only):

- **LIVE** badge and ~1s refresh while you type
- **Total recorded** across all start/stop intervals; saved intervals listed in the side panel
- Current **session** time is shown in the collect terminal (`session mm:ss · presses N`), not in the browser
- **Reset stats** — clears key counts, session clock, and all saved intervals (with confirm)
- Top keys list for “replace first”

After the session (or `npm run report`), open `data/heatmap.html` as a static snapshot (no Reset button — use `npm run reset`).

Restart `collect` after pulling code changes so the live page picks up UI updates.

## What is counted

- Physical keys via Windows low-level hook (`WH_KEYBOARD_LL`)
- Aggregation key: scan code + extended flag (layout-independent: `Q` and `Й` are the same key)
- Key-up and OS auto-repeat while holding a key are ignored (one count per press)
- Right Shift / Win / Menu variants are normalized when Windows reports inconsistent codes

## Privacy

- Runs only locally
- Live view listens on `127.0.0.1` only (not reachable from the LAN/internet)
- Writes `data/stats.json` and `data/heatmap.html` (gitignored)
- Does not log typed text, window titles, or layout

## Notes

- Antivirus may prompt on first run of `collector.exe` (expected for a keyboard hook)
- If a game runs elevated, start the collector with matching privileges so hooks still see input
- Heatmap labels use US QWERTY **positions** for readability; they are not your active layout
- RWin / Menu may still be missed if Windows swallows them before the low-level hook
