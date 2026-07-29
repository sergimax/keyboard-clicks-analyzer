/** Minimal ANSI styling (no deps). Respects NO_COLOR and non-TTY stderr. */

const enabled =
  process.env.NO_COLOR == null &&
  process.env.FORCE_COLOR !== "0" &&
  (process.stderr.isTTY || process.env.FORCE_COLOR === "1");

const wrap =
  (open: string, close = "\u001b[0m") =>
  (text: string): string =>
    enabled ? `${open}${text}${close}` : text;

export const green = wrap("\u001b[32m");
export const greenBright = wrap("\u001b[92m");
export const dim = wrap("\u001b[2m");
export const bold = wrap("\u001b[1m");
export const red = wrap("\u001b[31m");

export function ok(message: string): string {
  return `${greenBright("✔")} ${green(message)}`;
}

export function info(message: string): string {
  return `${dim("·")} ${message}`;
}
