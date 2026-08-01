import type { HeatKey } from "@shared/heat";
import { topSuspiciousRepeats } from "@shared/suspicious-repeats";
import type { StatsFile } from "@shared/types";
import { formatDuration } from "@shared/format";

type SessionsListProps = {
  stats: StatsFile;
  unmapped: HeatKey[];
};

export function SessionsList({ stats, unmapped }: SessionsListProps) {
  const sessions = stats.sessions ?? [];
  const suspicious = topSuspiciousRepeats(stats.suspiciousRepeats);
  const unmappedSorted = [...unmapped].sort((a, b) => b.count - a.count);
  const recentSessions = [...sessions].reverse().slice(0, 12);

  return (
    <aside className="rank-block diagnostics-block" aria-label="Diagnostics">
      <div className="side-heading">
        <h2>Diagnostics</h2>
      </div>

      {unmappedSorted.length > 0 ? (
        <>
          <h3 className="rank-subheading">Unmapped codes</h3>
          <ol>
            {unmappedSorted.map((item) => (
              <li key={item.id}>
                {item.label} — {item.count}
              </li>
            ))}
          </ol>
        </>
      ) : null}

      <h3
        className="rank-subheading"
        title="Same physical key pressed again within 30ms / 50ms (not OS auto-repeat). Sparse counters only — useful for bounce, double register, dying switches."
      >
        Suspicious repeats
      </h3>
      {suspicious.length === 0 ? (
        <p className="side-empty">No same-key gaps under 50ms yet.</p>
      ) : (
        <ol>
          {suspicious.slice(0, 12).map((item) => (
            <li
              key={item.id}
              title={`${item.label} (${item.id}): same-key gaps under 30ms / under 50ms`}
            >
              {item.label} — {"<30ms"} {item.under30ms} · {"<50ms"}{" "}
              {item.under50ms}
            </li>
          ))}
        </ol>
      )}

      <h3 className="rank-subheading">Recording intervals</h3>
      {sessions.length === 0 ? (
        <p className="side-empty">No completed intervals yet.</p>
      ) : (
        <>
          <ol>
            {recentSessions.map((session, indexFromEnd) => {
              const n = sessions.length - indexFromEnd;
              return (
                <li key={`${session.startedAt}-${session.endedAt}`}>
                  #{n} — {formatDuration(session.durationMs)}
                </li>
              );
            })}
          </ol>
          {sessions.length > 12 ? (
            <p className="side-empty">
              Latest 12 of {sessions.length}.
            </p>
          ) : null}
        </>
      )}
    </aside>
  );
}
