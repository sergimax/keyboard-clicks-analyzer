import type { ReactNode } from "react";
import type { RankItem } from "@shared/heat";
import type { ModifierPairItem } from "@shared/modifiers";
import type { SelfRepeatItem, TransitionItem } from "@shared/transitions";
import type { RankVisibility } from "../rank-visibility";
import { RankBlock } from "./RankBlock";

export type RankPeriod = {
  title: string;
  periodLabel: string;
  top: RankItem[];
  topPairs: TransitionItem[];
  selfRepeats: SelfRepeatItem[];
  modifierPairs: ModifierPairItem[];
  totalPresses: number;
  totalRecordingMs: number;
  emptyMessage?: string;
};

type RankRowProps = {
  periods: RankPeriod[];
  visibility: RankVisibility;
  leading?: ReactNode;
};

export function RankRow({ periods, visibility, leading }: RankRowProps) {
  return (
    <div className="rank-row">
      {leading}
      {periods.map((period) => (
        <RankBlock key={period.title} {...period} visibility={visibility} />
      ))}
    </div>
  );
}
