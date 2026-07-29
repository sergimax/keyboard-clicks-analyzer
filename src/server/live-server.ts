import type { StatsFile } from "../store.ts";
import { openInBrowser, startAppServer, type AppServer } from "./http-app.ts";

export type { AppServer };
export { openInBrowser };

/** Live collect viewer with Reset enabled. */
export async function startLiveServer(options: {
  getStats: () => StatsFile;
  onReset?: () => void;
  port?: number;
}): Promise<AppServer> {
  return startAppServer({
    getStats: options.getStats,
    live: true,
    onReset: options.onReset,
    port: options.port,
  });
}
