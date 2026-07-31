import { canonicalKey, lookupKey } from "../keymap.ts";
import type { ModifierPairCount } from "./types.ts";

/**
 * Bitmask of held modifiers at key-down time (from collector `mods` field).
 * Must stay in sync with `collector/src/main.rs`.
 */
export const MOD_LCTRL = 1 << 0;
export const MOD_RCTRL = 1 << 1;
export const MOD_LSHIFT = 1 << 2;
export const MOD_RSHIFT = 1 << 3;
export const MOD_LALT = 1 << 4;
export const MOD_RALT = 1 << 5;
export const MOD_LWIN = 1 << 6;
export const MOD_RWIN = 1 << 7;

const MODIFIER_BITS: Array<{ bit: number; sc: number; ext: number }> = [
  { bit: MOD_LCTRL, sc: 29, ext: 0 },
  { bit: MOD_RCTRL, sc: 29, ext: 1 },
  { bit: MOD_LSHIFT, sc: 42, ext: 0 },
  { bit: MOD_RSHIFT, sc: 54, ext: 1 },
  { bit: MOD_LALT, sc: 56, ext: 0 },
  { bit: MOD_RALT, sc: 56, ext: 1 },
  { bit: MOD_LWIN, sc: 91, ext: 1 },
  { bit: MOD_RWIN, sc: 92, ext: 1 },
];

export const MODIFIER_PAIR_TOP_LIMIT = 30;

export type ModifierPairItem = {
  id: string;
  modifierId: string;
  keyId: string;
  modifier: string;
  key: string;
  count: number;
};

export function modifierPairKey(modifierId: string, keyId: string): string {
  return `${modifierId}+${keyId}`;
}

export function modifiersFromMask(mask: number): Array<{ sc: number; ext: number }> {
  if (!Number.isFinite(mask) || mask <= 0) return [];
  const mods: Array<{ sc: number; ext: number }> = [];
  for (const entry of MODIFIER_BITS) {
    if (mask & entry.bit) mods.push({ sc: entry.sc, ext: entry.ext });
  }
  return mods;
}

export function normalizeModifierPairMap(
  raw: Record<string, ModifierPairCount> | undefined,
): Record<string, ModifierPairCount> {
  const out: Record<string, ModifierPairCount> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const entry of Object.values(raw)) {
    if (!entry || typeof entry.count !== "number" || entry.count <= 0) continue;
    const modifier = canonicalKey(entry.modSc, entry.modExt);
    const key = canonicalKey(entry.keySc, entry.keyExt);
    const id = modifierPairKey(modifier.id, key.id);
    const existing = out[id];
    if (existing) {
      existing.count += entry.count;
    } else {
      out[id] = {
        modSc: modifier.sc,
        modExt: modifier.ext,
        keySc: key.sc,
        keyExt: key.ext,
        count: entry.count,
      };
    }
  }
  return out;
}

export function bumpModifierPairInMap(
  map: Record<string, ModifierPairCount>,
  modSc: number,
  modExt: number,
  keySc: number,
  keyExt: number,
): void {
  const modifier = canonicalKey(modSc, modExt);
  const key = canonicalKey(keySc, keyExt);
  // Skip mod+mod when the pressed key is that same modifier id.
  if (modifier.id === key.id) return;
  const id = modifierPairKey(modifier.id, key.id);
  const existing = map[id];
  if (existing) {
    existing.count += 1;
    return;
  }
  map[id] = {
    modSc: modifier.sc,
    modExt: modifier.ext,
    keySc: key.sc,
    keyExt: key.ext,
    count: 1,
  };
}

/** For each held modifier bit, bump modifier+key (physical first-down of key). */
export function bumpModifierPairsFromMask(
  map: Record<string, ModifierPairCount>,
  modsMask: number,
  keySc: number,
  keyExt: number,
): void {
  for (const mod of modifiersFromMask(modsMask)) {
    bumpModifierPairInMap(map, mod.sc, mod.ext, keySc, keyExt);
  }
}

export function modifierPairsForDateKeys(
  daily: Record<string, { modifierPairs?: Record<string, ModifierPairCount> }>,
  dateKeys: string[],
): Record<string, ModifierPairCount> {
  const merged: Record<string, ModifierPairCount> = {};
  for (const dateKey of dateKeys) {
    const map = daily[dateKey]?.modifierPairs;
    if (!map) continue;
    for (const entry of Object.values(map)) {
      if (!entry || entry.count <= 0) continue;
      const modifier = canonicalKey(entry.modSc, entry.modExt);
      const key = canonicalKey(entry.keySc, entry.keyExt);
      const id = modifierPairKey(modifier.id, key.id);
      const existing = merged[id];
      if (existing) {
        existing.count += entry.count;
      } else {
        merged[id] = {
          modSc: modifier.sc,
          modExt: modifier.ext,
          keySc: key.sc,
          keyExt: key.ext,
          count: entry.count,
        };
      }
    }
  }
  return merged;
}

export function topModifierPairs(
  map: Record<string, ModifierPairCount> | undefined,
  limit: number = MODIFIER_PAIR_TOP_LIMIT,
): ModifierPairItem[] {
  if (!map) return [];
  return Object.values(map)
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => {
      const modifier = canonicalKey(entry.modSc, entry.modExt);
      const key = canonicalKey(entry.keySc, entry.keyExt);
      return {
        id: modifierPairKey(modifier.id, key.id),
        modifierId: modifier.id,
        keyId: key.id,
        modifier: lookupKey(modifier.sc, modifier.ext).label,
        key: lookupKey(key.sc, key.ext).label,
        count: entry.count,
      };
    });
}
