import { PreferenceSwitch } from "./PreferenceSwitch";

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
    <PreferenceSwitch
      checked={showNumpad}
      onChange={onChange}
      label="Show numpad"
      ariaLabel="Show numpad"
    />
  );
}
