import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import type { StatsFile } from "../store.ts";
import { DEFAULT_PORT, HOST, uiDistDir } from "./paths.ts";

export type AppServer = {
  url: string;
  port: number;
  close: () => Promise<void>;
};

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function sendText(res: http.ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function safeJoin(root: string, requestPath: string): string | null {
  const decoded = decodeURIComponent(requestPath.split("?")[0] ?? "/");
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(path.resolve(root))) return null;
  return resolved;
}

function serveStatic(res: http.ServerResponse, filePath: string): void {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendText(res, 404, "Not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] ?? "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600",
  });
  fs.createReadStream(filePath).pipe(res);
}

export function ensureUiBuilt(): void {
  const indexPath = path.join(uiDistDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `UI build not found: ${indexPath}\nRun: npm run build:ui`,
    );
  }
}

export async function startAppServer(options: {
  getStats: () => StatsFile;
  live: boolean;
  onReset?: () => void;
  port?: number;
}): Promise<AppServer> {
  ensureUiBuilt();
  const port = options.port ?? DEFAULT_PORT;
  const allowReset = typeof options.onReset === "function";

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${HOST}`);
    const pathname = url.pathname;
    const method = (req.method ?? "GET").toUpperCase();

    if (pathname === "/api/stats" && method === "GET") {
      const stats = options.getStats();
      stats.totalPresses = Object.values(stats.keys).reduce((sum, k) => sum + k.count, 0);
      sendJson(res, 200, { live: options.live, stats });
      return;
    }

    if (pathname === "/api/reset" && method === "POST") {
      if (!allowReset) {
        sendJson(res, 405, { ok: false, error: "Reset is only available during collect" });
        return;
      }
      try {
        options.onReset?.();
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 500, {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    // Legacy alias used by older clients
    if (pathname === "/reset" && method === "POST") {
      if (!allowReset) {
        sendJson(res, 405, { ok: false, error: "Reset is only available during collect" });
        return;
      }
      try {
        options.onReset?.();
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 500, {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    if (method !== "GET" && method !== "HEAD") {
      sendText(res, 405, "Method not allowed");
      return;
    }

    const filePath = safeJoin(uiDistDir, pathname);
    if (!filePath) {
      sendText(res, 403, "Forbidden");
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      serveStatic(res, filePath);
      return;
    }

    // SPA fallback
    serveStatic(res, path.join(uiDistDir, "index.html"));
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
