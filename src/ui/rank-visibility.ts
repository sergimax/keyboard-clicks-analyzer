/** Which optional sections appear in ranking / Copy blocks. Top keys are always shown. */

export type RankVisibility = {
  topPairs: boolean;
  selfRepeats: boolean;
  modifierPairs: boolean;
};

const KEY_PAIRS = "kca-rank-pairs";
const KEY_SELF = "kca-rank-self";
const KEY_MODS = "kca-rank-mods";

function readFlag(key: string, defaultValue: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return raw === "1";
  } catch {
    return defaultValue;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}

/** Defaults: only most-popular keys; pairs / self-repeats / mods hidden. */
export function readRankVisibility(): RankVisibility {
  return {
    topPairs: readFlag(KEY_PAIRS, false),
    selfRepeats: readFlag(KEY_SELF, false),
    modifierPairs: readFlag(KEY_MODS, false),
  };
}

export function writeRankVisibility(visibility: RankVisibility): void {
  writeFlag(KEY_PAIRS, visibility.topPairs);
  writeFlag(KEY_SELF, visibility.selfRepeats);
  writeFlag(KEY_MODS, visibility.modifierPairs);
}
