/** Local calendar date key YYYY-MM-DD. */
export function localDateKey(atMs: number = Date.now()): string {
  const date = new Date(atMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Start of local calendar day (ms) for a YYYY-MM-DD key. */
export function localDayStartMs(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year!, month! - 1, day!, 0, 0, 0, 0).getTime();
}

/** Inclusive rolling window of local date keys ending at `endKey` (default today). */
export function rollingDateKeys(
  dayCount: number,
  endKey: string = localDateKey(),
): string[] {
  const [year, month, day] = endKey.split("-").map(Number);
  const cursor = new Date(year!, month! - 1, day!, 12, 0, 0, 0);
  const keys: string[] = [];
  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() - offset);
    keys.push(localDateKey(date.getTime()));
  }
  return keys;
}

export function dayRangeMs(dateKey: string = localDateKey()): {
  startMs: number;
  endMs: number;
} {
  const startMs = localDayStartMs(dateKey);
  return { startMs, endMs: startMs + 86_400_000 };
}

export function weekRangeMs(endKey: string = localDateKey()): {
  startMs: number;
  endMs: number;
  dateKeys: string[];
} {
  const dateKeys = rollingDateKeys(7, endKey);
  const startMs = localDayStartMs(dateKeys[0]!);
  const { endMs } = dayRangeMs(endKey);
  return { startMs, endMs, dateKeys };
}
