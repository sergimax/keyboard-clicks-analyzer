import { useEffect, useRef } from "react";
import type { DeviceMeta } from "../device-meta";
import { DeviceMetaFields } from "./DeviceMetaFields";

type ExportDialogProps = {
  open: boolean;
  disabled?: boolean;
  meta: DeviceMeta;
  onMetaChange: (meta: DeviceMeta) => void;
  onCancel: () => void;
  onExport: () => void;
};

export function ExportDialog({
  open,
  disabled = false,
  meta,
  onMetaChange,
  onCancel,
  onExport,
}: ExportDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        aria-describedby="export-dialog-desc"
      >
        <h2 id="export-dialog-title" className="modal-title modal-title-neutral">
          Export JSON
        </h2>
        <p id="export-dialog-desc" className="modal-body">
          Optional keyboard context is saved in the browser and embedded in the
          download. Layouts and model are not detected from the OS.
        </p>
        <div className="modal-fields">
          <DeviceMetaFields meta={meta} onChange={onMetaChange} />
        </div>
        <div className="modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-primary"
            disabled={disabled}
            onClick={onExport}
          >
            Download JSON
          </button>
        </div>
      </div>
    </div>
  );
}
