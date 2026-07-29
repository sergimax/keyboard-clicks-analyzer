import { runCollectSession } from "./collector-runner.ts";
import { startReportServer } from "./server/report-server.ts";
import { ensureUiBuilt } from "./server/http-app.ts";
import { loadStats, resetStats, statsPath } from "./store.ts";
import { dim, info, ok, red } from "./style.ts";

function usage(): never {
  console.error(`Usage:
  npm run collect   Start a capture session (Ctrl+C to stop)
  npm run report    Open local React heatmap viewer from saved stats
  npm run reset     Delete local stats

Offline only. Counts physical keys (scan codes), not characters.
UI: http://127.0.0.1:17823/ (during collect or report). Session time is in the terminal.`);
  process.exit(1);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  if (!cmd) usage();

  switch (cmd) {
    case "collect": {
      ensureUiBuilt();
      console.error(info("Starting local capture session. Press Ctrl+C to stop."));
      console.error(info(`Stats file: ${statsPath}`));
      console.error(info("A live heatmap will open at http://127.0.0.1:17823/ (localhost only)."));
      const stats = await runCollectSession();
      console.error(ok(`Session complete — ${stats.totalPresses} total presses saved`));
      break;
    }
    case "report": {
      ensureUiBuilt();
      const stats = loadStats();
      console.error(
        ok(
          `Report ready — ${stats.totalPresses} presses, ${Object.keys(stats.keys).length} keys`,
        ),
      );
      const server = await startReportServer({ openBrowser: true });
      console.error(ok(`Heatmap viewer: ${server.url}`));
      console.error(dim("Press Ctrl+C to stop the viewer."));
      await new Promise<void>((resolve) => {
        const onSignal = () => {
          process.off("SIGINT", onSignal);
          process.off("SIGTERM", onSignal);
          void server.close().finally(resolve);
        };
        process.on("SIGINT", onSignal);
        process.on("SIGTERM", onSignal);
      });
      break;
    }
    case "reset": {
      resetStats();
      console.error(ok("Local stats removed"));
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
