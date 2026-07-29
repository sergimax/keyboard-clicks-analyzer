import { useState } from "react";
import {
  formatSharePercent,
  pressShare,
  type RankItem,
} from "@shared/heat";
import { formatDuration } from "@shared/format";
import type { TransitionItem } from "@shared/transitions";

type RankBlockProps = {
  title: string;
  periodLabel: string;
  top: RankItem[];
  transitions: TransitionItem[];
  totalPresses: number;
  totalRecordingMs: number;
  emptyMessage?: string;
};

function formatRankLine(item: RankItem, totalPresses: number): string {
  const share = pressShare(item.count, totalPresses);
  return `${item.label} — ${item.count} · ${formatSharePercent(share)}`;
}

function formatTransitionLine(item: TransitionItem): string {
  return `${item.from} → ${item.to} — ${item.count}`;
}

export function RankBlock({
  title,
  periodLabel,
  top,
  transitions,
  totalPresses,
  totalRecordingMs,
  emptyMessage = "No data yet.",
}: RankBlockProps) {
  const recorded = formatDuration(totalRecordingMs);
  const empty =
    top.length === 0 &&
    transitions.length === 0 &&
    totalPresses === 0 &&
    totalRecordingMs === 0;
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const keyLines = top.map(
      (item, index) => `${index + 1}. ${formatRankLine(item, totalPresses)}`,
    );
    const transitionLines = transitions.map(
      (item, index) => `${index + 1}. ${formatTransitionLine(item)}`,
    );
    const summary = [
      periodLabel,
      `Total presses: ${totalPresses}`,
      `Active recording: ${recorded}`,
    ];
    const parts = [...summary];
    if (keyLines.length) {
      parts.push("", "Top keys:", ...keyLines);
    }
    if (transitionLines.length) {
      parts.push("", "Top transitions:", ...transitionLines);
    }
    if (
      !keyLines.length &&
      !transitionLines.length &&
      totalPresses === 0 &&
      (recorded === "00:00" || recorded === "0:00:00")
    ) {
      window.alert("Nothing to copy yet.");
      return;
    }
    setCopying(true);
    try {
      await navigator.clipboard.writeText(parts.join("\n"));
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        setCopying(false);
      }, 1200);
    } catch {
      setCopying(false);
      window.alert("Could not copy to clipboard.");
    }
  }

  return (
    <section className="rank-block">
      <div className="side-heading">
        <h2>{title}</h2>
        <p className="rank-summary">
          <span>
            Presses: <strong>{totalPresses}</strong>
          </span>
          <span>
            Active recording: <strong>{recorded}</strong>
          </span>
        </p>
        <button
          type="button"
          className="btn-copy"
          disabled={empty || copying}
          onClick={() => void handleCopy()}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <ol>
        {top.length === 0 ? (
          <li>{emptyMessage}</li>
        ) : (
          top.map((item) => (
            <li key={item.id}>{formatRankLine(item, totalPresses)}</li>
          ))
        )}
      </ol>
      {transitions.length > 0 ? (
        <>
          <h3 className="rank-subheading">Top transitions</h3>
          <ol className="transition-list">
            {transitions.map((item) => (
              <li key={`${item.fromId}>${item.toId}`}>
                {formatTransitionLine(item)}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}
