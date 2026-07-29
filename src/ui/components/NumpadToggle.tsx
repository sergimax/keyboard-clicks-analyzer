const NUMPAD_KEY = "kca-show-numpad";

type NumpadToggleProps = {
  showNumpad: boolean;
  onChange: (show: boolean) => void;
};

/** Default Off (hidden) when unset. */
export function readShowNumpad(): boolean {
  try {
    return localStorage.getItem(NUMPAD_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeShowNumpad(show: boolean): void {
  try {
    localStorage.setItem(NUMPAD_KEY, show ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}

export function NumpadToggle({ showNumpad, onChange }: NumpadToggleProps) {
  return (
    <div className="view-controls">
      <button
        type="button"
        className={`numpad-toggle${showNumpad ? " is-on" : ""}`}
        role="switch"
        aria-checked={showNumpad}
        aria-label="Show numpad"
        onClick={() => onChange(!showNumpad)}
      >
        <span className="numpad-toggle-track" aria-hidden="true">
          <span className="numpad-toggle-thumb" />
        </span>
        <span className="numpad-toggle-label">Show numpad</span>
      </button>
    </div>
  );
}
