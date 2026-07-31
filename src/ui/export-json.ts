import type { RankItem, RankItemWithShare } from "@shared/heat";
import {
  hottestCount,
  topKeys,
  topKeysFromMap,
  withPressShare,
} from "@shared/heat";
import { avgBurstLength, burstsPerHour } from "@shared/bursts";
import { dayRangeMs, localDateKey, weekRangeMs } from "@shared/dates";
import {
  keysForDateKeys,
  pressesForDateKeys,
  recordingMsInRange,
} from "@shared/period";
import {
  topTransitions,
  transitionsForDateKeys,
  type TransitionItem,
} from "@shared/transitions";
import type { StatsFile, TransitionCount } from "@shared/types";
import { toExportMeta, type DeviceMeta, type ExportMeta } from "./device-meta";

/**
 * Timing for a ranking window.
 * - activeRecordingMs: completed collect intervals overlapping the window (live session excluded until stop)
 * - periodMs: length of the calendar/window used for this ranking
 * - idleMs: max(0, periodMs - activeRecordingMs) — wall time in the window with no completed collect
 */
export type ExportTiming = {
  activeRecordingMs: number;
  periodMs: number;
  idleMs: number;
};

/** Load metrics derived at export time from presses ÷ active recording. */
export type ExportIntensity = {
  /** null when activeRecordingMs is 0 (rate undefined). */
  pressesPerMinute: number | null;
};

export type ExportTopItem = {
  id: string;
  label: string;
  count: number;
  /** Fraction of this period's totalPresses (0–1). */
  share: number;
};

export type ExportTransition = {
  from: string;
  to: string;
  count: number;
};

export type ExportRanking = {
  label: string;
  dateKey?: string;
  dateFrom?: string;
  dateTo?: string;
  totalPresses: number;
  timing: ExportTiming;
  intensity: ExportIntensity;
  top: ExportTopItem[];
  /** Top consecutive key-down pairs in this period. */
  transitions: ExportTransition[];
};

export type ExportPayload = {
  exportedAt: string;
  live: boolean;
  /** User-supplied context + platform; layouts/model are not OS-detected. */
  meta: ExportMeta;
  summary: {
    totalPresses: number;
    /** Sum of all completed collect intervals (same as stats.recordingMs). */
    activeRecordingMs: number;
    intensity: ExportIntensity;
    hottestKeyCount: number;
    sessionCount: number;
    /** Press runs (idle >1s); rates use activeRecordingMs. */
    bursts: {
      count: number;
      longest: number;
      avgLength: number | null;
      perHour: number | null;
    };
    updatedAt: string;
  };
  rankings: {
    allTime: ExportRanking;
    today: ExportRanking;
    last7Days: ExportRanking;
  };
  stats: StatsFile;
};

function timingFor(activeRecordingMs: number, periodMs: number): ExportTiming {
  const active = Math.max(0, activeRecordingMs);
  const period = Math.max(0, periodMs);
  return {
    activeRecordingMs: active,
    periodMs: period,
    idleMs: Math.max(0, period - active),
  };
}

/**
 * Presses per minute of active recording (completed collect time only).
 * Rounded to 1 decimal; null if there is no active recording time.
 */
export function pressesPerMinute(
  totalPresses: number,
  activeRecordingMs: number,
): number | null {
  if (activeRecordingMs <= 0) return null;
  const rate = (Math.max(0, totalPresses) * 60_000) / activeRecordingMs;
  return Math.round(rate * 10) / 10;
}

function intensityFor(
  totalPresses: number,
  activeRecordingMs: number,
): ExportIntensity {
  return { pressesPerMinute: pressesPerMinute(totalPresses, activeRecordingMs) };
}

function toExportTop(items: RankItemWithShare[]): ExportTopItem[] {
  return items.map(({ id, label, count, share }) => ({ id, label, count, share }));
}

function toExportTransitions(items: TransitionItem[]): ExportTransition[] {
  return items.map(({ from, to, count }) => ({ from, to, count }));
}

function rankingBlock(options: {
  label: string;
  dateKey?: string;
  dateFrom?: string;
  dateTo?: string;
  totalPresses: number;
  activeRecordingMs: number;
  periodMs: number;
  top: RankItem[];
  transitionMap: Record<string, TransitionCount> | undefined;
}): ExportRanking {
  const timing = timingFor(options.activeRecordingMs, options.periodMs);
  return {
    label: options.label,
    dateKey: options.dateKey,
    dateFrom: options.dateFrom,
    dateTo: options.dateTo,
    totalPresses: options.totalPresses,
    timing,
    intensity: intensityFor(options.totalPresses, timing.activeRecordingMs),
    top: toExportTop(withPressShare(options.top, options.totalPresses)),
    transitions: toExportTransitions(topTransitions(options.transitionMap)),
  };
}

/** Wall-clock span from earliest session start to latest session end. */
function allTimePeriodMs(stats: StatsFile): number {
  const sessions = stats.sessions ?? [];
  if (sessions.length === 0) return 0;
  let minStart = Number.POSITIVE_INFINITY;
  let maxEnd = Number.NEGATIVE_INFINITY;
  for (const session of sessions) {
    const start = Date.parse(session.startedAt);
    const end = Date.parse(session.endedAt);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    minStart = Math.min(minStart, start);
    maxEnd = Math.max(maxEnd, end);
  }
  if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd) || maxEnd <= minStart) {
    return 0;
  }
  return maxEnd - minStart;
}

export function buildExportPayload(
  stats: StatsFile,
  live: boolean,
  deviceMeta: DeviceMeta,
): ExportPayload {
  const todayKey = localDateKey();
  const day = dayRangeMs(todayKey);
  const week = weekRangeMs(todayKey);
  const activeAll = stats.recordingMs ?? 0;
  const activeToday = recordingMsInRange(stats, day.startMs, day.endMs);
  const activeWeek = recordingMsInRange(stats, week.startMs, week.endMs);
  const pressesToday = pressesForDateKeys(stats, [todayKey]);
  const pressesWeek = pressesForDateKeys(stats, week.dateKeys);

  return {
    exportedAt: new Date().toISOString(),
    live,
    meta: toExportMeta(deviceMeta),
    summary: {
      totalPresses: stats.totalPresses,
      activeRecordingMs: activeAll,
      intensity: intensityFor(stats.totalPresses, activeAll),
      hottestKeyCount: hottestCount(stats),
      sessionCount: stats.sessions?.length ?? 0,
      bursts: {
        count: stats.bursts?.count ?? 0,
        longest: stats.bursts?.longest ?? 0,
        avgLength: avgBurstLength(stats.totalPresses, stats.bursts?.count ?? 0),
        perHour: burstsPerHour(stats.bursts?.count ?? 0, activeAll),
      },
      updatedAt: stats.updatedAt,
    },
    rankings: {
      allTime: rankingBlock({
        label: "All time",
        totalPresses: stats.totalPresses,
        activeRecordingMs: activeAll,
        periodMs: allTimePeriodMs(stats),
        top: topKeys(stats),
        transitionMap: stats.transitions,
      }),
      today: rankingBlock({
        label: "Today",
        dateKey: todayKey,
        totalPresses: pressesToday,
        activeRecordingMs: activeToday,
        periodMs: day.endMs - day.startMs,
        top: topKeysFromMap(keysForDateKeys(stats, [todayKey])),
        transitionMap: transitionsForDateKeys(stats, [todayKey]),
      }),
      last7Days: rankingBlock({
        label: "Last 7 days",
        dateFrom: week.dateKeys[0],
        dateTo: todayKey,
        totalPresses: pressesWeek,
        activeRecordingMs: activeWeek,
        periodMs: week.endMs - week.startMs,
        top: topKeysFromMap(keysForDateKeys(stats, week.dateKeys)),
        transitionMap: transitionsForDateKeys(stats, week.dateKeys),
      }),
    },
    stats,
  };
}

export function downloadExportJson(
  stats: StatsFile,
  live: boolean,
  deviceMeta: DeviceMeta,
): void {
  const payload = buildExportPayload(stats, live, deviceMeta);
  const stamp = payload.exportedAt.replace(/[:.]/g, "-");
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `keyboard-clicks-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
