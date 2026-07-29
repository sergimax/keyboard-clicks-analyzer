import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import readline from "node:readline";
import { openInBrowser, startLiveServer } from "./live-server.ts";
import { collectorBin, bumpKey, loadStats, saveStats, type StatsFile } from "./store.ts";
import { dim, ok } from "./style.ts";

type RawEvent = {
  sc: number;
  ext: number;
  t: number;
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
    return { sc: obj.sc, ext: obj.ext, t: obj.t };
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

  const live = await startLiveServer({ getStats: () => stats });
  process.stderr.write(`\n${ok(`Live heatmap: ${live.url}`)}\n`);
  if (openBrowser) {
    openInBrowser(live.url);
  }

  const child: ChildProcessWithoutNullStreams = spawn(collectorBin, [], {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  const rl = readline.createInterface({ input: child.stdout });
  rl.on("line", (line) => {
    const event = parseEvent(line);
    if (!event) return;
    bumpKey(stats, event.sc, event.ext);
    dirty = true;
    sessionPresses += 1;
    if (sessionPresses === 1 || sessionPresses % 50 === 0) {
      process.stderr.write(
        `\r${dim(`presses this session: ${sessionPresses}`)}   `,
      );
    }
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
    rl.close();
    if (dirty) {
      saveStats(stats);
      dirty = false;
    }
    try {
      await live.close();
    } catch {
      // ignore close races on shutdown
    }
    process.stderr.write(
      `\n${ok(`Saved ${sessionPresses} presses this session (total ${stats.totalPresses})`)}\n`,
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
