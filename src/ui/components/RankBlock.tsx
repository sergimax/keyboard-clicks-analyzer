import { useState } from "react";
import {
  formatSharePercent,
  pressShare,
  type RankItem,
} from "@shared/heat";
import { formatDuration } from "@shared/format";
import type { ModifierPairItem } from "@shared/modifiers";
import type { SelfRepeatItem, TransitionItem } from "@shared/transitions";
import type { RankVisibility } from "../rank-visibility";

/** Visible rows in the UI; Copy still uses the full arrays. */
const RANK_UI_LIMIT = 12;

type RankBlockProps = {
  title: string;
  periodLabel: string;
  top: RankItem[];
  topPairs: TransitionItem[];
  selfRepeats: SelfRepeatItem[];
  modifierPairs: ModifierPairItem[];
  visibility: RankVisibility;
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
  visibility,
  totalPresses,
  totalRecordingMs,
  emptyMessage = "No data yet.",
}: RankBlockProps) {
  const recorded = formatDuration(totalRecordingMs);
  const showPairs = visibility.topPairs && topPairs.length > 0;
  const showSelf = visibility.selfRepeats && selfRepeats.length > 0;
  const showMods = visibility.modifierPairs && modifierPairs.length > 0;
  const visibleTop = top.slice(0, RANK_UI_LIMIT);
  const visiblePairs = topPairs.slice(0, RANK_UI_LIMIT);
  const visibleSelf = selfRepeats.slice(0, RANK_UI_LIMIT);
  const visibleMods = modifierPairs.slice(0, RANK_UI_LIMIT);
  const empty =
    top.length === 0 &&
    !showPairs &&
    !showSelf &&
    !showMods &&
    totalPresses === 0 &&
    totalRecordingMs === 0;
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const keyLines = top.map(
      (item, index) => `${index + 1}. ${formatRankLine(item, totalPresses)}`,
    );
    const pairLines = visibility.topPairs
      ? topPairs.map(
          (item, index) => `${index + 1}. ${formatPairLine(item)}`,
        )
      : [];
    const selfLines = visibility.selfRepeats
      ? selfRepeats.map(
          (item, index) => `${index + 1}. ${formatSelfLine(item)}`,
        )
      : [];
    const modLines = visibility.modifierPairs
      ? modifierPairs.map(
          (item, index) => `${index + 1}. ${formatModifierLine(item)}`,
        )
      : [];
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
      <h3 className="rank-subheading">Most popular</h3>
      <ol>
        {visibleTop.length === 0 ? (
          <li>{emptyMessage}</li>
        ) : (
          visibleTop.map((item) => (
            <li key={item.id}>{formatRankLine(item, totalPresses)}</li>
          ))
        )}
      </ol>
      {showPairs ? (
        <>
          <h3
            className="rank-subheading"
            title="Consecutive different keys (bigrams). Excludes A→A self-repeats."
          >
            Top pairs
          </h3>
          <ol>
            {visiblePairs.map((item) => (
              <li key={`${item.fromId}>${item.toId}`}>
                {formatPairLine(item)}
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {showSelf ? (
        <>
          <h3
            className="rank-subheading"
            title="Same key pressed again in a row (nav, backspace runs) — not a key-to-key transition."
          >
            Self-repeats
          </h3>
          <ol>
            {visibleSelf.map((item) => (
              <li key={item.id}>{formatSelfLine(item)}</li>
            ))}
          </ol>
        </>
      ) : null}
      {showMods ? (
        <>
          <h3
            className="rank-subheading"
            title="Key pressed while a modifier was held (true chord). Unlike LCtrl→C bigrams, this requires Ctrl still down."
          >
            Modifier chords
          </h3>
          <ol>
            {visibleMods.map((item) => (
              <li key={item.id}>{formatModifierLine(item)}</li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}
