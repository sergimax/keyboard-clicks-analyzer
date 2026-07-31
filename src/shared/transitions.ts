import { canonicalKey, lookupKey } from "../keymap.ts";
import type { StatsFile, TransitionCount } from "./types.ts";

export const TRANSITION_TOP_LIMIT = 30;

export type SelfRepeatItem = {
  id: string;
  label: string;
  count: number;
};

export type TransitionItem = {
  fromId: string;
  toId: string;
  from: string;
  to: string;
  count: number;
};

export function transitionKey(fromId: string, toId: string): string {
  return `${fromId}>${toId}`;
}

export function normalizeTransitionMap(
  raw: Record<string, TransitionCount> | undefined,
): Record<string, TransitionCount> {
  const out: Record<string, TransitionCount> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const entry of Object.values(raw)) {
    if (!entry || typeof entry.count !== "number" || entry.count <= 0) continue;
    const from = canonicalKey(entry.fromSc, entry.fromExt);
    const to = canonicalKey(entry.toSc, entry.toExt);
    const id = transitionKey(from.id, to.id);
    const existing = out[id];
    if (existing) {
      existing.count += entry.count;
    } else {
      out[id] = {
        fromSc: from.sc,
        fromExt: from.ext,
        toSc: to.sc,
        toExt: to.ext,
        count: entry.count,
      };
    }
  }
  return out;
}

export function bumpTransitionInMap(
  map: Record<string, TransitionCount>,
  fromSc: number,
  fromExt: number,
  toSc: number,
  toExt: number,
): void {
  const from = canonicalKey(fromSc, fromExt);
  const to = canonicalKey(toSc, toExt);
  const id = transitionKey(from.id, to.id);
  const existing = map[id];
  if (existing) {
    existing.count += 1;
  } else {
    map[id] = {
      fromSc: from.sc,
      fromExt: from.ext,
      toSc: to.sc,
      toExt: to.ext,
      count: 1,
    };
  }
}

export function transitionsForDateKeys(
  stats: StatsFile,
  dateKeys: string[],
): Record<string, TransitionCount> {
  const merged: Record<string, TransitionCount> = {};
  const daily = stats.daily ?? {};
  for (const dateKey of dateKeys) {
    const bucket = daily[dateKey];
    if (!bucket?.transitions) continue;
    for (const entry of Object.values(bucket.transitions)) {
      const from = canonicalKey(entry.fromSc, entry.fromExt);
      const to = canonicalKey(entry.toSc, entry.toExt);
      const id = transitionKey(from.id, to.id);
      const prev = merged[id];
      if (prev) {
        prev.count += entry.count;
      } else {
        merged[id] = {
          fromSc: from.sc,
          fromExt: from.ext,
          toSc: to.sc,
          toExt: to.ext,
          count: entry.count,
        };
      }
    }
  }
  return merged;
}

function toTransitionItem(entry: TransitionCount): TransitionItem {
  const from = canonicalKey(entry.fromSc, entry.fromExt);
  const to = canonicalKey(entry.toSc, entry.toExt);
  return {
    fromId: from.id,
    toId: to.id,
    from: lookupKey(from.sc, from.ext).label,
    to: lookupKey(to.sc, to.ext).label,
    count: entry.count,
  };
}

/** Top A→B pairs including self-repeats (legacy helper). */
export function topTransitions(
  map: Record<string, TransitionCount> | undefined,
  limit: number = TRANSITION_TOP_LIMIT,
): TransitionItem[] {
  if (!map) return [];
  return Object.values(map)
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(toTransitionItem);
}

/** Top bigrams with from ≠ to (navigation/hotkey/typing character). */
export function topPairs(
  map: Record<string, TransitionCount> | undefined,
  limit: number = TRANSITION_TOP_LIMIT,
): TransitionItem[] {
  if (!map) return [];
  return Object.values(map)
    .filter((entry) => {
      if (entry.count <= 0) return false;
      const from = canonicalKey(entry.fromSc, entry.fromExt);
      const to = canonicalKey(entry.toSc, entry.toExt);
      return from.id !== to.id;
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(toTransitionItem);
}

/** Same-key consecutive first-downs (Left→Left, Bksp→Bksp) — not chords. */
export function selfRepeats(
  map: Record<string, TransitionCount> | undefined,
  limit: number = TRANSITION_TOP_LIMIT,
): SelfRepeatItem[] {
  if (!map) return [];
  return Object.values(map)
    .filter((entry) => {
      if (entry.count <= 0) return false;
      const from = canonicalKey(entry.fromSc, entry.fromExt);
      const to = canonicalKey(entry.toSc, entry.toExt);
      return from.id === to.id;
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => {
      const key = canonicalKey(entry.fromSc, entry.fromExt);
      return {
        id: key.id,
        label: lookupKey(key.sc, key.ext).label,
        count: entry.count,
      };
    });
}
