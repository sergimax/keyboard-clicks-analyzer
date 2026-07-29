import fs from "node:fs";
import { allMappedKeys, canonicalKey, lookupKey } from "./keymap.ts";
import {
  heatmapPath,
  loadStats,
  saveStats,
  templatePath,
  type StatsFile,
} from "./store.ts";

export type HeatKey = {
  id: string;
  label: string;
  row: number;
  col: number;
  span: number;
  count: number;
  intensity: number;
};

export type RenderOptions = {
  live?: boolean;
  /** Body fragment only (for live polling). */
  partial?: boolean;
};

function intensityFor(count: number, max: number): number {
  if (max <= 0 || count <= 0) return 0;
  return Math.sqrt(count / max);
}

function colorFor(intensity: number): string {
  if (intensity <= 0) return "#252b36";
  const cold = [31, 111, 91];
  const mid = [244, 162, 97];
  const hot = [232, 93, 4];
  const t = Math.min(1, Math.max(0, intensity));
  const from = t < 0.5 ? cold : mid;
  const to = t < 0.5 ? mid : hot;
  const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const rgb = from.map((c, i) => Math.round(c + (to[i]! - c) * u));
  return `rgb(${rgb.join(",")})`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildHeatKeys(stats: StatsFile): HeatKey[] {
  const counts = new Map<string, number>();
  for (const entry of Object.values(stats.keys)) {
    const { id } = canonicalKey(entry.sc, entry.ext);
    counts.set(id, (counts.get(id) ?? 0) + entry.count);
  }

  const max = Math.max(0, ...counts.values(), 0);
  const known = new Set(allMappedKeys().map((k) => k.id));

  const keys: HeatKey[] = allMappedKeys().map(({ id, meta }) => {
    const count = counts.get(id) ?? 0;
    return {
      id,
      label: meta.label,
      row: meta.row,
      col: meta.col,
      span: meta.span ?? 1,
      count,
      intensity: intensityFor(count, max),
    };
  });

  for (const [id, count] of counts) {
    if (known.has(id)) continue;
    const [sc, ext] = id.split(":").map(Number);
    const meta = lookupKey(sc!, ext!);
    keys.push({
      id,
      label: meta.label,
      row: 0,
      col: 0,
      span: 1,
      count,
      intensity: intensityFor(count, max),
    });
  }

  return keys;
}

export function topKeys(
  stats: StatsFile,
  limit = 20,
): Array<{ id: string; label: string; count: number }> {
  const merged = new Map<string, { id: string; label: string; count: number }>();
  for (const k of Object.values(stats.keys)) {
    const canon = canonicalKey(k.sc, k.ext);
    const meta = lookupKey(canon.sc, canon.ext);
    const prev = merged.get(canon.id);
    if (prev) {
      prev.count += k.count;
    } else {
      merged.set(canon.id, { id: canon.id, label: meta.label, count: k.count });
    }
  }
  return [...merged.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

function renderMeta(
  updatedAt: string,
  totalPresses: number,
  maxCount: number,
  live: boolean,
): string {
  const liveBadge = live
    ? `<span class="live-badge">LIVE</span>`
    : "";
  return [
    liveBadge,
    `<span>Updated: <strong>${escapeHtml(updatedAt || "—")}</strong></span>`,
    `<span>Total presses: <strong>${totalPresses}</strong></span>`,
    `<span>Hottest key: <strong>${maxCount}</strong></span>`,
  ].join("");
}

function renderBoard(keys: HeatKey[]): string {
  return keys
    .map((key) => {
      const bg = colorFor(key.intensity);
      const border = key.intensity > 0.55 ? "#5a4030" : "#343c4a";
      const count = key.count > 0 ? String(key.count) : "";
      const title = escapeHtml(`${key.label} (${key.id}): ${key.count}`);
      return [
        `<div class="key" title="${title}" style="grid-row:${key.row};grid-column:${key.col} / span ${key.span};background:${bg};border-color:${border}">`,
        `<span class="lbl">${escapeHtml(key.label)}</span>`,
        `<span class="cnt">${escapeHtml(count)}</span>`,
        `</div>`,
      ].join("");
    })
    .join("");
}

function renderTop(top: Array<{ label: string; count: number }>): string {
  if (top.length === 0) {
    return `<li>No data yet. Run npm run collect.</li>`;
  }
  return top
    .map((item) => `<li>${escapeHtml(item.label)} — ${item.count}</li>`)
    .join("");
}

function renderUnmapped(unmapped: HeatKey[]): string {
  if (unmapped.length === 0) return "";
  const items = [...unmapped]
    .sort((a, b) => b.count - a.count)
    .map((item) => `<li>${escapeHtml(item.label)} — ${item.count}</li>`)
    .join("");
  return `<div><h2 style="margin-top:18px">Unmapped codes</h2><ol>${items}</ol></div>`;
}

function renderBodyInner(stats: StatsFile, live: boolean): string {
  const heatKeys = buildHeatKeys(stats);
  const top = topKeys(stats);
  const max = Math.max(0, ...Object.values(stats.keys).map((k) => k.count), 0);
  const mapped = heatKeys.filter((k) => k.row > 0);
  const unmapped = heatKeys.filter((k) => k.row === 0 && k.count > 0);
  const note = live
    ? "Live view updates about once per second from the local collector (127.0.0.1 only)."
    : "Intensity uses a square-root scale so secondary keys remain readable. Auto-repeat while holding a key is ignored (one count per press).";

  return [
    `<div class="meta">${renderMeta(stats.updatedAt, stats.totalPresses, max, live)}</div>`,
    `<div class="layout">`,
    `<div>`,
    `<div class="board-wrap"><div class="board">${renderBoard(mapped)}</div></div>`,
    `<div class="legend"><span>cold</span><div class="swatch"></div><span>hot</span></div>`,
    `<p class="note">${note}</p>`,
    `</div>`,
    `<aside class="side">`,
    `<h2>Replace first (top presses)</h2>`,
    `<ol>${renderTop(top)}</ol>`,
    renderUnmapped(unmapped),
    `</aside>`,
    `</div>`,
  ].join("");
}

export function renderHeatmapHtml(stats: StatsFile, options: RenderOptions = {}): string {
  const live = options.live === true;
  const partial = options.partial === true;
  const inner = renderBodyInner(stats, live);

  if (partial) {
    return inner;
  }

  const template = fs.readFileSync(templatePath, "utf8");
  return template
    .replace("__LIVE_HEAD__", live ? liveHeadSnippet() : "")
    .replace("__BODY__", inner);
}

function liveHeadSnippet(): string {
  return `
    <script>
      (function () {
        async function tick() {
          try {
            const res = await fetch("/partial?t=" + Date.now(), { cache: "no-store" });
            if (!res.ok) return;
            const html = await res.text();
            const root = document.getElementById("live-root");
            if (root) root.innerHTML = html;
          } catch (_) {}
        }
        setInterval(tick, 1000);
      })();
    </script>
  `;
}

export function generateHeatmap(stats?: StatsFile): string {
  const data = stats ?? loadStats();
  saveStats(data);
  const html = renderHeatmapHtml(data, { live: false });
  fs.writeFileSync(heatmapPath, html, "utf8");
  return heatmapPath;
}
