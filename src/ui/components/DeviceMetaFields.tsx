import {
  formatLayoutInput,
  parseLayoutInput,
  type DeviceMeta,
} from "../device-meta";

type DeviceMetaFieldsProps = {
  meta: DeviceMeta;
  onChange: (meta: DeviceMeta) => void;
};

export function DeviceMetaFields({ meta, onChange }: DeviceMetaFieldsProps) {
  return (
    <div className="device-meta" title="Optional context embedded in Export JSON (not OS-detected)">
      <label className="device-meta-field">
        <span className="device-meta-label">Layouts</span>
        <input
          type="text"
          className="device-meta-input"
          placeholder="ru, en"
          value={formatLayoutInput(meta.keyboardLayout)}
          onChange={(event) =>
            onChange({
              ...meta,
              keyboardLayout: parseLayoutInput(event.target.value),
            })
          }
          spellCheck={false}
          autoComplete="off"
        />
      </label>
      <label className="device-meta-field">
        <span className="device-meta-label">Keyboard</span>
        <input
          type="text"
          className="device-meta-input device-meta-input-wide"
          placeholder="Keychron C1 Pro"
          value={meta.keyboardModel}
          onChange={(event) =>
            onChange({
              ...meta,
              keyboardModel: event.target.value,
            })
          }
          spellCheck={false}
          autoComplete="off"
        />
      </label>
    </div>
  );
}
