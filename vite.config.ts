import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const packageJson = require("./package.json") as { version: string };

export default defineConfig({
  root: path.join(rootDir, "src/ui"),
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      "@shared": path.join(rootDir, "src/shared"),
      "@keymap": path.join(rootDir, "src/keymap.ts"),
    },
  },
  build: {
    outDir: path.join(rootDir, "dist/ui"),
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
