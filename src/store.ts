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

export type StatsFile = {
  version: 1;
  updatedAt: string;
  totalPresses: number;
  /** Sum of completed session durations (ms). Current running session is not included until stop. */
  recordingMs: number;
  sessions: RecordingSession[];
  keys: Record<string, KeyCount>;
};

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

/** Merge alias variants (e.g. 54:0 into 54:1) so old sessions display correctly. */
export function normalizeStats(stats: StatsFile): StatsFile {
  ensureTimingFields(stats);
  const keys: Record<string, KeyCount> = {};
  for (const entry of Object.values(stats.keys)) {
    const canon = canonicalKey(entry.sc, entry.ext);
    const existing = keys[canon.id];
    if (existing) {
      existing.count += entry.count;
    } else {
      keys[canon.id] = { sc: canon.sc, ext: canon.ext, count: entry.count };
    }
  }
  stats.keys = keys;
  stats.totalPresses = Object.values(keys).reduce((sum, k) => sum + k.count, 0);
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

export function bumpKey(stats: StatsFile, sc: number, ext: number): void {
  const canon = canonicalKey(sc, ext);
  const existing = stats.keys[canon.id];
  if (existing) {
    existing.count += 1;
  } else {
    stats.keys[canon.id] = { sc: canon.sc, ext: canon.ext, count: 1 };
  }
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
