const SIDE_PANEL_KEY = "kca-show-side";

type SidePanelToggleProps = {
  showSide: boolean;
  onChange: (show: boolean) => void;
};

/** Default On (visible) when unset. */
export function readShowSidePanel(): boolean {
  try {
    const raw = localStorage.getItem(SIDE_PANEL_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

export function writeShowSidePanel(show: boolean): void {
  try {
    localStorage.setItem(SIDE_PANEL_KEY, show ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}

export function SidePanelToggle({ showSide, onChange }: SidePanelToggleProps) {
  return (
    <button
      type="button"
      className={`numpad-toggle${showSide ? " is-on" : ""}`}
      role="switch"
      aria-checked={showSide}
      aria-label="Show side panel"
      title="Suspicious repeats, recording intervals, and unmapped codes"
      onClick={() => onChange(!showSide)}
    >
      <span className="numpad-toggle-track" aria-hidden="true">
        <span className="numpad-toggle-thumb" />
      </span>
      <span className="numpad-toggle-label">Side panel</span>
    </button>
  );
}
