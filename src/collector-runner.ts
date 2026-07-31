import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import readline from "node:readline";
import { openInBrowser, startLiveServer } from "./server/live-server.ts";
import {
  bumpBurst,
  bumpKey,
  bumpKeyRepeat,
  bumpSuspiciousRepeat,
  bumpTransition,
  clearStatsInPlace,
  collectorBin,
  emptyBurstTracker,
  emptySuspiciousRepeatTracker,
  finalizeRecordingSession,
  formatDuration,
  loadStats,
  saveStats,
  type StatsFile,
} from "./store.ts";
import { dim, ok } from "./style.ts";

type RawEvent = {
  sc: number;
  ext: number;
  t: number;
  /** 1 = OS auto-repeat while held; 0 / omitted = physical first-down. */
  rep: number;
};

function parseEvent(line: string): RawEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const obj = JSON.parse(trimmed) as Partial<RawEvent>;
    if (
      typeof obj.sc !== "number" ||
      typeof obj.ext !== "number" ||
      typeof obj.t !== "number"
    ) {
      return null;
    }
    const rep = typeof obj.rep === "number" && obj.rep === 1 ? 1 : 0;
    return { sc: obj.sc, ext: obj.ext, t: obj.t, rep };
  } catch {
    return null;
  }
}

export async function runCollectSession(options?: {
  flushEveryMs?: number;
  openBrowser?: boolean;
}): Promise<StatsFile> {
  const flushEveryMs = options?.flushEveryMs ?? 5_000;
  const openBrowser = options?.openBrowser !== false;

  if (process.platform !== "win32") {
    throw new Error("Collector supports Windows only (WH_KEYBOARD_LL).");
  }

  if (!existsSync(collectorBin)) {
    throw new Error(
      `Collector binary not found: ${collectorBin}\nRun: npm run build:collector`,
    );
  }

  const stats = loadStats();
  let dirty = false;
  let sessionPresses = 0;
  let finished = false;
  let sessionStartedAt = Date.now();
  let lastKeyId: string | null = null;
  const burstTracker = emptyBurstTracker();
  const suspiciousTracker = emptySuspiciousRepeatTracker();

  const writeStatusLine = () => {
    const elapsed = formatDuration(Date.now() - sessionStartedAt);
    process.stderr.write(
      `\r${dim(`session ${elapsed} · presses ${sessionPresses}`)}   `,
    );
  };

  const live = await startLiveServer({
    getStats: () => stats,
    onReset: () => {
      clearStatsInPlace(stats);
      sessionPresses = 0;
      lastKeyId = null;
      burstTracker.lastPressAt = 0;
      burstTracker.currentLength = 0;
      suspiciousTracker.clear();
      dirty = false;
      sessionStartedAt = Date.now();
      process.stderr.write(`\n${ok("Stats and recording timers reset from live UI")}\n`);
      writeStatusLine();
    },
  });
  process.stderr.write(`\n${ok(`Live heatmap: ${live.url}`)}\n`);
  if (openBrowser) {
    openInBrowser(live.url);
  }

  const child: ChildProcessWithoutNullStreams = spawn(collectorBin, [], {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  const statusTimer = setInterval(writeStatusLine, 1000);
  writeStatusLine();

  const rl = readline.createInterface({ input: child.stdout });
  rl.on("line", (line) => {
    const event = parseEvent(line);
    if (!event) return;
    if (event.rep === 1) {
      bumpKeyRepeat(stats, event.sc, event.ext, event.t);
      dirty = true;
      return;
    }
    const keyId = bumpKey(stats, event.sc, event.ext, event.t);
    bumpBurst(stats, burstTracker, event.t);
    bumpSuspiciousRepeat(stats, suspiciousTracker, event.sc, event.ext, event.t);
    if (lastKeyId) {
      bumpTransition(stats, lastKeyId, event.sc, event.ext, event.t);
    }
    lastKeyId = keyId;
    dirty = true;
    sessionPresses += 1;
    writeStatusLine();
  });

  child.stderr.on("data", (chunk: Buffer) => {
    process.stderr.write(chunk);
  });

  const flushTimer = setInterval(() => {
    if (!dirty) return;
    saveStats(stats);
    dirty = false;
  }, flushEveryMs);

  const finalize = async () => {
    if (finished) return;
    finished = true;
    clearInterval(flushTimer);
    clearInterval(statusTimer);
    rl.close();
    finalizeRecordingSession(stats, sessionStartedAt);
    saveStats(stats);
    dirty = false;
    try {
      await live.close();
    } catch {
      // ignore close races on shutdown
    }
    const last = stats.sessions[stats.sessions.length - 1];
    process.stderr.write(
      `\n${ok(
        `Saved ${sessionPresses} presses this session (${formatDuration(last?.durationMs ?? 0)}); total ${stats.totalPresses}; recorded ${formatDuration(stats.recordingMs)}`,
      )}\n`,
    );
  };

  await new Promise<void>((resolve, reject) => {
    const onSignal = () => {
      process.stderr.write(`\n${dim("stopping (SIGINT)...")}\n`);
      if (!child.killed) {
        child.kill();
      }
      void finalize().then(resolve);
    };

    process.once("SIGINT", onSignal);
    process.once("SIGTERM", onSignal);

    child.on("error", (err) => {
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
      void finalize().then(() => reject(err));
    });

    child.on("exit", (code, signal) => {
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
      void finalize().then(() => {
        if (signal || code === 0 || code === null) {
          resolve();
          return;
        }
        reject(new Error(`Collector exited with code ${code}`));
      });
    });
  });

  return stats;
}
