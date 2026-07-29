import { useEffect, useState } from "react";
import {
  buildHeatKeys,
  hottestCount,
  topKeys,
  topKeysFromMap,
} from "@shared/heat";
import { dayRangeMs, localDateKey, weekRangeMs } from "@shared/dates";
import { keysForDateKeys, pressesForDateKeys, recordingMsInRange } from "@shared/period";
import { topTransitions, transitionsForDateKeys } from "@shared/transitions";
import type { StatsFile } from "@shared/types";
import { fetchStats, resetStats } from "./api";
import { KeyboardBoard } from "./components/KeyboardBoard";
import { MetaBar } from "./components/MetaBar";
import { NumpadToggle, readShowNumpad, writeShowNumpad } from "./components/NumpadToggle";
import { ExportJsonButton } from "./components/ExportJsonButton";
import { DeviceMetaFields } from "./components/DeviceMetaFields";
import { RankRow } from "./components/RankRow";
import { SessionsList } from "./components/SessionsList";
import { downloadExportJson } from "./export-json";
import {
  readDeviceMeta,
  writeDeviceMeta,
  type DeviceMeta,
} from "./device-meta";

const emptyStats: StatsFile = {
  version: 1,
  updatedAt: "",
  totalPresses: 0,
  recordingMs: 0,
  sessions: [],
  keys: {},
  transitions: {},
  daily: {},
};

export function App() {
  const [live, setLive] = useState(false);
  const [stats, setStats] = useState<StatsFile>(emptyStats);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showNumpad, setShowNumpad] = useState(() => readShowNumpad());
  const [deviceMeta, setDeviceMeta] = useState<DeviceMeta>(() => readDeviceMeta());

  useEffect(() => {
    document.body.classList.toggle("hide-numpad", !showNumpad);
    writeShowNumpad(showNumpad);
  }, [showNumpad]);

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

  async function handleReset() {
    if (
      !window.confirm(
        "Reset all accumulated key stats and recording timers? This cannot be undone.",
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      await resetStats();
      const data = await fetchStats();
      setLive(data.live);
      setStats(data.stats);
    } catch {
      window.alert("Could not reset stats. Is collect still running?");
    } finally {
      setResetting(false);
    }
  }

  const heatKeys = buildHeatKeys(stats);
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
    : "Intensity uses a square-root scale so secondary keys remain readable. Auto-repeat while holding a key is ignored (one count per press). Day/week rankings use local calendar days (week = last 7 days).";

  const periods = [
    {
      title: "All time",
      periodLabel: "All time",
      top: topKeys(stats),
      transitions: topTransitions(stats.transitions),
      totalPresses: stats.totalPresses,
      totalRecordingMs: stats.recordingMs ?? 0,
      emptyMessage: "No data yet. Run npm run collect.",
    },
    {
      title: "Today",
      periodLabel: `Today (${todayKey})`,
      top: topKeysFromMap(keysForDateKeys(stats, [todayKey])),
      transitions: topTransitions(transitionsForDateKeys(stats, [todayKey])),
      totalPresses: pressesForDateKeys(stats, [todayKey]),
      totalRecordingMs: recordingMsInRange(stats, day.startMs, day.endMs),
      emptyMessage: periodEmptyHint,
    },
    {
      title: "Last 7 days",
      periodLabel: `Last 7 days (${week.dateKeys[0]} – ${todayKey})`,
      top: topKeysFromMap(keysForDateKeys(stats, week.dateKeys)),
      transitions: topTransitions(transitionsForDateKeys(stats, week.dateKeys)),
      totalPresses: pressesForDateKeys(stats, week.dateKeys),
      totalRecordingMs: recordingMsInRange(stats, week.startMs, week.endMs),
      emptyMessage: periodEmptyHint,
    },
  ];

  return (
    <>
      <h1>Keyboard Heatmap</h1>
      <p className="sub">
        Local physical-key presses · no network · labels use US QWERTY positions
      </p>
      <div className="view-controls">
        <NumpadToggle showNumpad={showNumpad} onChange={setShowNumpad} />
        <DeviceMetaFields meta={deviceMeta} onChange={setDeviceMeta} />
        <ExportJsonButton
          disabled={stats.totalPresses === 0 && (stats.recordingMs ?? 0) === 0}
          onExport={() => downloadExportJson(stats, live, deviceMeta)}
        />
      </div>
      {error ? <p className="status-error">{error}</p> : null}
      <MetaBar
        live={live}
        updatedAt={stats.updatedAt}
        totalPresses={stats.totalPresses}
        maxCount={hottestCount(stats)}
        totalRecordingMs={stats.recordingMs ?? 0}
        sessionCount={stats.sessions?.length ?? 0}
        onReset={live ? () => void handleReset() : undefined}
        resetting={resetting}
      />
      <div className="layout">
        <div className="main-col">
          <KeyboardBoard keys={mapped} />
          <div className="legend">
            <span>cold</span>
            <div className="swatch" />
            <span>hot</span>
          </div>
          <p className="note">{note}</p>
          <RankRow periods={periods} />
        </div>
        <SessionsList stats={stats} unmapped={unmapped} />
      </div>
    </>
  );
}
