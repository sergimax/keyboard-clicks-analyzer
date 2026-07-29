import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalKey } from "./keymap.ts";
import {
  dayRangeMs,
  localDateKey,
  localDayStartMs,
  rollingDateKeys,
  weekRangeMs,
} from "./shared/dates.ts";
import { formatDuration } from "./shared/format.ts";
import {
  keysForDateKeys,
  pressesForDateKeys,
  recordingMsInRange,
} from "./shared/period.ts";
import {
  DAILY_RETENTION_DAYS,
  type DailyBucket,
  type KeyCount,
  type RecordingSession,
  type StatsFile,
} from "./shared/types.ts";

export type { DailyBucket, KeyCount, RecordingSession, StatsFile };
export { DAILY_RETENTION_DAYS };
export {
  dayRangeMs,
  formatDuration,
  keysForDateKeys,
  localDateKey,
  localDayStartMs,
  pressesForDateKeys,
  recordingMsInRange,
  rollingDateKeys,
  weekRangeMs,
};

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const dataDir = path.join(rootDir, "data");
export const statsPath = path.join(dataDir, "stats.json");
export const collectorBin = path.join(
  rootDir,
  "collector",
  "target",
  "release",
  process.platform === "win32" ? "collector.exe" : "collector",
);

export function keyId(sc: number, ext: number): string {
  return canonicalKey(sc, ext).id;
}

export function emptyStats(): StatsFile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    totalPresses: 0,
    recordingMs: 0,
    sessions: [],
    keys: {},
    daily: {},
  };
}

export function ensureDataDir(): void {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function ensureTimingFields(stats: StatsFile): void {
  if (typeof stats.recordingMs !== "number" || !Number.isFinite(stats.recordingMs)) {
    stats.recordingMs = 0;
  }
  if (!Array.isArray(stats.sessions)) {
    stats.sessions = [];
  }
}

export function ensureDailyField(stats: StatsFile): void {
  if (!stats.daily || typeof stats.daily !== "object") {
    stats.daily = {};
  }
}

function normalizeKeyMap(raw: Record<string, KeyCount>): Record<string, KeyCount> {
  const keys: Record<string, KeyCount> = {};
  for (const entry of Object.values(raw)) {
    if (!entry || typeof entry.count !== "number") continue;
    const canon = canonicalKey(entry.sc, entry.ext);
    const existing = keys[canon.id];
    if (existing) {
      existing.count += entry.count;
    } else {
      keys[canon.id] = { sc: canon.sc, ext: canon.ext, count: entry.count };
    }
  }
  return keys;
}

function pruneDaily(stats: StatsFile, retainDays: number = DAILY_RETENTION_DAYS): void {
  ensureDailyField(stats);
  const keep = new Set(rollingDateKeys(retainDays));
  for (const dateKey of Object.keys(stats.daily)) {
    if (!keep.has(dateKey)) {
      delete stats.daily[dateKey];
    }
  }
}

/** Merge alias variants (e.g. 54:0 into 54:1) so old sessions display correctly. */
export function normalizeStats(stats: StatsFile): StatsFile {
  ensureTimingFields(stats);
  ensureDailyField(stats);
  stats.keys = normalizeKeyMap(stats.keys);
  stats.totalPresses = Object.values(stats.keys).reduce((sum, k) => sum + k.count, 0);

  for (const [dateKey, bucket] of Object.entries(stats.daily)) {
    if (!bucket || typeof bucket !== "object") {
      delete stats.daily[dateKey];
      continue;
    }
    bucket.keys = normalizeKeyMap(bucket.keys ?? {});
    bucket.presses = Object.values(bucket.keys).reduce((sum, k) => sum + k.count, 0);
  }
  pruneDaily(stats);
  return stats;
}

export function loadStats(): StatsFile {
  ensureDataDir();
  if (!fs.existsSync(statsPath)) {
    return emptyStats();
  }
  const raw = fs.readFileSync(statsPath, "utf8").replace(/^\uFEFF/, "");
  const parsed = JSON.parse(raw) as StatsFile;
  if (parsed.version !== 1 || typeof parsed.keys !== "object") {
    throw new Error(`Unsupported or corrupt stats file: ${statsPath}`);
  }
  return normalizeStats(parsed);
}

export function saveStats(stats: StatsFile): void {
  ensureDataDir();
  normalizeStats(stats);
  stats.updatedAt = new Date().toISOString();
  fs.writeFileSync(statsPath, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
}

export function resetStats(): void {
  ensureDataDir();
  if (fs.existsSync(statsPath)) {
    fs.unlinkSync(statsPath);
  }
}

function bumpInKeyMap(
  map: Record<string, KeyCount>,
  sc: number,
  ext: number,
): void {
  const canon = canonicalKey(sc, ext);
  const existing = map[canon.id];
  if (existing) {
    existing.count += 1;
  } else {
    map[canon.id] = { sc: canon.sc, ext: canon.ext, count: 1 };
  }
}

export function bumpKey(
  stats: StatsFile,
  sc: number,
  ext: number,
  atMs: number = Date.now(),
): void {
  ensureDailyField(stats);
  bumpInKeyMap(stats.keys, sc, ext);
  const dateKey = localDateKey(atMs);
  const bucket = stats.daily[dateKey] ?? { presses: 0, keys: {} };
  bumpInKeyMap(bucket.keys, sc, ext);
  bucket.presses = Object.values(bucket.keys).reduce((sum, k) => sum + k.count, 0);
  stats.daily[dateKey] = bucket;
}

/** Append a completed recording interval and update total recordingMs. */
export function finalizeRecordingSession(
  stats: StatsFile,
  startedAtMs: number,
  endedAtMs: number = Date.now(),
): void {
  ensureTimingFields(stats);
  const durationMs = Math.max(0, endedAtMs - startedAtMs);
  stats.sessions.push({
    startedAt: new Date(startedAtMs).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
    durationMs,
  });
  stats.recordingMs += durationMs;
}

/** Clear counters and timers in place (keeps the same object reference for the live session). */
export function clearStatsInPlace(stats: StatsFile): void {
  stats.keys = {};
  stats.totalPresses = 0;
  stats.recordingMs = 0;
  stats.sessions = [];
  stats.daily = {};
  stats.updatedAt = new Date().toISOString();
  saveStats(stats);
}
