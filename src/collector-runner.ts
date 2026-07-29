import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import readline from "node:readline";
import { collectorBin, bumpKey, loadStats, saveStats, type StatsFile } from "./store.ts";

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
}): Promise<StatsFile> {
  const flushEveryMs = options?.flushEveryMs ?? 5_000;

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
      process.stderr.write(`\rpresses this session: ${sessionPresses}   `);
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

  const finalize = () => {
    if (finished) return;
    finished = true;
    clearInterval(flushTimer);
    rl.close();
    if (dirty) {
      saveStats(stats);
      dirty = false;
    }
    process.stderr.write(
      `\nsaved ${sessionPresses} presses this session; total ${stats.totalPresses}\n`,
    );
  };

  await new Promise<void>((resolve, reject) => {
    const onSignal = () => {
      process.stderr.write("\nstopping (SIGINT)...\n");
      if (!child.killed) {
        child.kill();
      }
      finalize();
      resolve();
    };

    process.once("SIGINT", onSignal);
    process.once("SIGTERM", onSignal);

    child.on("error", (err) => {
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
      finalize();
      reject(err);
    });

    child.on("exit", (code, signal) => {
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
      finalize();
      if (signal || code === 0 || code === null) {
        resolve();
        return;
      }
      reject(new Error(`Collector exited with code ${code}`));
    });
  });

  return stats;
}
