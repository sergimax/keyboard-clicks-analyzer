import fs from "node:fs";
import { allMappedKeys, canonicalKey, lookupKey } from "./keymap.ts";
import {
  dayRangeMs,
  formatDuration,
  heatmapPath,
  keysForDateKeys,
  loadStats,
  localDateKey,
  pressesForDateKeys,
  recordingMsInRange,
  saveStats,
  templatePath,
  weekRangeMs,
  type KeyCount,
  type StatsFile,
} from "./store.ts";

export type HeatKey = {
  id: string;
  label: string;
  row: number;
  col: number;
  span: number;
  count: number;
  intensity: number;
};

export type RenderOptions = {
  live?: boolean;
  /** Body fragment only (for live polling). */
  partial?: boolean;
};

type RankItem = { id: string; label: string; count: number };

function intensityFor(count: number, max: number): number {
  if (max <= 0 || count <= 0) return 0;
  return Math.sqrt(count / max);
}

function colorFor(intensity: number): string {
  if (intensity <= 0) return "#252b36";
  const cold = [31, 111, 91];
  const mid = [244, 162, 97];
  const hot = [232, 93, 4];
  const t = Math.min(1, Math.max(0, intensity));
  const from = t < 0.5 ? cold : mid;
  const to = t < 0.5 ? mid : hot;
  const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const rgb = from.map((c, i) => Math.round(c + (to[i]! - c) * u));
  return `rgb(${rgb.join(",")})`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildHeatKeys(stats: StatsFile): HeatKey[] {
  const counts = new Map<string, number>();
  for (const entry of Object.values(stats.keys)) {
    const { id } = canonicalKey(entry.sc, entry.ext);
    counts.set(id, (counts.get(id) ?? 0) + entry.count);
  }

  const max = Math.max(0, ...counts.values(), 0);
  const known = new Set(allMappedKeys().map((k) => k.id));

  const keys: HeatKey[] = allMappedKeys().map(({ id, meta }) => {
    const count = counts.get(id) ?? 0;
    return {
      id,
      label: meta.label,
      row: meta.row,
      col: meta.col,
      span: meta.span ?? 1,
      count,
      intensity: intensityFor(count, max),
    };
  });

  for (const [id, count] of counts) {
    if (known.has(id)) continue;
    const [sc, ext] = id.split(":").map(Number);
    const meta = lookupKey(sc!, ext!);
    keys.push({
      id,
      label: meta.label,
      row: 0,
      col: 0,
      span: 1,
      count,
      intensity: intensityFor(count, max),
    });
  }

  return keys;
}

export function topKeysFromMap(
  keyMap: Record<string, KeyCount>,
  limit = 30,
): RankItem[] {
  const merged = new Map<string, RankItem>();
  for (const entry of Object.values(keyMap)) {
    const canon = canonicalKey(entry.sc, entry.ext);
    const meta = lookupKey(canon.sc, canon.ext);
    const prev = merged.get(canon.id);
    if (prev) {
      prev.count += entry.count;
    } else {
      merged.set(canon.id, { id: canon.id, label: meta.label, count: entry.count });
    }
  }
  return [...merged.values()]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function topKeys(stats: StatsFile, limit = 30): RankItem[] {
  return topKeysFromMap(stats.keys, limit);
}

function renderMeta(options: {
  updatedAt: string;
  totalPresses: number;
  maxCount: number;
  live: boolean;
  totalRecordingMs: number;
  sessionCount: number;
}): string {
  const {
    updatedAt,
    totalPresses,
    maxCount,
    live,
    totalRecordingMs,
    sessionCount,
  } = options;
  const liveBadge = live ? `<span class="live-badge">LIVE</span>` : "";
  const resetBtn = live
    ? `<button type="button" id="reset-btn" class="btn-reset">Reset stats</button>`
    : "";
  const timing = [
    `<span>Total recorded: <strong>${escapeHtml(formatDuration(totalRecordingMs))}</strong></span>`,
    `<span>Saved intervals: <strong>${sessionCount}</strong></span>`,
  ].join("");

  return [
    `<div class="meta-main">`,
    liveBadge,
    `<span>Updated: <strong>${escapeHtml(updatedAt || "—")}</strong></span>`,
    `<span>Total presses: <strong>${totalPresses}</strong></span>`,
    `<span>Hottest key: <strong>${maxCount}</strong></span>`,
    timing,
    `</div>`,
    resetBtn,
  ].join("");
}

function renderSessions(stats: StatsFile): string {
  const sessions = stats.sessions ?? [];
  if (sessions.length === 0) {
    return `<div><h2>Recording intervals</h2><p class="side-empty">No completed intervals yet.</p></div>`;
  }
  const items = [...sessions]
    .reverse()
    .slice(0, 20)
    .map((s, indexFromEnd) => {
      const n = sessions.length - indexFromEnd;
      return `<li>#${n} — ${escapeHtml(formatDuration(s.durationMs))}</li>`;
    })
    .join("");
  const more =
    sessions.length > 20
      ? `<p class="side-empty">Showing latest 20 of ${sessions.length}.</p>`
      : "";
  return `<div><h2>Recording intervals</h2><ol>${items}</ol>${more}</div>`;
}

function renderBoard(keys: HeatKey[]): string {
  return keys
    .map((key) => {
      const bg = colorFor(key.intensity);
      const border = key.intensity > 0.55 ? "#5a4030" : "#343c4a";
      const count = key.count > 0 ? String(key.count) : "";
      const title = escapeHtml(`${key.label} (${key.id}): ${key.count}`);
      const numpadClass = key.col >= 21 ? " key-numpad" : "";
      return [
        `<div class="key${numpadClass}" title="${title}" style="grid-row:${key.row};grid-column:${key.col} / span ${key.span};background:${bg};border-color:${border}">`,
        `<span class="lbl">${escapeHtml(key.label)}</span>`,
        `<span class="cnt">${escapeHtml(count)}</span>`,
        `</div>`,
      ].join("");
    })
    .join("");
}

function renderTop(top: RankItem[], emptyMessage = "No data yet."): string {
  if (top.length === 0) {
    return `<li>${escapeHtml(emptyMessage)}</li>`;
  }
  return top
    .map((item) => `<li>${escapeHtml(item.label)} — ${item.count}</li>`)
    .join("");
}

function renderUnmapped(unmapped: HeatKey[]): string {
  if (unmapped.length === 0) return "";
  const items = [...unmapped]
    .sort((a, b) => b.count - a.count)
    .map((item) => `<li>${escapeHtml(item.label)} — ${item.count}</li>`)
    .join("");
  return `<div><h2>Unmapped codes</h2><ol>${items}</ol></div>`;
}

function renderRankBlock(options: {
  title: string;
  listId: string;
  periodLabel: string;
  top: RankItem[];
  totalPresses: number;
  totalRecordingMs: number;
  emptyMessage?: string;
}): string {
  const {
    title,
    listId,
    periodLabel,
    top,
    totalPresses,
    totalRecordingMs,
    emptyMessage,
  } = options;
  const recorded = formatDuration(totalRecordingMs);
  const empty =
    top.length === 0 && totalPresses === 0 && totalRecordingMs === 0;
  return [
    `<section class="rank-block">`,
    `<div class="side-heading">`,
    `<h2>${escapeHtml(title)}</h2>`,
    `<p class="rank-summary">`,
    `<span>Presses: <strong>${totalPresses}</strong></span>`,
    `<span>Recorded: <strong>${escapeHtml(recorded)}</strong></span>`,
    `</p>`,
    `<button type="button" class="btn-copy"`,
    ` data-copy-list="${escapeHtml(listId)}"`,
    ` data-period-label="${escapeHtml(periodLabel)}"`,
    ` data-total-presses="${totalPresses}"`,
    ` data-total-recorded="${escapeHtml(recorded)}"`,
    empty ? ` disabled` : ``,
    `>Copy</button>`,
    `</div>`,
    `<ol id="${escapeHtml(listId)}">${renderTop(top, emptyMessage)}</ol>`,
    `</section>`,
  ].join("");
}

function renderBodyInner(stats: StatsFile, live: boolean): string {
  const heatKeys = buildHeatKeys(stats);
  const topAll = topKeys(stats);
  const todayKey = localDateKey();
  const day = dayRangeMs(todayKey);
  const week = weekRangeMs(todayKey);
  const topDay = topKeysFromMap(keysForDateKeys(stats, [todayKey]));
  const topWeek = topKeysFromMap(keysForDateKeys(stats, week.dateKeys));
  const pressesDay = pressesForDateKeys(stats, [todayKey]);
  const pressesWeek = pressesForDateKeys(stats, week.dateKeys);
  const recordedDay = recordingMsInRange(stats, day.startMs, day.endMs);
  const recordedWeek = recordingMsInRange(stats, week.startMs, week.endMs);
  const max = Math.max(0, ...Object.values(stats.keys).map((k) => k.count), 0);
  const mapped = heatKeys.filter((k) => k.row > 0);
  const unmapped = heatKeys.filter((k) => k.row === 0 && k.count > 0);
  // Browser shows completed recording only; live session clock is console-only.
  const totalPresses = stats.totalPresses;
  const totalRecordingMs = stats.recordingMs ?? 0;
  const hasDaily = Object.keys(stats.daily ?? {}).length > 0;
  const periodEmptyHint = hasDaily
    ? "No presses in this period yet."
    : "No day buckets yet — restart collect to start tracking today/week.";
  const note = live
    ? "Live view updates about once per second from the local collector (127.0.0.1 only). Current session time is shown in the collect terminal. Day/week key counts update live; recorded time for periods uses completed intervals only."
    : "Intensity uses a square-root scale so secondary keys remain readable. Auto-repeat while holding a key is ignored (one count per press). Day/week rankings use local calendar days (week = last 7 days).";

  return [
    `<div class="meta">${renderMeta({
      updatedAt: stats.updatedAt,
      totalPresses,
      maxCount: max,
      live,
      totalRecordingMs,
      sessionCount: stats.sessions?.length ?? 0,
    })}</div>`,
    `<div class="layout">`,
    `<div class="main-col">`,
    `<div class="board-wrap"><div class="board">${renderBoard(mapped)}</div></div>`,
    `<div class="legend"><span>cold</span><div class="swatch"></div><span>hot</span></div>`,
    `<p class="note">${note}</p>`,
    `<div class="rank-row">`,
    renderRankBlock({
      title: "All time",
      listId: "top-list-all",
      periodLabel: "All time",
      top: topAll,
      totalPresses,
      totalRecordingMs,
      emptyMessage: "No data yet. Run npm run collect.",
    }),
    renderRankBlock({
      title: "Today",
      listId: "top-list-day",
      periodLabel: `Today (${todayKey})`,
      top: topDay,
      totalPresses: pressesDay,
      totalRecordingMs: recordedDay,
      emptyMessage: periodEmptyHint,
    }),
    renderRankBlock({
      title: "Last 7 days",
      listId: "top-list-week",
      periodLabel: `Last 7 days (${week.dateKeys[0]} – ${todayKey})`,
      top: topWeek,
      totalPresses: pressesWeek,
      totalRecordingMs: recordedWeek,
      emptyMessage: periodEmptyHint,
    }),
    `</div>`,
    `</div>`,
    `<aside class="side">`,
    renderUnmapped(unmapped),
    renderSessions(stats),
    `</aside>`,
    `</div>`,
  ].join("");
}

export function renderHeatmapHtml(stats: StatsFile, options: RenderOptions = {}): string {
  const live = options.live === true;
  const partial = options.partial === true;
  const inner = renderBodyInner(stats, live);

  if (partial) {
    return inner;
  }

  const template = fs.readFileSync(templatePath, "utf8");
  return template
    .replace(/__LIVE_HEAD__/g, () => (live ? liveHeadSnippet() : ""))
    .replace(/__PAGE_SCRIPT__/g, () => pageScriptSnippet())
    .replace(/__BODY__/g, () => inner);
}

function pageScriptSnippet(): string {
  return `
    <script>
      (function () {
        var NUMPAD_KEY = "kca-show-numpad";

        function initNumpadToggle() {
          var numpadToggle = document.getElementById("toggle-numpad");
          if (!numpadToggle) return;

          function applyNumpadVisibility() {
            var show = numpadToggle.checked;
            document.body.classList.toggle("hide-numpad", !show);
            try {
              localStorage.setItem(NUMPAD_KEY, show ? "1" : "0");
            } catch (_) {}
          }

          try {
            if (localStorage.getItem(NUMPAD_KEY) === "0") {
              numpadToggle.checked = false;
            }
          } catch (_) {}
          applyNumpadVisibility();
          numpadToggle.addEventListener("change", applyNumpadVisibility);
        }

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", initNumpadToggle);
        } else {
          initNumpadToggle();
        }

        document.addEventListener("click", async function (event) {
          const btn = event.target && event.target.closest && event.target.closest(".btn-copy");
          if (!btn) return;
          var listId = btn.getAttribute("data-copy-list");
          if (!listId) return;
          const list = document.getElementById(listId);
          const lines = list
            ? Array.prototype.map
                .call(list.querySelectorAll("li"), function (li, index) {
                  var text = (li.textContent || "").trim();
                  if (!text || text.indexOf("No data yet") === 0 || text.indexOf("No presses in this period") === 0 || text.indexOf("No day buckets yet") === 0) return null;
                  return index + 1 + ". " + text;
                })
                .filter(Boolean)
            : [];
          var periodLabel = btn.getAttribute("data-period-label") || "Stats";
          var totalPresses = btn.getAttribute("data-total-presses") || "0";
          var totalRecorded = btn.getAttribute("data-total-recorded") || "00:00";
          var summary = [
            periodLabel,
            "Total presses: " + totalPresses,
            "Total recorded: " + totalRecorded,
          ];
          var payload = summary.concat(lines.length ? [""].concat(lines) : []);
          if (!lines.length && totalPresses === "0" && (totalRecorded === "00:00" || totalRecorded === "0:00:00")) {
            alert("Nothing to copy yet.");
            return;
          }
          var previous = btn.textContent;
          btn.disabled = true;
          try {
            await navigator.clipboard.writeText(payload.join("\\n"));
            btn.textContent = "Copied";
            setTimeout(function () {
              btn.textContent = previous;
              btn.disabled = false;
            }, 1200);
          } catch (_) {
            btn.disabled = false;
            alert("Could not copy to clipboard.");
          }
        });
      })();
    </script>
  `;
}

function liveHeadSnippet(): string {
  return `
    <script>
      (function () {
        async function tick() {
          try {
            const res = await fetch("/partial?t=" + Date.now(), { cache: "no-store" });
            if (!res.ok) return;
            const html = await res.text();
            const root = document.getElementById("live-root");
            if (root) root.innerHTML = html;
          } catch (_) {}
        }
        setInterval(tick, 1000);

        document.addEventListener("click", async function (event) {
          const btn = event.target && event.target.closest && event.target.closest("#reset-btn");
          if (!btn) return;
          if (!confirm("Reset all accumulated key stats and recording timers? This cannot be undone.")) return;
          btn.disabled = true;
          try {
            const res = await fetch("/reset", { method: "POST", cache: "no-store" });
            if (!res.ok) throw new Error("reset failed");
            await tick();
          } catch (_) {
            alert("Could not reset stats. Is collect still running?");
          } finally {
            btn.disabled = false;
          }
        });
      })();
    </script>
  `;
}

export function generateHeatmap(stats?: StatsFile): string {
  const data = stats ?? loadStats();
  saveStats(data);
  const html = renderHeatmapHtml(data, { live: false });
  fs.writeFileSync(heatmapPath, html, "utf8");
  return heatmapPath;
}
