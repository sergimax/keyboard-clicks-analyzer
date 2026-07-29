import type { RankItem } from "@shared/heat";
import type { TransitionItem } from "@shared/transitions";
import { RankBlock } from "./RankBlock";

export type RankPeriod = {
  title: string;
  periodLabel: string;
  top: RankItem[];
  transitions: TransitionItem[];
  totalPresses: number;
  totalRecordingMs: number;
  emptyMessage?: string;
};

type RankRowProps = {
  periods: RankPeriod[];
};

export function RankRow({ periods }: RankRowProps) {
  return (
    <div className="rank-row">
      {periods.map((period) => (
        <RankBlock key={period.title} {...period} />
      ))}
    </div>
  );
}
