import type { BurstStats } from "./types.ts";

/** Idle gap that starts a new burst (ms). */
export const BURST_GAP_MS = 1_000;

/** In-session state for gap detection (not persisted). */
export type BurstTracker = {
  lastPressAt: number;
  currentLength: number;
};

export function emptyBursts(): BurstStats {
  return { count: 0, longest: 0 };
}

export function emptyBurstTracker(): BurstTracker {
  return { lastPressAt: 0, currentLength: 0 };
}

export function normalizeBursts(raw: unknown): BurstStats {
  if (!raw || typeof raw !== "object") return emptyBursts();
  const obj = raw as Partial<BurstStats>;
  const count =
    typeof obj.count === "number" && Number.isFinite(obj.count)
      ? Math.max(0, Math.floor(obj.count))
      : 0;
  const longest =
    typeof obj.longest === "number" && Number.isFinite(obj.longest)
      ? Math.max(0, Math.floor(obj.longest))
      : 0;
  return { count, longest };
}

/** Mean physical presses per burst; null when there are no bursts. */
export function avgBurstLength(
  totalPresses: number,
  burstCount: number,
): number | null {
  if (burstCount <= 0) return null;
  return Math.round((Math.max(0, totalPresses) / burstCount) * 10) / 10;
}

/** Bursts per hour of active recording; null when rate is undefined. */
export function burstsPerHour(
  burstCount: number,
  recordingMs: number,
): number | null {
  if (burstCount <= 0 || recordingMs <= 0) return null;
  return Math.round(((burstCount * 3_600_000) / recordingMs) * 10) / 10;
}

/** Record one physical first-down into burst aggregates. */
export function bumpBurst(
  bursts: BurstStats,
  tracker: BurstTracker,
  atMs: number,
): void {
  if (
    tracker.lastPressAt === 0 ||
    atMs - tracker.lastPressAt > BURST_GAP_MS
  ) {
    bursts.count += 1;
    tracker.currentLength = 1;
  } else {
    tracker.currentLength += 1;
  }
  if (tracker.currentLength > bursts.longest) {
    bursts.longest = tracker.currentLength;
  }
  tracker.lastPressAt = atMs;
}
