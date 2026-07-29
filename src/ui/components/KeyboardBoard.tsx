import type { HeatKey } from "@shared/heat";
import { KeyCell } from "./KeyCell";

type KeyboardBoardProps = {
  keys: HeatKey[];
};

export function KeyboardBoard({ keys }: KeyboardBoardProps) {
  return (
    <div className="board-wrap">
      <div className="board">
        {keys.map((heatKey) => (
          <KeyCell key={heatKey.id} heatKey={heatKey} />
        ))}
      </div>
    </div>
  );
}
