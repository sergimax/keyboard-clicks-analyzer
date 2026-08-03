export type ColorMode = "light" | "dark";

const STORAGE_KEY = "kca-color-mode";

/** Default light (Super ★ porting default). */
export function readColorMode(): ColorMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "dark" || raw === "light") return raw;
  } catch {
    // ignore quota / private mode
  }
  return "light";
}

export function writeColorMode(mode: ColorMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore quota / private mode
  }
}

export function applyColorMode(mode: ColorMode): void {
  document.documentElement.dataset.theme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", mode === "dark" ? "#1a1a1a" : "#fcfbf9");
  }
}
