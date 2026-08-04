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
  document.documentElement.setAttribute("data-theme", mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      mode === "dark" ? "#1a1a1a" : "#fcfbf9",
    );
  }
}

/** Flip from the given mode (prefer UI state over re-reading storage). */
export function nextColorMode(current: ColorMode): ColorMode {
  return current === "dark" ? "light" : "dark";
}
