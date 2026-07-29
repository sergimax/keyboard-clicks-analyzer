import http from "node:http";
import { spawn } from "node:child_process";
import type { StatsFile } from "./store.ts";
import { renderHeatmapHtml } from "./report.ts";

export type LiveServer = {
  url: string;
  port: number;
  close: () => Promise<void>;
};

const HOST = "127.0.0.1";
const DEFAULT_PORT = 17823;

export async function startLiveServer(options: {
  getStats: () => StatsFile;
  onReset?: () => void;
  port?: number;
}): Promise<LiveServer> {
  const port = options.port ?? DEFAULT_PORT;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${HOST}`);
    const path = url.pathname;
    const method = (req.method ?? "GET").toUpperCase();

    if (path === "/reset" && method === "POST") {
      try {
        options.onReset?.();
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }
      return;
    }

    if (path !== "/" && path !== "/partial" && path !== "/heatmap.html") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const stats = options.getStats();
    stats.totalPresses = Object.values(stats.keys).reduce((sum, k) => sum + k.count, 0);
    stats.updatedAt = new Date().toISOString();

    const live = true;
    const html =
      path === "/partial"
        ? renderHeatmapHtml(stats, { live, partial: true })
        : renderHeatmapHtml(stats, { live, partial: false });

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(html);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const url = `http://${HOST}:${port}/`;

  return {
    url,
    port,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

export function openInBrowser(url: string): void {
  spawn("cmd", ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  }).unref();
}
