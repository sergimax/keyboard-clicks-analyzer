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
  // sqrt scale so rare keys stay visible while hot keys dominate.
  return Math.sqrt(count / max);
}

export function buildHeatKeys(stats: StatsFile): HeatKey[] {
  const counts = new Map<string, number>();
  for (const [id, entry] of Object.entries(stats.keys)) {
    counts.set(id, entry.count);
  }

  const max = Math.max(0, ...counts.values());
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

  // Unknown physical keys (not on the drawn layout) still appear in the side list via stats.
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

export function topKeys(stats: StatsFile, limit = 20): Array<{ id: string; label: string; count: number }> {
  return Object.values(stats.keys)
    .map((k) => {
      const meta = lookupKey(k.sc, k.ext);
      return { id: `${k.sc}:${k.ext}`, label: meta.label, count: k.count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function generateHeatmap(stats?: StatsFile): string {
  const data = stats ?? loadStats();
  // Refresh total before report
  saveStats(data);

  const template = fs.readFileSync(templatePath, "utf8");
  const heatKeys = buildHeatKeys(data);
  const top = topKeys(data);
  const max = Math.max(0, ...Object.values(data.keys).map((k) => k.count));

  const payload = {
    updatedAt: data.updatedAt,
    totalPresses: data.totalPresses,
    maxCount: max,
    keys: heatKeys.filter((k) => k.row > 0),
    unmapped: heatKeys.filter((k) => k.row === 0 && k.count > 0),
    top,
  };

  const html = template.replace("__DATA__", JSON.stringify(payload));
  fs.writeFileSync(heatmapPath, html, "utf8");
  return heatmapPath;
}
