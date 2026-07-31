import type { HeatScaleMode, RankItem } from "@shared/heat";

type HeatLegendProps = {
  mode: HeatScaleMode;
  hottest: RankItem | null;
};

export function HeatLegend({ mode, hottest }: HeatLegendProps) {
  const absolute = mode === "absolute";
  const left = absolute ? "0 presses" : "Least-used pressed key";
  const right = absolute
    ? hottest
      ? `${hottest.label} · ${hottest.count} (hottest)`
      : "Hottest key"
    : hottest
      ? `${hottest.label} · most used`
      : "Most-used key";
  const hint = absolute
    ? "Absolute: color scales with √(presses ÷ hottest). Good for switch wear."
    : "Relative: color by rank among keys you actually hit; captions show % of all presses so Space doesn’t wash out the board.";

  return (
    <div className="legend" title={hint}>
      <div className="legend-scale">
        <span className="legend-end">{left}</span>
        <div className="swatch" aria-hidden="true" />
        <span className="legend-end">{right}</span>
      </div>
      <p className="legend-hint">{hint}</p>
    </div>
  );
}
