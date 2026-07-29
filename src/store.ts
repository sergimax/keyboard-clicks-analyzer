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

export type StatsFile = {
  version: 1;
  updatedAt: string;
  totalPresses: number;
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
    keys: {},
  };
}

export function ensureDataDir(): void {
  fs.mkdirSync(dataDir, { recursive: true });
}

/** Merge alias variants (e.g. 54:0 into 54:1) so old sessions display correctly. */
export function normalizeStats(stats: StatsFile): StatsFile {
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
