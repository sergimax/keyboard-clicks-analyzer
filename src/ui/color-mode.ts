export type ColorMode = "light" | "dark";

const STORAGE_KEY = "kca-color-mode";

export function readColorMode(): ColorMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "light";
}

export function writeColorMode(mode: ColorMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  applyColorMode(mode);
}

export function applyColorMode(mode: ColorMode): void {
  document.documentElement.dataset.theme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      mode === "dark" ? "#1a1a1a" : "#fcfbf9",
    );
  }
}

export function toggleColorMode(): ColorMode {
  const next: ColorMode = readColorMode() === "dark" ? "light" : "dark";
  writeColorMode(next);
  return next;
}
