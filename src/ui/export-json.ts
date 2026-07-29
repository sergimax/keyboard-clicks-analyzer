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

export type ExportRanking = {
  label: string;
  dateKey?: string;
  dateFrom?: string;
  dateTo?: string;
  totalPresses: number;
  timing: ExportTiming;
  top: RankItem[];
};

export type ExportPayload = {
  exportedAt: string;
  live: boolean;
  summary: {
    totalPresses: number;
    /** Sum of all completed collect intervals (same as stats.recordingMs). */
    activeRecordingMs: number;
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

  return {
    exportedAt: new Date().toISOString(),
    live,
    summary: {
      totalPresses: stats.totalPresses,
      activeRecordingMs: activeAll,
      hottestKeyCount: hottestCount(stats),
      sessionCount: stats.sessions?.length ?? 0,
      updatedAt: stats.updatedAt,
    },
    rankings: {
      allTime: {
        label: "All time",
        totalPresses: stats.totalPresses,
        timing: timingFor(activeAll, allTimePeriodMs(stats)),
        top: topKeys(stats),
      },
      today: {
        label: "Today",
        dateKey: todayKey,
        totalPresses: pressesForDateKeys(stats, [todayKey]),
        timing: timingFor(activeToday, day.endMs - day.startMs),
        top: topKeysFromMap(keysForDateKeys(stats, [todayKey])),
      },
      last7Days: {
        label: "Last 7 days",
        dateFrom: week.dateKeys[0],
        dateTo: todayKey,
        totalPresses: pressesForDateKeys(stats, week.dateKeys),
        timing: timingFor(activeWeek, week.endMs - week.startMs),
        top: topKeysFromMap(keysForDateKeys(stats, week.dateKeys)),
      },
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
