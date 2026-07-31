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

  return (
    <aside className="side">
      {unmapped.length > 0 ? (
        <div>
          <h2>Unmapped codes</h2>
          <ol>
            {[...unmapped]
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <li key={item.id}>
                  {item.label} — {item.count}
                </li>
              ))}
          </ol>
        </div>
      ) : null}
      <div>
        <h2 title="Same physical key pressed again within 30ms / 50ms (not OS auto-repeat). Sparse counters only — useful for bounce, double register, dying switches.">
          Suspicious repeats
        </h2>
        {suspicious.length === 0 ? (
          <p className="side-empty">
            No same-key gaps under 50ms yet.
          </p>
        ) : (
          <ol>
            {suspicious.map((item) => (
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
      </div>
      <div>
        <h2>Recording intervals</h2>
        {sessions.length === 0 ? (
          <p className="side-empty">No completed intervals yet.</p>
        ) : (
          <>
            <ol>
              {[...sessions]
                .reverse()
                .slice(0, 20)
                .map((session, indexFromEnd) => {
                  const n = sessions.length - indexFromEnd;
                  return (
                    <li key={`${session.startedAt}-${session.endedAt}`}>
                      #{n} — {formatDuration(session.durationMs)}
                    </li>
                  );
                })}
            </ol>
            {sessions.length > 20 ? (
              <p className="side-empty">
                Showing latest 20 of {sessions.length}.
              </p>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
