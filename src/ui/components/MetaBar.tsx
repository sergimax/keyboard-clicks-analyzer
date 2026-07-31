import {
  avgBurstLength,
  burstsPerHour,
} from "@shared/bursts";
import { formatDuration } from "@shared/format";
import type { RankItem } from "@shared/heat";
import type { BurstStats } from "@shared/types";

type MetaBarProps = {
  live: boolean;
  updatedAt: string;
  totalPresses: number;
  hottest: RankItem | null;
  totalRecordingMs: number;
  sessionCount: number;
  bursts: BurstStats;
  onReset?: () => void;
  resetting?: boolean;
};

function formatOptional(value: number | null): string {
  return value === null ? "—" : String(value);
}

export function MetaBar({
  live,
  updatedAt,
  totalPresses,
  hottest,
  totalRecordingMs,
  sessionCount,
  bursts,
  onReset,
  resetting = false,
}: MetaBarProps) {
  const burstCount = bursts?.count ?? 0;
  const longest = bursts?.longest ?? 0;
  const avg = avgBurstLength(totalPresses, burstCount);
  const perHour = burstsPerHour(burstCount, totalRecordingMs);
  const hottestLabel = hottest
    ? `${hottest.label} — ${hottest.count}`
    : "—";

  return (
    <div className="meta">
      <div className="meta-rows">
        <div className="meta-row meta-row-primary">
          {live ? <span className="live-badge">LIVE</span> : null}
          <span>
            Total presses: <strong>{totalPresses}</strong>
          </span>
          <span title={hottest ? `${hottest.label} (${hottest.id})` : undefined}>
            Hottest key: <strong>{hottestLabel}</strong>
          </span>
        </div>
        <div className="meta-row meta-row-stats">
          <span>
            Updated: <strong>{updatedAt || "—"}</strong>
          </span>
          <span
            title="Press runs separated by >1s idle (physical presses only). Complements presses/min with how activity is chunked."
          >
            Bursts: <strong>{burstCount}</strong>
          </span>
          <span title="Mean physical presses per burst (totalPresses ÷ bursts).">
            Avg burst: <strong>{formatOptional(avg)}</strong>
          </span>
          <span title="Longest unbroken press run (idle gaps ≤1s).">
            Longest burst: <strong>{longest}</strong>
          </span>
          <span title="Bursts per hour of completed active recording (same time base as intensity).">
            Bursts/hour: <strong>{formatOptional(perHour)}</strong>
          </span>
          <span>
            Total active recording:{" "}
            <strong>{formatDuration(totalRecordingMs)}</strong>
          </span>
          <span>
            Saved intervals: <strong>{sessionCount}</strong>
          </span>
        </div>
      </div>
      {live && onReset ? (
        <button
          type="button"
          className="btn-reset"
          disabled={resetting}
          onClick={onReset}
        >
          Reset stats
        </button>
      ) : null}
    </div>
  );
}
