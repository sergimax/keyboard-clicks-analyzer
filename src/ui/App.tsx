import { useEffect, useState } from "react";
import {
  buildHeatKeys,
  hottestKey,
  topKeys,
  topKeysFromMap,
  type HeatScaleMode,
} from "@shared/heat";
import { dayRangeMs, localDateKey, weekRangeMs } from "@shared/dates";
import { keysForDateKeys, pressesForDateKeys, recordingMsInRange } from "@shared/period";
import {
  modifierPairsForDateKeys,
  topModifierPairs,
} from "@shared/modifiers";
import {
  selfRepeats,
  topPairs,
  transitionsForDateKeys,
} from "@shared/transitions";
import type { StatsFile } from "@shared/types";
import { fetchStats, resetStats } from "./api";
import { KeyboardBoard } from "./components/KeyboardBoard";
import { MetaBar } from "./components/MetaBar";
import {
  HeatScaleToggle,
  readHeatScaleMode,
  writeHeatScaleMode,
} from "./components/HeatScaleToggle";
import { HeatLegend } from "./components/HeatLegend";
import { NumpadToggle, readShowNumpad, writeShowNumpad } from "./components/NumpadToggle";
import {
  SidePanelToggle,
  readShowSidePanel,
  writeShowSidePanel,
} from "./components/SidePanelToggle";
import { PreferenceSwitch } from "./components/PreferenceSwitch";
import { ExportDialog } from "./components/ExportDialog";
import { RankRow } from "./components/RankRow";
import { ResetConfirmDialog } from "./components/ResetConfirmDialog";
import { SessionsList } from "./components/SessionsList";
import { downloadExportJson } from "./export-json";
import {
  readDeviceMeta,
  writeDeviceMeta,
  type DeviceMeta,
} from "./device-meta";
import {
  readRankVisibility,
  writeRankVisibility,
  type RankVisibility,
} from "./rank-visibility";

const emptyStats: StatsFile = {
  version: 1,
  updatedAt: "",
  totalPresses: 0,
  recordingMs: 0,
  sessions: [],
  keys: {},
  transitions: {},
  modifierPairs: {},
  bursts: { count: 0, longest: 0 },
  suspiciousRepeats: {},
  daily: {},
};

export function App() {
  const [live, setLive] = useState(false);
  const [stats, setStats] = useState<StatsFile>(emptyStats);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [showNumpad, setShowNumpad] = useState(() => readShowNumpad());
  const [showSide, setShowSide] = useState(() => readShowSidePanel());
  const [heatScale, setHeatScale] = useState<HeatScaleMode>(() => readHeatScaleMode());
  const [rankVisibility, setRankVisibility] = useState<RankVisibility>(() =>
    readRankVisibility(),
  );
  const [deviceMeta, setDeviceMeta] = useState<DeviceMeta>(() => readDeviceMeta());

  useEffect(() => {
    document.body.classList.toggle("hide-numpad", !showNumpad);
    writeShowNumpad(showNumpad);
  }, [showNumpad]);

  useEffect(() => {
    writeShowSidePanel(showSide);
  }, [showSide]);

  useEffect(() => {
    writeHeatScaleMode(heatScale);
  }, [heatScale]);

  useEffect(() => {
    writeRankVisibility(rankVisibility);
  }, [rankVisibility]);

  useEffect(() => {
    writeDeviceMeta(deviceMeta);
  }, [deviceMeta]);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const data = await fetchStats();
        if (cancelled) return;
        setLive(data.live);
        setStats(data.stats);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    void tick();
    const timer = window.setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function handleConfirmReset() {
    setResetting(true);
    try {
      await resetStats();
      const data = await fetchStats();
      setLive(data.live);
      setStats(data.stats);
      setResetConfirmOpen(false);
    } catch {
      window.alert("Could not reset stats. Is collect still running?");
    } finally {
      setResetting(false);
    }
  }

  function patchRankVisibility(patch: Partial<RankVisibility>) {
    setRankVisibility((prev) => ({ ...prev, ...patch }));
  }

  const heatKeys = buildHeatKeys(stats, heatScale);
  const hottest = hottestKey(stats);
  const mapped = heatKeys.filter((key) => key.row > 0);
  const unmapped = heatKeys.filter((key) => key.row === 0 && key.count > 0);
  const todayKey = localDateKey();
  const day = dayRangeMs(todayKey);
  const week = weekRangeMs(todayKey);
  const hasDaily = Object.keys(stats.daily ?? {}).length > 0;
  const periodEmptyHint = hasDaily
    ? "No presses in this period yet."
    : "No day buckets yet — restart collect to start tracking today/week.";
  const note = live
    ? "Live view updates about once per second from the local collector (127.0.0.1 only). Current session time is shown in the collect terminal. Day/week key counts update live; recorded time for periods uses completed intervals only."
    : "Absolute heatmap: sqrt scale vs the hottest key (good for wear magnitude). Relative (%): captions show share of presses; colors use rank among pressed keys so Space does not wash out mid-tier keys. Rankings still use physical presses. Hold-repeats are in key tooltips. Day/week rankings use local calendar days (week = last 7 days).";

  const transitionsToday = transitionsForDateKeys(stats, [todayKey]);
  const transitionsWeek = transitionsForDateKeys(stats, week.dateKeys);
  const modifiersToday = modifierPairsForDateKeys(stats.daily ?? {}, [
    todayKey,
  ]);
  const modifiersWeek = modifierPairsForDateKeys(
    stats.daily ?? {},
    week.dateKeys,
  );

  const periods = [
    {
      title: "All time",
      periodLabel: "All time",
      top: topKeys(stats),
      topPairs: topPairs(stats.transitions),
      selfRepeats: selfRepeats(stats.transitions),
      modifierPairs: topModifierPairs(stats.modifierPairs),
      totalPresses: stats.totalPresses,
      totalRecordingMs: stats.recordingMs ?? 0,
      emptyMessage: "No data yet. Run npm run collect.",
    },
    {
      title: "Today",
      periodLabel: `Today (${todayKey})`,
      top: topKeysFromMap(keysForDateKeys(stats, [todayKey])),
      topPairs: topPairs(transitionsToday),
      selfRepeats: selfRepeats(transitionsToday),
      modifierPairs: topModifierPairs(modifiersToday),
      totalPresses: pressesForDateKeys(stats, [todayKey]),
      totalRecordingMs: recordingMsInRange(stats, day.startMs, day.endMs),
      emptyMessage: periodEmptyHint,
    },
    {
      title: "Last 7 days",
      periodLabel: `Last 7 days (${week.dateKeys[0]} – ${todayKey})`,
      top: topKeysFromMap(keysForDateKeys(stats, week.dateKeys)),
      topPairs: topPairs(transitionsWeek),
      selfRepeats: selfRepeats(transitionsWeek),
      modifierPairs: topModifierPairs(modifiersWeek),
      totalPresses: pressesForDateKeys(stats, week.dateKeys),
      totalRecordingMs: recordingMsInRange(stats, week.startMs, week.endMs),
      emptyMessage: periodEmptyHint,
    },
  ];

  const exportDisabled =
    stats.totalPresses === 0 && (stats.recordingMs ?? 0) === 0;

  return (
    <>
      <header className="app-header">
        <div className="app-header-brand">
          <h1>Keyboard Heatmap</h1>
          <span className="app-version" title="App version">
            v{__APP_VERSION__}
          </span>
        </div>
        <div className="app-header-actions">
          <button
            type="button"
            className="btn-header"
            onClick={() => setExportOpen(true)}
          >
            Export
          </button>
          {live ? (
            <button
              type="button"
              className="btn-header btn-header-danger"
              disabled={resetting}
              onClick={() => setResetConfirmOpen(true)}
            >
              Reset
            </button>
          ) : null}
        </div>
      </header>
      <p className="note note-intro">{note}</p>
      {error ? <p className="status-error">{error}</p> : null}
      <ExportDialog
        open={exportOpen}
        disabled={exportDisabled}
        meta={deviceMeta}
        onMetaChange={setDeviceMeta}
        onCancel={() => setExportOpen(false)}
        onExport={() => {
          downloadExportJson(stats, live, deviceMeta);
          setExportOpen(false);
        }}
      />
      <ResetConfirmDialog
        open={resetConfirmOpen}
        busy={resetting}
        totalPresses={stats.totalPresses}
        sessionCount={stats.sessions?.length ?? 0}
        onCancel={() => {
          if (!resetting) setResetConfirmOpen(false);
        }}
        onConfirm={() => void handleConfirmReset()}
      />

      <section className="heatmap-section" aria-label="Heatmap">
        <div className="heatmap-toolbar">
          <p className="sub heatmap-sub">
            Local physical-key presses · no network · labels use US QWERTY
            positions
          </p>
          <div className="heatmap-controls" aria-label="Heatmap controls">
            <NumpadToggle showNumpad={showNumpad} onChange={setShowNumpad} />
            <HeatScaleToggle mode={heatScale} onChange={setHeatScale} />
          </div>
        </div>
        <KeyboardBoard keys={mapped} scaleMode={heatScale} />
        <HeatLegend mode={heatScale} hottest={hottest} />
        <MetaBar
          updatedAt={stats.updatedAt}
          totalPresses={stats.totalPresses}
          hottest={hottest}
          totalRecordingMs={stats.recordingMs ?? 0}
          sessionCount={stats.sessions?.length ?? 0}
          bursts={stats.bursts ?? { count: 0, longest: 0 }}
        />
      </section>

      <section className="details-section" aria-label="Details">
        <div className="details-header">
          <h2 className="details-title">Details</h2>
          <div className="details-toggles" aria-label="Details panels">
            <SidePanelToggle showSide={showSide} onChange={setShowSide} />
            <PreferenceSwitch
              checked={rankVisibility.topPairs}
              onChange={(checked) => patchRankVisibility({ topPairs: checked })}
              label="Top pairs"
              title="Show A→B bigrams in ranking / Copy blocks"
            />
            <PreferenceSwitch
              checked={rankVisibility.selfRepeats}
              onChange={(checked) =>
                patchRankVisibility({ selfRepeats: checked })
              }
              label="Self-repeats"
              title="Show same-key runs (A→A) in ranking / Copy blocks"
            />
            <PreferenceSwitch
              checked={rankVisibility.modifierPairs}
              onChange={(checked) =>
                patchRankVisibility({ modifierPairs: checked })
              }
              label="Modifier chords"
              title="Show held-modifier + key combos in ranking / Copy blocks"
            />
          </div>
        </div>
        <div className={`details-layout${showSide ? "" : " no-side"}`}>
          {showSide ? (
            <SessionsList stats={stats} unmapped={unmapped} />
          ) : null}
          <div className="rank-area">
            <RankRow periods={periods} visibility={rankVisibility} />
          </div>
        </div>
      </section>
    </>
  );
}
