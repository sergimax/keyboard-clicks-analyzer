import type { StatsFile } from "@shared/types";

export type StatsResponse = {
  live: boolean;
  stats: StatsFile;
};

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`/api/stats?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load stats (${res.status})`);
  }
  return (await res.json()) as StatsResponse;
}

export async function resetStats(): Promise<void> {
  const res = await fetch("/api/reset", { method: "POST", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Reset failed (${res.status})`);
  }
}
