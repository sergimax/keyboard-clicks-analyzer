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

export type ExportRanking = {
  label: string;
  dateKey?: string;
  dateFrom?: string;
  dateTo?: string;
  totalPresses: number;
  recordingMs: number;
  top: RankItem[];
};

export type ExportPayload = {
  exportedAt: string;
  live: boolean;
  summary: {
    totalPresses: number;
    recordingMs: number;
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

export function buildExportPayload(stats: StatsFile, live: boolean): ExportPayload {
  const todayKey = localDateKey();
  const day = dayRangeMs(todayKey);
  const week = weekRangeMs(todayKey);

  return {
    exportedAt: new Date().toISOString(),
    live,
    summary: {
      totalPresses: stats.totalPresses,
      recordingMs: stats.recordingMs ?? 0,
      hottestKeyCount: hottestCount(stats),
      sessionCount: stats.sessions?.length ?? 0,
      updatedAt: stats.updatedAt,
    },
    rankings: {
      allTime: {
        label: "All time",
        totalPresses: stats.totalPresses,
        recordingMs: stats.recordingMs ?? 0,
        top: topKeys(stats),
      },
      today: {
        label: "Today",
        dateKey: todayKey,
        totalPresses: pressesForDateKeys(stats, [todayKey]),
        recordingMs: recordingMsInRange(stats, day.startMs, day.endMs),
        top: topKeysFromMap(keysForDateKeys(stats, [todayKey])),
      },
      last7Days: {
        label: "Last 7 days",
        dateFrom: week.dateKeys[0],
        dateTo: todayKey,
        totalPresses: pressesForDateKeys(stats, week.dateKeys),
        recordingMs: recordingMsInRange(stats, week.startMs, week.endMs),
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
