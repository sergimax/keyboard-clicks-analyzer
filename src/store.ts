import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalKey } from "./keymap.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const dataDir = path.join(rootDir, "data");
export const statsPath = path.join(dataDir, "stats.json");
export const heatmapPath = path.join(dataDir, "heatmap.html");
export const templatePath = path.join(rootDir, "templates", "heatmap.html");
export const collectorBin = path.join(
  rootDir,
  "collector",
  "target",
  "release",
  process.platform === "win32" ? "collector.exe" : "collector",
);

export type KeyCount = {
  sc: number;
  ext: number;
  count: number;
};

/** One completed collect start→stop interval. */
export type RecordingSession = {
  startedAt: string;
  endedAt: string;
  durationMs: number;
};

/** Per local calendar day key counts (YYYY-MM-DD). */
export type DailyBucket = {
  presses: number;
  keys: Record<string, KeyCount>;
};

export type StatsFile = {
  version: 1;
  updatedAt: string;
  totalPresses: number;
  /** Sum of completed session durations (ms). Current running session is not included until stop. */
  recordingMs: number;
  sessions: RecordingSession[];
  keys: Record<string, KeyCount>;
  /** Local-day buckets for day/week rankings. Older days may be pruned. */
  daily: Record<string, DailyBucket>;
};

/** How many local calendar days of `daily` to retain. */
export const DAILY_RETENTION_DAYS = 60;

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

/** Local calendar date key YYYY-MM-DD. */
export function localDateKey(atMs: number = Date.now()): string {
  const date = new Date(atMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Start of local calendar day (ms) for a YYYY-MM-DD key. */
export function localDayStartMs(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year!, month! - 1, day!, 0, 0, 0, 0).getTime();
}

/** Inclusive rolling window of local date keys ending at `endKey` (default today). */
export function rollingDateKeys(
  dayCount: number,
  endKey: string = localDateKey(),
): string[] {
  const [year, month, day] = endKey.split("-").map(Number);
  const cursor = new Date(year!, month! - 1, day!, 12, 0, 0, 0);
  const keys: string[] = [];
  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() - offset);
    keys.push(localDateKey(date.getTime()));
  }
  return keys;
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
  if (fs.existsSync(heatmapPath)) {
    fs.unlinkSync(heatmapPath);
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

/** Merge key maps from the given local date keys. */
export function keysForDateKeys(
  stats: StatsFile,
  dateKeys: string[],
): Record<string, KeyCount> {
  ensureDailyField(stats);
  const merged: Record<string, KeyCount> = {};
  for (const dateKey of dateKeys) {
    const bucket = stats.daily[dateKey];
    if (!bucket) continue;
    for (const entry of Object.values(bucket.keys)) {
      const canon = canonicalKey(entry.sc, entry.ext);
      const prev = merged[canon.id];
      if (prev) {
        prev.count += entry.count;
      } else {
        merged[canon.id] = { sc: canon.sc, ext: canon.ext, count: entry.count };
      }
    }
  }
  return merged;
}

export function pressesForDateKeys(stats: StatsFile, dateKeys: string[]): number {
  ensureDailyField(stats);
  let total = 0;
  for (const dateKey of dateKeys) {
    total += stats.daily[dateKey]?.presses ?? 0;
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
  ensureTimingFields(stats);
  let total = 0;
  for (const session of stats.sessions) {
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

export function dayRangeMs(dateKey: string = localDateKey()): {
  startMs: number;
  endMs: number;
} {
  const startMs = localDayStartMs(dateKey);
  return { startMs, endMs: startMs + 86_400_000 };
}

export function weekRangeMs(endKey: string = localDateKey()): {
  startMs: number;
  endMs: number;
  dateKeys: string[];
} {
  const dateKeys = rollingDateKeys(7, endKey);
  const startMs = localDayStartMs(dateKeys[0]!);
  const { endMs } = dayRangeMs(endKey);
  return { startMs, endMs, dateKeys };
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

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
