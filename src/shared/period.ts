import { canonicalKey } from "../keymap.ts";
import type { KeyCount, StatsFile } from "./types.ts";

export function keysForDateKeys(
  stats: StatsFile,
  dateKeys: string[],
): Record<string, KeyCount> {
  const daily = stats.daily ?? {};
  const merged: Record<string, KeyCount> = {};
  for (const dateKey of dateKeys) {
    const bucket = daily[dateKey];
    if (!bucket) continue;
    for (const entry of Object.values(bucket.keys)) {
      const canon = canonicalKey(entry.sc, entry.ext);
      const repeatCount =
        typeof entry.repeatCount === "number" && Number.isFinite(entry.repeatCount)
          ? Math.max(0, entry.repeatCount)
          : 0;
      const prev = merged[canon.id];
      if (prev) {
        prev.count += entry.count;
        prev.repeatCount += repeatCount;
      } else {
        merged[canon.id] = {
          sc: canon.sc,
          ext: canon.ext,
          count: entry.count,
          repeatCount,
        };
      }
    }
  }
  return merged;
}

export function pressesForDateKeys(stats: StatsFile, dateKeys: string[]): number {
  const daily = stats.daily ?? {};
  let total = 0;
  for (const dateKey of dateKeys) {
    total += daily[dateKey]?.presses ?? 0;
  }
  return total;
}

/**
 * Completed-session recording time overlapping [rangeStartMs, rangeEndMs).
 * Current live session is not included until finalize.
 */
export function recordingMsInRange(
  stats: StatsFile,
  rangeStartMs: number,
  rangeEndMs: number,
): number {
  const sessions = stats.sessions ?? [];
  let total = 0;
  for (const session of sessions) {
    const start = Date.parse(session.startedAt);
    const end = Date.parse(session.endedAt);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const overlapStart = Math.max(start, rangeStartMs);
    const overlapEnd = Math.min(end, rangeEndMs);
    if (overlapEnd > overlapStart) {
      total += overlapEnd - overlapStart;
    }
  }
  return total;
}
