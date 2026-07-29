type ExportJsonButtonProps = {
  disabled?: boolean;
  onExport: () => void;
};

export function ExportJsonButton({ disabled = false, onExport }: ExportJsonButtonProps) {
  return (
    <button
      type="button"
      className="btn-export"
      disabled={disabled}
      onClick={onExport}
    >
      Export JSON
    </button>
  );
}
