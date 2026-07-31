import type { HeatKey, HeatScaleMode } from "@shared/heat";
import { KeyCell } from "./KeyCell";

type KeyboardBoardProps = {
  keys: HeatKey[];
  scaleMode: HeatScaleMode;
};

export function KeyboardBoard({ keys, scaleMode }: KeyboardBoardProps) {
  return (
    <div className="board-wrap">
      <div className="board">
        {keys.map((heatKey) => (
          <KeyCell key={heatKey.id} heatKey={heatKey} scaleMode={scaleMode} />
        ))}
      </div>
    </div>
  );
}
