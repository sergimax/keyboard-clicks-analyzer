type PreferenceSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  ariaLabel?: string;
  title?: string;
};

/** Shared on/off control used by display toggles. */
export function PreferenceSwitch({
  checked,
  onChange,
  label,
  ariaLabel,
  title,
}: PreferenceSwitchProps) {
  return (
    <button
      type="button"
      className={`numpad-toggle${checked ? " is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      title={title}
      onClick={() => onChange(!checked)}
    >
      <span className="numpad-toggle-track" aria-hidden="true">
        <span className="numpad-toggle-thumb" />
      </span>
      <span className="numpad-toggle-label">{label}</span>
    </button>
  );
}
