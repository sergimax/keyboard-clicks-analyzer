const DEVICE_META_KEY = "kca-device-meta";

export type DeviceMeta = {
  /** BCP 47 / short layout tags the user types on, e.g. ["ru", "en"]. Not OS-detected. */
  keyboardLayout: string[];
  /** Free-text board name, e.g. "Keychron C1 Pro". */
  keyboardModel: string;
};

export type ExportMeta = {
  platform: "windows";
  keyboardLayout: string[];
  /** null when unset. */
  keyboardModel: string | null;
};

const emptyMeta = (): DeviceMeta => ({
  keyboardLayout: [],
  keyboardModel: "",
});

/** Parse comma/space-separated layout tags into lowercase unique list. */
export function parseLayoutInput(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;\s]+/)) {
    const tag = part.trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

export function formatLayoutInput(layouts: string[]): string {
  return layouts.join(", ");
}

export function readDeviceMeta(): DeviceMeta {
  try {
    const raw = localStorage.getItem(DEVICE_META_KEY);
    if (!raw) return emptyMeta();
    const parsed = JSON.parse(raw) as Partial<DeviceMeta>;
    const layouts = Array.isArray(parsed.keyboardLayout)
      ? parsed.keyboardLayout
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const model =
      typeof parsed.keyboardModel === "string" ? parsed.keyboardModel.trim() : "";
    return {
      keyboardLayout: [...new Set(layouts)],
      keyboardModel: model,
    };
  } catch {
    return emptyMeta();
  }
}

export function writeDeviceMeta(meta: DeviceMeta): void {
  try {
    localStorage.setItem(
      DEVICE_META_KEY,
      JSON.stringify({
        keyboardLayout: meta.keyboardLayout,
        keyboardModel: meta.keyboardModel.trim(),
      }),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function toExportMeta(meta: DeviceMeta): ExportMeta {
  const model = meta.keyboardModel.trim();
  return {
    platform: "windows",
    keyboardLayout: [...meta.keyboardLayout],
    keyboardModel: model.length > 0 ? model : null,
  };
}
