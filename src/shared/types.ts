/** Shared stats types (browser-safe, no Node I/O). */

export type KeyCount = {
  sc: number;
  ext: number;
  /** Physical first-downs (one per press; excludes OS auto-repeat). */
  count: number;
  /** OS auto-repeat while the key is held (not counted in `count` / totalPresses). */
  repeatCount: number;
};

/**
 * Press-run aggregates (physical first-downs only).
 * A new burst starts after >1s idle; avg length and bursts/hour are derived.
 */
export type BurstStats = {
  count: number;
  longest: number;
};

/** One completed collect start→stop interval. */
export type RecordingSession = {
  startedAt: string;
  endedAt: string;
  durationMs: number;
};

/** Aggregated A→B key-down pairs (first-down only; no auto-repeat). */
export type TransitionCount = {
  fromSc: number;
  fromExt: number;
  toSc: number;
  toExt: number;
  count: number;
};

/** Per local calendar day key counts (YYYY-MM-DD). */
export type DailyBucket = {
  presses: number;
  keys: Record<string, KeyCount>;
  /** Consecutive physical-key transitions for this local day. */
  transitions: Record<string, TransitionCount>;
};

export type StatsFile = {
  version: 1;
  updatedAt: string;
  totalPresses: number;
  /** Sum of completed session durations (ms). Current running session is not included until stop. */
  recordingMs: number;
  sessions: RecordingSession[];
  keys: Record<string, KeyCount>;
  /** All-time consecutive key-down transitions (`fromId>toId`). */
  transitions: Record<string, TransitionCount>;
  /**
   * Press-run aggregates (physical first-downs only; new burst after >1s idle).
   * Derived: avgBurstLength = totalPresses / bursts.count; bursts/hour vs recordingMs.
   */
  bursts: BurstStats;
  /** Local-day buckets for day/week rankings. Older days may be pruned. */
  daily: Record<string, DailyBucket>;
};

/** How many local calendar days of `daily` to retain. */
export const DAILY_RETENTION_DAYS = 60;
