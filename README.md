# Keyboard Clicks Analyzer

Local, offline heatmap of **physical** keyboard key presses on Windows. Use it to decide which switches to replace first.

No network access. No character/text logging — only scan codes and counts on disk under `data/`.

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

# Wipe local stats and heatmap
npm run reset
```

During `collect`, open **http://127.0.0.1:17823/** (bound to localhost only; no external network). The page shows a **LIVE** badge and refreshes as you type.

After the session (or `report`), you can also open `data/heatmap.html` as a static snapshot.

## What is counted

- Physical keys via Windows low-level hook (`WH_KEYBOARD_LL`)
- Aggregation key: scan code + extended flag (layout-independent: `Q` and `Й` are the same key)
- Key-up and OS auto-repeat while holding a key are ignored (one count per press)

## Privacy

- Runs only locally
- Live view listens on `127.0.0.1` only (not reachable from the network)
- Writes `data/stats.json` and `data/heatmap.html` (gitignored)
- Does not log typed text, window titles, or layout

## Notes

- Antivirus may prompt on first run of `collector.exe` (expected for a keyboard hook)
- If a game runs elevated, start the collector with matching privileges so hooks still see input
- Heatmap labels use US QWERTY **positions** for readability; they are not your active layout
