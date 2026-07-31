import { useState } from "react";
import {
  formatSharePercent,
  pressShare,
  type RankItem,
} from "@shared/heat";
import { formatDuration } from "@shared/format";
import type { ModifierPairItem } from "@shared/modifiers";
import type { SelfRepeatItem, TransitionItem } from "@shared/transitions";

type RankBlockProps = {
  title: string;
  periodLabel: string;
  top: RankItem[];
  topPairs: TransitionItem[];
  selfRepeats: SelfRepeatItem[];
  modifierPairs: ModifierPairItem[];
  totalPresses: number;
  totalRecordingMs: number;
  emptyMessage?: string;
};

function formatRankLine(item: RankItem, totalPresses: number): string {
  const share = pressShare(item.count, totalPresses);
  return `${item.label} — ${item.count} · ${formatSharePercent(share)}`;
}

function formatPairLine(item: TransitionItem): string {
  return `${item.from} → ${item.to} — ${item.count}`;
}

function formatSelfLine(item: SelfRepeatItem): string {
  return `${item.label} → ${item.label} — ${item.count}`;
}

function formatModifierLine(item: ModifierPairItem): string {
  return `${item.modifier}+${item.key} — ${item.count}`;
}

export function RankBlock({
  title,
  periodLabel,
  top,
  topPairs,
  selfRepeats,
  modifierPairs,
  totalPresses,
  totalRecordingMs,
  emptyMessage = "No data yet.",
}: RankBlockProps) {
  const recorded = formatDuration(totalRecordingMs);
  const empty =
    top.length === 0 &&
    topPairs.length === 0 &&
    selfRepeats.length === 0 &&
    modifierPairs.length === 0 &&
    totalPresses === 0 &&
    totalRecordingMs === 0;
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const keyLines = top.map(
      (item, index) => `${index + 1}. ${formatRankLine(item, totalPresses)}`,
    );
    const pairLines = topPairs.map(
      (item, index) => `${index + 1}. ${formatPairLine(item)}`,
    );
    const selfLines = selfRepeats.map(
      (item, index) => `${index + 1}. ${formatSelfLine(item)}`,
    );
    const modLines = modifierPairs.map(
      (item, index) => `${index + 1}. ${formatModifierLine(item)}`,
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
    if (pairLines.length) {
      parts.push("", "Top pairs:", ...pairLines);
    }
    if (selfLines.length) {
      parts.push("", "Self-repeats:", ...selfLines);
    }
    if (modLines.length) {
      parts.push("", "Modifier chords:", ...modLines);
    }
    if (
      !keyLines.length &&
      !pairLines.length &&
      !selfLines.length &&
      !modLines.length &&
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
      {topPairs.length > 0 ? (
        <>
          <h3
            className="rank-subheading"
            title="Consecutive different keys (bigrams). Excludes A→A self-repeats."
          >
            Top pairs
          </h3>
          <ol className="transition-list">
            {topPairs.map((item) => (
              <li key={`${item.fromId}>${item.toId}`}>
                {formatPairLine(item)}
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {selfRepeats.length > 0 ? (
        <>
          <h3
            className="rank-subheading"
            title="Same key pressed again in a row (nav, backspace runs) — not a key-to-key transition."
          >
            Self-repeats
          </h3>
          <ol className="transition-list">
            {selfRepeats.map((item) => (
              <li key={item.id}>{formatSelfLine(item)}</li>
            ))}
          </ol>
        </>
      ) : null}
      {modifierPairs.length > 0 ? (
        <>
          <h3
            className="rank-subheading"
            title="Key pressed while a modifier was held (true chord). Unlike LCtrl→C bigrams, this requires Ctrl still down."
          >
            Modifier chords
          </h3>
          <ol className="transition-list">
            {modifierPairs.map((item) => (
              <li key={item.id}>{formatModifierLine(item)}</li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}
