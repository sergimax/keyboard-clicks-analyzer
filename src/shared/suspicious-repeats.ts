import { canonicalKey, lookupKey } from "../keymap.ts";
import type { SuspiciousRepeatCount } from "./types.ts";

/** Same-key gap thresholds for bounce / double-register detection (ms). */
export const SUSPICIOUS_UNDER_30_MS = 30;
export const SUSPICIOUS_UNDER_50_MS = 50;

export type SuspiciousRepeatItem = {
  id: string;
  label: string;
  under30ms: number;
  under50ms: number;
};

/** In-session last physical press time per canonical key id (not persisted). */
export type SuspiciousRepeatTracker = Map<string, number>;

export function emptySuspiciousRepeats(): Record<string, SuspiciousRepeatCount> {
  return {};
}

export function emptySuspiciousRepeatTracker(): SuspiciousRepeatTracker {
  return new Map();
}

function asCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

/** Merge aliases; drop empty rows; under50ms is inclusive of under30ms gaps. */
export function normalizeSuspiciousRepeats(
  raw: unknown,
): Record<string, SuspiciousRepeatCount> {
  if (!raw || typeof raw !== "object") return emptySuspiciousRepeats();
  const merged: Record<string, SuspiciousRepeatCount> = {};
  for (const [rawId, entry] of Object.entries(
    raw as Record<string, SuspiciousRepeatCount>,
  )) {
    const under30ms = asCount(entry?.under30ms);
    const under50ms = asCount(entry?.under50ms);
    if (under30ms <= 0 && under50ms <= 0) continue;
    const parts = rawId.split(":").map(Number);
    const sc = entry?.sc ?? parts[0];
    const ext = entry?.ext ?? parts[1];
    if (!Number.isFinite(sc) || !Number.isFinite(ext)) continue;
    const canon = canonicalKey(sc!, ext!);
    const existing = merged[canon.id];
    if (existing) {
      existing.under30ms += under30ms;
      existing.under50ms += under50ms;
    } else {
      merged[canon.id] = {
        sc: canon.sc,
        ext: canon.ext,
        under30ms,
        under50ms: Math.max(under50ms, under30ms),
      };
    }
  }
  return merged;
}

/**
 * If the same physical key is pressed again within the thresholds, bump counters.
 * `under50ms` includes gaps that are also under 30ms.
 */
export function noteSuspiciousRepeat(
  map: Record<string, SuspiciousRepeatCount>,
  tracker: SuspiciousRepeatTracker,
  sc: number,
  ext: number,
  atMs: number,
): void {
  const canon = canonicalKey(sc, ext);
  const previousAt = tracker.get(canon.id);
  tracker.set(canon.id, atMs);
  if (previousAt === undefined) return;
  const delta = atMs - previousAt;
  if (delta < 0 || delta >= SUSPICIOUS_UNDER_50_MS) return;

  const existing = map[canon.id];
  if (existing) {
    if (delta < SUSPICIOUS_UNDER_30_MS) existing.under30ms += 1;
    existing.under50ms += 1;
    return;
  }
  map[canon.id] = {
    sc: canon.sc,
    ext: canon.ext,
    under30ms: delta < SUSPICIOUS_UNDER_30_MS ? 1 : 0,
    under50ms: 1,
  };
}

/** Rank keys with any suspicious same-key gaps (worst under30 first). */
export function topSuspiciousRepeats(
  map: Record<string, SuspiciousRepeatCount> | undefined,
  limit = 20,
): SuspiciousRepeatItem[] {
  const items: SuspiciousRepeatItem[] = [];
  for (const [id, entry] of Object.entries(map ?? {})) {
    if (!entry) continue;
    const under30ms = asCount(entry.under30ms);
    const under50ms = asCount(entry.under50ms);
    if (under30ms <= 0 && under50ms <= 0) continue;
    const meta = lookupKey(entry.sc, entry.ext);
    items.push({
      id,
      label: meta.label,
      under30ms,
      under50ms,
    });
  }
  return items
    .sort(
      (left, right) =>
        right.under30ms - left.under30ms ||
        right.under50ms - left.under50ms ||
        left.label.localeCompare(right.label),
    )
    .slice(0, limit);
}
