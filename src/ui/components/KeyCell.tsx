import type { HeatKey } from "@shared/heat";
import { heatKeyStyle } from "@shared/heat";

type KeyCellProps = {
  heatKey: HeatKey;
};

export function KeyCell({ heatKey }: KeyCellProps) {
  const style = heatKeyStyle(heatKey.intensity);
  const isNumpad = heatKey.col >= 21;
  const count = heatKey.count > 0 ? String(heatKey.count) : "";

  return (
    <div
      className={`key${isNumpad ? " key-numpad" : ""}`}
      title={`${heatKey.label} (${heatKey.id}): ${heatKey.count}`}
      style={{
        gridRow: heatKey.row,
        gridColumn: `${heatKey.col} / span ${heatKey.span}`,
        background: style.background,
        borderColor: style.borderColor,
        color: style.labelColor,
        textShadow: style.textShadow,
      }}
    >
      <span className="lbl">{heatKey.label}</span>
      <span className="cnt" style={{ color: style.countColor }}>
        {count}
      </span>
    </div>
  );
}
