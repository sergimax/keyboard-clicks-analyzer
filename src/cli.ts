import { runCollectSession } from "./collector-runner.ts";
import { generateHeatmap } from "./report.ts";
import { loadStats, resetStats, statsPath } from "./store.ts";
import { info, ok, red } from "./style.ts";

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
      console.error(info("Starting local capture session. Press Ctrl+C to stop."));
      console.error(info(`Stats file: ${statsPath}`));
      console.error(info("A live heatmap will open at http://127.0.0.1:17823/ (localhost only)."));
      const stats = await runCollectSession();
      const out = generateHeatmap(stats);
      console.error(ok(`Session complete — ${stats.totalPresses} total presses saved`));
      console.error(ok(`Heatmap ready: ${out}`));
      break;
    }
    case "report": {
      const stats = loadStats();
      const out = generateHeatmap(stats);
      console.error(
        ok(
          `Report ready — ${stats.totalPresses} presses, ${Object.keys(stats.keys).length} keys`,
        ),
      );
      console.error(ok(`Heatmap ready: ${out}`));
      break;
    }
    case "reset": {
      resetStats();
      console.error(ok("Local stats and heatmap removed"));
      break;
    }
    default:
      usage();
  }
}

main().catch((err: unknown) => {
  console.error(red(`✖ ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
