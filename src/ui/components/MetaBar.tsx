import { formatDuration } from "@shared/format";

type MetaBarProps = {
  live: boolean;
  updatedAt: string;
  totalPresses: number;
  maxCount: number;
  totalRecordingMs: number;
  sessionCount: number;
  onReset?: () => void;
  resetting?: boolean;
};

export function MetaBar({
  live,
  updatedAt,
  totalPresses,
  maxCount,
  totalRecordingMs,
  sessionCount,
  onReset,
  resetting = false,
}: MetaBarProps) {
  return (
    <div className="meta">
      <div className="meta-main">
        {live ? <span className="live-badge">LIVE</span> : null}
        <span>
          Updated: <strong>{updatedAt || "—"}</strong>
        </span>
        <span>
          Total presses: <strong>{totalPresses}</strong>
        </span>
        <span>
          Hottest key: <strong>{maxCount}</strong>
        </span>
        <span>
          Total active recording: <strong>{formatDuration(totalRecordingMs)}</strong>
        </span>
        <span>
          Saved intervals: <strong>{sessionCount}</strong>
        </span>
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
