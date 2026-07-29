import { runCollectSession } from "./collector-runner.ts";
import { generateHeatmap } from "./report.ts";
import { loadStats, resetStats, statsPath } from "./store.ts";

function usage(): never {
  console.error(`Usage:
  npm run collect   Start a capture session (Ctrl+C to stop)
  npm run report    Build data/heatmap.html from accumulated stats
  npm run reset     Delete local stats and heatmap

Offline only. Counts physical keys (scan codes), not characters.`);
  process.exit(1);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  if (!cmd) usage();

  switch (cmd) {
    case "collect": {
      console.error("Starting local capture session. Press Ctrl+C to stop.");
      console.error(`Stats file: ${statsPath}`);
      await runCollectSession();
      const out = generateHeatmap();
      console.error(`Heatmap written: ${out}`);
      break;
    }
    case "report": {
      const stats = loadStats();
      const out = generateHeatmap(stats);
      console.log(out);
      console.error(
        `total presses: ${stats.totalPresses}; keys tracked: ${Object.keys(stats.keys).length}`,
      );
      break;
    }
    case "reset": {
      resetStats();
      console.error("Local stats and heatmap removed.");
      break;
    }
    default:
      usage();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
