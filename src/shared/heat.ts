import { allMappedKeys, canonicalKey, lookupKey } from "../keymap.ts";
import type { KeyCount, StatsFile } from "./types.ts";

/** How heatmap intensity / key captions are scaled. */
export type HeatScaleMode = "absolute" | "relative";

export type HeatKey = {
  id: string;
  label: string;
  row: number;
  col: number;
  span: number;
  count: number;
  /** OS auto-repeat while held (not used for heat intensity). */
  repeatCount: number;
  /** Fraction of total physical presses (0–1). */
  share: number;
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

/**
 * Rank-based intensity among keys with count > 0 (ties share avg rank).
 * Spreads heat across the board so a dominant key (e.g. Space) does not
 * crush mid-tier keys the way absolute max-scaling does.
 */
export function percentileIntensities(
  counts: Iterable<[string, number]>,
): Map<string, number> {
  const positive = [...counts].filter(([, count]) => count > 0);
  const result = new Map<string, number>();
  if (positive.length === 0) return result;
  if (positive.length === 1) {
    const only = positive[0];
    if (only) result.set(only[0], 1);
    return result;
  }

  positive.sort((left, right) => left[1]! - right[1]!);
  let index = 0;
  while (index < positive.length) {
    let end = index + 1;
    while (
      end < positive.length &&
      positive[end]![1] === positive[index]![1]
    ) {
      end += 1;
    }
    const avgRank = (index + end - 1) / 2;
    const intensity = avgRank / (positive.length - 1);
    for (let at = index; at < end; at += 1) {
      result.set(positive[at]![0], intensity);
    }
    index = end;
  }
  return result;
}

function heatRgb(intensity: number): [number, number, number] {
  // Idle keys use theme CSS (--key-bg); this dark idle is only a fallback
  // for colorFor(0) / callers that still request a zero-intensity fill.
  if (intensity <= 0) return [37, 43, 54];
  // Fixed domain gradient: teal → amber → rust — never theme-branded.
  const cold = [28, 96, 82];
  const mid = [214, 132, 64];
  const hot = [176, 58, 8];
  const t = Math.min(1, Math.max(0, intensity));
  const from = t < 0.5 ? cold : mid;
  const to = t < 0.5 ? mid : hot;
  const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  return [
    Math.round(from[0]! + (to[0]! - from[0]!) * u),
    Math.round(from[1]! + (to[1]! - from[1]!) * u),
    Math.round(from[2]! + (to[2]! - from[2]!) * u),
  ];
}

/** Relative luminance 0–1 (sRGB). */
function relativeLuminance(rgb: [number, number, number]): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

function contrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function colorFor(intensity: number): string {
  const [r, g, b] = heatRgb(intensity);
  return `rgb(${r},${g},${b})`;
}

export type HeatKeyStyle = {
  background: string;
  borderColor: string;
  labelColor: string;
  countColor: string;
  textShadow: string;
};

const LIGHT_LABEL: [number, number, number] = [248, 250, 252];
const DARK_LABEL: [number, number, number] = [18, 14, 10];
const LIGHT_COUNT: [number, number, number] = [220, 226, 235];
const DARK_COUNT: [number, number, number] = [48, 36, 28];

function rgbCss(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

/** Background + readable label/count colors. */
export function heatKeyStyle(intensity: number): HeatKeyStyle {
  const rgb = heatRgb(intensity);
  const bgLum = relativeLuminance(rgb);
  // Warm oranges/peaches (high R) always need dark ink — luminance alone
  // mis-classifies some mid oranges as "dark enough" for white text.
  const isWarm = rgb[0] >= 100 && rgb[0] >= rgb[2] + 24;
  const lightContrast = contrastRatio(bgLum, relativeLuminance(LIGHT_LABEL));
  const darkContrast = contrastRatio(bgLum, relativeLuminance(DARK_LABEL));
  const useDarkInk =
    intensity > 0 &&
    (isWarm || bgLum >= 0.18 || darkContrast > lightContrast || intensity >= 0.22);

  return {
    background: rgbCss(rgb),
    borderColor: useDarkInk ? "#4a3424" : intensity > 0 ? "#2a4038" : "#8a8a8a",
    labelColor: rgbCss(useDarkInk ? DARK_LABEL : LIGHT_LABEL),
    countColor: rgbCss(useDarkInk ? DARK_COUNT : LIGHT_COUNT),
    textShadow: useDarkInk
      ? "0 0 0 transparent"
      : "0 0 2px rgba(0,0,0,0.85), 0 1px 1px rgba(0,0,0,0.7)",
  };
}

export function buildHeatKeys(
  stats: StatsFile,
  mode: HeatScaleMode = "absolute",
): HeatKey[] {
  const counts = new Map<string, number>();
  const repeats = new Map<string, number>();
  for (const entry of Object.values(stats.keys ?? {})) {
    const { id } = canonicalKey(entry.sc, entry.ext);
    counts.set(id, (counts.get(id) ?? 0) + entry.count);
    const repeatCount =
      typeof entry.repeatCount === "number" && Number.isFinite(entry.repeatCount)
        ? Math.max(0, entry.repeatCount)
        : 0;
    repeats.set(id, (repeats.get(id) ?? 0) + repeatCount);
  }

  const max = Math.max(0, ...counts.values(), 0);
  const totalPresses = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const relativeIntensity =
    mode === "relative" ? percentileIntensities(counts) : null;
  const known = new Set(allMappedKeys().map((k) => k.id));

  const toHeatKey = (
    id: string,
    meta: { label: string; row: number; col: number; span?: number },
    count: number,
  ): HeatKey => ({
    id,
    label: meta.label,
    row: meta.row,
    col: meta.col,
    span: meta.span ?? 1,
    count,
    repeatCount: repeats.get(id) ?? 0,
    share: pressShare(count, totalPresses),
    intensity:
      mode === "relative"
        ? (relativeIntensity?.get(id) ?? 0)
        : intensityFor(count, max),
  });

  const keys: HeatKey[] = allMappedKeys().map(({ id, meta }) =>
    toHeatKey(id, meta, counts.get(id) ?? 0),
  );

  for (const [id, count] of counts) {
    if (known.has(id)) continue;
    const [sc, ext] = id.split(":").map(Number);
    const meta = lookupKey(sc!, ext!);
    keys.push(toHeatKey(id, meta, count));
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

/** Hottest physical key by press count (label for display). */
export function hottestKey(stats: StatsFile): RankItem | null {
  const top = topKeys(stats, 1)[0];
  return top && top.count > 0 ? top : null;
}

export function hottestCount(stats: StatsFile): number {
  return hottestKey(stats)?.count ?? 0;
}
