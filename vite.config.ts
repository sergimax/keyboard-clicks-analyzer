import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(rootDir, "src/ui"),
  plugins: [react()],
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
