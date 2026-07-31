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

/**
 * Same-key physical presses closer than bounce thresholds (not OS auto-repeat).
 * Sparse: only keys with at least one hit. `under50ms` includes `under30ms` gaps.
 */
export type SuspiciousRepeatCount = {
  sc: number;
  ext: number;
  under30ms: number;
  under50ms: number;
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

/** Held-modifier + key combo (true chord; not sequential LCtrl→C bigram). */
export type ModifierPairCount = {
  modSc: number;
  modExt: number;
  keySc: number;
  keyExt: number;
  count: number;
};

/** Per local calendar day key counts (YYYY-MM-DD). */
export type DailyBucket = {
  presses: number;
  keys: Record<string, KeyCount>;
  /** Consecutive physical-key transitions for this local day. */
  transitions: Record<string, TransitionCount>;
  /** Modifier chords for this local day. */
  modifierPairs: Record<string, ModifierPairCount>;
};

export type StatsFile = {
  version: 1;
  updatedAt: string;
  totalPresses: number;
  /** Sum of completed session durations (ms). Current running session is not included until stop. */
  recordingMs: number;
  sessions: RecordingSession[];
  keys: Record<string, KeyCount>;
  /** All-time consecutive key-down transitions (`fromId>toId`). Full map; UI derives topPairs / selfRepeats. */
  transitions: Record<string, TransitionCount>;
  /** All-time held-modifier + key chords (`modId+keyId`). */
  modifierPairs: Record<string, ModifierPairCount>;
  /**
   * Press-run aggregates (physical first-downs only; new burst after >1s idle).
   * Derived: avgBurstLength = totalPresses / bursts.count; bursts/hour vs recordingMs.
   */
  bursts: BurstStats;
  /**
   * Sparse same-key double-taps under 30ms / 50ms (bounce, double register, dying switches).
   * Full interval histograms are not stored.
   */
  suspiciousRepeats: Record<string, SuspiciousRepeatCount>;
  /** Local-day buckets for day/week rankings. Older days may be pruned. */
  daily: Record<string, DailyBucket>;
};

/** How many local calendar days of `daily` to retain. */
export const DAILY_RETENTION_DAYS = 60;
