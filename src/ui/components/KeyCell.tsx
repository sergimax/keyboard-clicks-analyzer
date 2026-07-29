import type { HeatKey } from "@shared/heat";
import { colorFor } from "@shared/heat";

type KeyCellProps = {
  heatKey: HeatKey;
};

export function KeyCell({ heatKey }: KeyCellProps) {
  const background = colorFor(heatKey.intensity);
  const borderColor = heatKey.intensity > 0.55 ? "#5a4030" : "#343c4a";
  const isNumpad = heatKey.col >= 21;
  const count = heatKey.count > 0 ? String(heatKey.count) : "";

  return (
    <div
      className={`key${isNumpad ? " key-numpad" : ""}`}
      title={`${heatKey.label} (${heatKey.id}): ${heatKey.count}`}
      style={{
        gridRow: heatKey.row,
        gridColumn: `${heatKey.col} / span ${heatKey.span}`,
        background,
        borderColor,
      }}
    >
      <span className="lbl">{heatKey.label}</span>
      <span className="cnt">{count}</span>
    </div>
  );
}
