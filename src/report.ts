import fs from "node:fs";
import { allMappedKeys, lookupKey } from "./keymap.ts";
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
  for (const [id, entry] of Object.entries(stats.keys)) {
    counts.set(id, entry.count);
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

  for (const [id, entry] of Object.entries(stats.keys)) {
    if (known.has(id)) continue;
    const meta = lookupKey(entry.sc, entry.ext);
    keys.push({
      id,
      label: meta.label,
      row: 0,
      col: 0,
      span: 1,
      count: entry.count,
      intensity: intensityFor(entry.count, max),
    });
  }

  return keys;
}

export function topKeys(
  stats: StatsFile,
  limit = 20,
): Array<{ id: string; label: string; count: number }> {
  return Object.values(stats.keys)
    .map((k) => {
      const meta = lookupKey(k.sc, k.ext);
      return { id: `${k.sc}:${k.ext}`, label: meta.label, count: k.count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function renderMeta(updatedAt: string, totalPresses: number, maxCount: number): string {
  return [
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

export function generateHeatmap(stats?: StatsFile): string {
  const data = stats ?? loadStats();
  saveStats(data);

  const template = fs.readFileSync(templatePath, "utf8");
  const heatKeys = buildHeatKeys(data);
  const top = topKeys(data);
  const max = Math.max(0, ...Object.values(data.keys).map((k) => k.count), 0);
  const mapped = heatKeys.filter((k) => k.row > 0);
  const unmapped = heatKeys.filter((k) => k.row === 0 && k.count > 0);

  const html = template
    .replace("__META__", renderMeta(data.updatedAt, data.totalPresses, max))
    .replace("__BOARD__", renderBoard(mapped))
    .replace("__TOP__", renderTop(top))
    .replace("__UNMAPPED__", renderUnmapped(unmapped));

  fs.writeFileSync(heatmapPath, html, "utf8");
  return heatmapPath;
}
