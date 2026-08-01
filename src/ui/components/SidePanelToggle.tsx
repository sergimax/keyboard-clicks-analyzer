import { PreferenceSwitch } from "./PreferenceSwitch";

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
    <PreferenceSwitch
      checked={showSide}
      onChange={onChange}
      label="Diagnostics"
      ariaLabel="Show diagnostics"
      title="Suspicious repeats, recording intervals, and unmapped codes"
    />
  );
}
