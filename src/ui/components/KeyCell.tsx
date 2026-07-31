import {
  formatSharePercent,
  heatKeyStyle,
  type HeatKey,
  type HeatScaleMode,
} from "@shared/heat";

type KeyCellProps = {
  heatKey: HeatKey;
  scaleMode: HeatScaleMode;
};

export function KeyCell({ heatKey, scaleMode }: KeyCellProps) {
  const style = heatKeyStyle(heatKey.intensity);
  const isNumpad = heatKey.col >= 21;
  const caption =
    heatKey.count <= 0
      ? ""
      : scaleMode === "relative"
        ? formatSharePercent(heatKey.share)
        : String(heatKey.count);
  const shareText =
    heatKey.count > 0 ? ` · ${formatSharePercent(heatKey.share)} of presses` : "";
  const titleRepeats =
    heatKey.repeatCount > 0
      ? ` · ${heatKey.repeatCount} hold-repeats (OS auto-repeat while held;` +
        ` not wear — useful for games/navigation hold patterns)`
      : "";
  const title =
    `${heatKey.label} (${heatKey.id}): ${heatKey.count} physical presses` +
    shareText +
    titleRepeats;

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
        {caption}
      </span>
    </div>
  );
}
