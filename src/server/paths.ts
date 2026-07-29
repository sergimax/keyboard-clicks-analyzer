import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Built Vite React app (served by the loopback HTTP server). */
export const uiDistDir = path.join(rootDir, "dist", "ui");

export const HOST = "127.0.0.1";
export const DEFAULT_PORT = 17823;
