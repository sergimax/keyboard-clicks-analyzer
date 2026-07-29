import type { RankItem } from "@shared/heat";
import {
  hottestCount,
  topKeys,
  topKeysFromMap,
} from "@shared/heat";
import { dayRangeMs, localDateKey, weekRangeMs } from "@shared/dates";
import {
  keysForDateKeys,
  pressesForDateKeys,
  recordingMsInRange,
} from "@shared/period";
import type { StatsFile } from "@shared/types";

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

export type ExportRanking = {
  label: string;
  dateKey?: string;
  dateFrom?: string;
  dateTo?: string;
  totalPresses: number;
  timing: ExportTiming;
  intensity: ExportIntensity;
  top: RankItem[];
};

export type ExportPayload = {
  exportedAt: string;
  live: boolean;
  summary: {
    totalPresses: number;
    /** Sum of all completed collect intervals (same as stats.recordingMs). */
    activeRecordingMs: number;
    intensity: ExportIntensity;
    hottestKeyCount: number;
    sessionCount: number;
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

function rankingBlock(options: {
  label: string;
  dateKey?: string;
  dateFrom?: string;
  dateTo?: string;
  totalPresses: number;
  activeRecordingMs: number;
  periodMs: number;
  top: RankItem[];
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
    top: options.top,
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

export function buildExportPayload(stats: StatsFile, live: boolean): ExportPayload {
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
    summary: {
      totalPresses: stats.totalPresses,
      activeRecordingMs: activeAll,
      intensity: intensityFor(stats.totalPresses, activeAll),
      hottestKeyCount: hottestCount(stats),
      sessionCount: stats.sessions?.length ?? 0,
      updatedAt: stats.updatedAt,
    },
    rankings: {
      allTime: rankingBlock({
        label: "All time",
        totalPresses: stats.totalPresses,
        activeRecordingMs: activeAll,
        periodMs: allTimePeriodMs(stats),
        top: topKeys(stats),
      }),
      today: rankingBlock({
        label: "Today",
        dateKey: todayKey,
        totalPresses: pressesToday,
        activeRecordingMs: activeToday,
        periodMs: day.endMs - day.startMs,
        top: topKeysFromMap(keysForDateKeys(stats, [todayKey])),
      }),
      last7Days: rankingBlock({
        label: "Last 7 days",
        dateFrom: week.dateKeys[0],
        dateTo: todayKey,
        totalPresses: pressesWeek,
        activeRecordingMs: activeWeek,
        periodMs: week.endMs - week.startMs,
        top: topKeysFromMap(keysForDateKeys(stats, week.dateKeys)),
      }),
    },
    stats,
  };
}

export function downloadExportJson(stats: StatsFile, live: boolean): void {
  const payload = buildExportPayload(stats, live);
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
