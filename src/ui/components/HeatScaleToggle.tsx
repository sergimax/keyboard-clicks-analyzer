import type { HeatScaleMode } from "@shared/heat";

const HEAT_SCALE_KEY = "kca-heat-scale";

type HeatScaleToggleProps = {
  mode: HeatScaleMode;
  onChange: (mode: HeatScaleMode) => void;
};

/** Default Absolute when unset / invalid. */
export function readHeatScaleMode(): HeatScaleMode {
  try {
    const raw = localStorage.getItem(HEAT_SCALE_KEY);
    return raw === "relative" ? "relative" : "absolute";
  } catch {
    return "absolute";
  }
}

export function writeHeatScaleMode(mode: HeatScaleMode): void {
  try {
    localStorage.setItem(HEAT_SCALE_KEY, mode);
  } catch {
    // ignore quota / private mode
  }
}

export function HeatScaleToggle({ mode, onChange }: HeatScaleToggleProps) {
  return (
    <div
      className="heat-scale"
      role="group"
      aria-label="Heatmap scale"
      title="Absolute: color vs hottest key (sqrt), show counts. Relative: color by rank among pressed keys, show % of total — mid-tier keys stay visible when Space dominates."
    >
      <span className="heat-scale-label">Heatmap</span>
      <div className="heat-scale-options">
        <button
          type="button"
          className={`heat-scale-btn${mode === "absolute" ? " is-active" : ""}`}
          aria-pressed={mode === "absolute"}
          onClick={() => onChange("absolute")}
        >
          Absolute
        </button>
        <button
          type="button"
          className={`heat-scale-btn${mode === "relative" ? " is-active" : ""}`}
          aria-pressed={mode === "relative"}
          onClick={() => onChange("relative")}
        >
          Relative (%)
        </button>
      </div>
    </div>
  );
}
