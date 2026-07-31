import type { HeatKey } from "@shared/heat";
import { heatKeyStyle } from "@shared/heat";

type KeyCellProps = {
  heatKey: HeatKey;
};

export function KeyCell({ heatKey }: KeyCellProps) {
  const style = heatKeyStyle(heatKey.intensity);
  const isNumpad = heatKey.col >= 21;
  const count = heatKey.count > 0 ? String(heatKey.count) : "";
  const title =
    heatKey.repeatCount > 0
      ? `${heatKey.label} (${heatKey.id}): ${heatKey.count} physical presses` +
        ` · ${heatKey.repeatCount} hold-repeats (OS auto-repeat while held;` +
        ` not wear — useful for games/navigation hold patterns)`
      : `${heatKey.label} (${heatKey.id}): ${heatKey.count}`;

  return (
    <div
      className={`key${isNumpad ? " key-numpad" : ""}`}
      title={title}
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
