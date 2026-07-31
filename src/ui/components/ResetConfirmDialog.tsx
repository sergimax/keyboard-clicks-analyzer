import { useEffect, useRef } from "react";

type ResetConfirmDialogProps = {
  open: boolean;
  busy?: boolean;
  totalPresses: number;
  sessionCount: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ResetConfirmDialog({
  open,
  busy = false,
  totalPresses,
  sessionCount,
  onCancel,
  onConfirm,
}: ResetConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-desc"
      >
        <h2 id="reset-dialog-title" className="modal-title">
          Reset all stats?
        </h2>
        <p id="reset-dialog-desc" className="modal-body">
          This permanently clears heatmap counts, day/week buckets, transitions,
          bursts, and recording intervals
          {totalPresses > 0 || sessionCount > 0
            ? ` (${totalPresses.toLocaleString()} presses · ${sessionCount} saved intervals)`
            : ""}
          . This cannot be undone.
        </p>
        <div className="modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn-modal-cancel"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-danger"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Resetting…" : "Reset everything"}
          </button>
        </div>
      </div>
    </div>
  );
}
