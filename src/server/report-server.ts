import { loadStats, type StatsFile } from "../store.ts";
import { openInBrowser, startAppServer, type AppServer } from "./http-app.ts";

export type { AppServer };
export { openInBrowser };

/** Static report viewer (no Reset). Reloads stats from disk on each poll. */
export async function startReportServer(options?: {
  port?: number;
  openBrowser?: boolean;
}): Promise<AppServer> {
  const openBrowser = options?.openBrowser !== false;
  const server = await startAppServer({
    getStats: (): StatsFile => loadStats(),
    live: false,
    port: options?.port,
  });
  if (openBrowser) {
    openInBrowser(server.url);
  }
  return server;
}
