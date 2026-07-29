const NUMPAD_KEY = "kca-show-numpad";

type NumpadToggleProps = {
  showNumpad: boolean;
  onChange: (show: boolean) => void;
};

export function readShowNumpad(): boolean {
  try {
    return localStorage.getItem(NUMPAD_KEY) !== "0";
  } catch {
    return true;
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
      <label className="toggle-numpad">
        <input
          type="checkbox"
          checked={showNumpad}
          onChange={(event) => onChange(event.target.checked)}
        />
        Show numpad
      </label>
    </div>
  );
}
