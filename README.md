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
npm run collect

# Rebuild HTML report from saved stats
npm run report

# Wipe local stats + heatmap
npm run reset
```

After `collect` or `report`, open `data/heatmap.html` in a browser (file://).

## What is counted

- Physical keys via Windows low-level hook (`WH_KEYBOARD_LL`)
- Aggregation key: scan code + extended flag (layout-independent: `Q` and `Й` are the same key)
- Key-up and OS auto-repeat while holding a key are ignored (one count per press)

## Privacy

- Runs only locally
- Writes `data/stats.json` and `data/heatmap.html` (gitignored)
- Does not log typed text, window titles, or layout

## Notes

- Antivirus may prompt on first run of `collector.exe` (expected for a keyboard hook)
- If a game runs elevated, start the collector with matching privileges so hooks still see input
- Heatmap labels use US QWERTY **positions** for readability; they are not your active layout
