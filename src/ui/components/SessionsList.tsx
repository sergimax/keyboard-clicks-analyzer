import type { HeatKey } from "@shared/heat";
import type { StatsFile } from "@shared/types";
import { formatDuration } from "@shared/format";

type SessionsListProps = {
  stats: StatsFile;
  unmapped: HeatKey[];
};

export function SessionsList({ stats, unmapped }: SessionsListProps) {
  const sessions = stats.sessions ?? [];

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
