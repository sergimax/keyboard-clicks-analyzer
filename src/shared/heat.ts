import { allMappedKeys, canonicalKey, lookupKey } from "../keymap.ts";
import type { KeyCount, StatsFile } from "./types.ts";

export type HeatKey = {
  id: string;
  label: string;
  row: number;
  col: number;
  span: number;
  count: number;
  intensity: number;
};

export type RankItem = { id: string; label: string; count: number };

export type RankItemWithShare = RankItem & {
  /** Fraction of period total presses (0–1), typically 4 decimal places. */
  share: number;
};

export function intensityFor(count: number, max: number): number {
  if (max <= 0 || count <= 0) return 0;
  return Math.sqrt(count / max);
}

export function colorFor(intensity: number): string {
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

export function buildHeatKeys(stats: StatsFile): HeatKey[] {
  const counts = new Map<string, number>();
  for (const entry of Object.values(stats.keys ?? {})) {
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

export function topKeysFromMap(
  keyMap: Record<string, KeyCount>,
  limit = 30,
): RankItem[] {
  const merged = new Map<string, RankItem>();
  for (const entry of Object.values(keyMap)) {
    const canon = canonicalKey(entry.sc, entry.ext);
    const meta = lookupKey(canon.sc, canon.ext);
    const prev = merged.get(canon.id);
    if (prev) {
      prev.count += entry.count;
    } else {
      merged.set(canon.id, { id: canon.id, label: meta.label, count: entry.count });
    }
  }
  return [...merged.values()]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function topKeys(stats: StatsFile, limit = 30): RankItem[] {
  return topKeysFromMap(stats.keys ?? {}, limit);
}

/** Share of `count` within `totalPresses`, rounded to 4 decimal places. */
export function pressShare(count: number, totalPresses: number): number {
  if (totalPresses <= 0 || count <= 0) return 0;
  return Math.round((count / totalPresses) * 10_000) / 10_000;
}

export function withPressShare(
  items: RankItem[],
  totalPresses: number,
): RankItemWithShare[] {
  return items.map((item) => ({
    ...item,
    share: pressShare(item.count, totalPresses),
  }));
}

/** e.g. 0.1172 → "11.7%" */
export function formatSharePercent(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

export function hottestCount(stats: StatsFile): number {
  return Math.max(0, ...Object.values(stats.keys ?? {}).map((k) => k.count), 0);
}
