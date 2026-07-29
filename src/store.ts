import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  return `${sc}:${ext}`;
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
  return parsed;
}

export function saveStats(stats: StatsFile): void {
  ensureDataDir();
  stats.updatedAt = new Date().toISOString();
  stats.totalPresses = Object.values(stats.keys).reduce((sum, k) => sum + k.count, 0);
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
  const id = keyId(sc, ext);
  const existing = stats.keys[id];
  if (existing) {
    existing.count += 1;
  } else {
    stats.keys[id] = { sc, ext, count: 1 };
  }
}
