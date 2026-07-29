/** Shared stats types (browser-safe, no Node I/O). */

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
