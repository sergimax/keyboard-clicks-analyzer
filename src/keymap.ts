/** Physical key map: Windows scan code + extended flag → label and heatmap grid cell. */

export type KeyMeta = {
  label: string;
  /** CSS grid row (1-based), top = 1 (Esc row). */
  row: number;
  /** CSS grid column start (1-based). */
  col: number;
  /** Column span (default 1). */
  span?: number;
};

/** Set 1 scan codes (non-extended unless noted). */
const MAP: Record<string, KeyMeta> = {
  // Row 1 — function
  "1:0": { label: "Esc", row: 1, col: 1 },
  "59:0": { label: "F1", row: 1, col: 3 },
  "60:0": { label: "F2", row: 1, col: 4 },
  "61:0": { label: "F3", row: 1, col: 5 },
  "62:0": { label: "F4", row: 1, col: 6 },
  "63:0": { label: "F5", row: 1, col: 8 },
  "64:0": { label: "F6", row: 1, col: 9 },
  "65:0": { label: "F7", row: 1, col: 10 },
  "66:0": { label: "F8", row: 1, col: 11 },
  "67:0": { label: "F9", row: 1, col: 13 },
  "68:0": { label: "F10", row: 1, col: 14 },
  "87:0": { label: "F11", row: 1, col: 15 },
  "88:0": { label: "F12", row: 1, col: 16 },

  // Row 2 — digits
  "41:0": { label: "`", row: 2, col: 1 },
  "2:0": { label: "1", row: 2, col: 2 },
  "3:0": { label: "2", row: 2, col: 3 },
  "4:0": { label: "3", row: 2, col: 4 },
  "5:0": { label: "4", row: 2, col: 5 },
  "6:0": { label: "5", row: 2, col: 6 },
  "7:0": { label: "6", row: 2, col: 7 },
  "8:0": { label: "7", row: 2, col: 8 },
  "9:0": { label: "8", row: 2, col: 9 },
  "10:0": { label: "9", row: 2, col: 10 },
  "11:0": { label: "0", row: 2, col: 11 },
  "12:0": { label: "-", row: 2, col: 12 },
  "13:0": { label: "=", row: 2, col: 13 },
  "14:0": { label: "Bksp", row: 2, col: 14, span: 2 },

  // Row 3 — QWERTY
  "15:0": { label: "Tab", row: 3, col: 1, span: 2 },
  "16:0": { label: "Q", row: 3, col: 3 },
  "17:0": { label: "W", row: 3, col: 4 },
  "18:0": { label: "E", row: 3, col: 5 },
  "19:0": { label: "R", row: 3, col: 6 },
  "20:0": { label: "T", row: 3, col: 7 },
  "21:0": { label: "Y", row: 3, col: 8 },
  "22:0": { label: "U", row: 3, col: 9 },
  "23:0": { label: "I", row: 3, col: 10 },
  "24:0": { label: "O", row: 3, col: 11 },
  "25:0": { label: "P", row: 3, col: 12 },
  "26:0": { label: "[", row: 3, col: 13 },
  "27:0": { label: "]", row: 3, col: 14 },
  "43:0": { label: "\\", row: 3, col: 15 },

  // Row 4 — ASDF
  "58:0": { label: "Caps", row: 4, col: 1, span: 2 },
  "30:0": { label: "A", row: 4, col: 3 },
  "31:0": { label: "S", row: 4, col: 4 },
  "32:0": { label: "D", row: 4, col: 5 },
  "33:0": { label: "F", row: 4, col: 6 },
  "34:0": { label: "G", row: 4, col: 7 },
  "35:0": { label: "H", row: 4, col: 8 },
  "36:0": { label: "J", row: 4, col: 9 },
  "37:0": { label: "K", row: 4, col: 10 },
  "38:0": { label: "L", row: 4, col: 11 },
  "39:0": { label: ";", row: 4, col: 12 },
  "40:0": { label: "'", row: 4, col: 13 },
  "28:0": { label: "Enter", row: 4, col: 14, span: 2 },

  // Row 5 — ZXCV
  "42:0": { label: "LShift", row: 5, col: 1, span: 2 },
  "44:0": { label: "Z", row: 5, col: 3 },
  "45:0": { label: "X", row: 5, col: 4 },
  "46:0": { label: "C", row: 5, col: 5 },
  "47:0": { label: "V", row: 5, col: 6 },
  "48:0": { label: "B", row: 5, col: 7 },
  "49:0": { label: "N", row: 5, col: 8 },
  "50:0": { label: "M", row: 5, col: 9 },
  "51:0": { label: ",", row: 5, col: 10 },
  "52:0": { label: ".", row: 5, col: 11 },
  "53:0": { label: "/", row: 5, col: 12 },
  "54:0": { label: "RShift", row: 5, col: 13, span: 3 },

  // Row 6 — modifiers / space / arrows cluster starts at col 17 in template
  "29:0": { label: "LCtrl", row: 6, col: 1, span: 2 },
  "91:1": { label: "LWin", row: 6, col: 3 },
  "56:0": { label: "LAlt", row: 6, col: 4 },
  "57:0": { label: "Space", row: 6, col: 5, span: 6 },
  "56:1": { label: "RAlt", row: 6, col: 11 },
  "92:1": { label: "RWin", row: 6, col: 12 },
  "93:1": { label: "Menu", row: 6, col: 13 },
  "29:1": { label: "RCtrl", row: 6, col: 14, span: 2 },

  // Navigation cluster (placed to the right of main block in template via row/col)
  "70:0": { label: "ScrLk", row: 1, col: 18 },
  "55:1": { label: "PrtSc", row: 1, col: 17 },

  "82:1": { label: "Ins", row: 2, col: 17 },
  "71:1": { label: "Home", row: 2, col: 18 },
  "73:1": { label: "PgUp", row: 2, col: 19 },
  "83:1": { label: "Del", row: 3, col: 17 },
  "79:1": { label: "End", row: 3, col: 18 },
  "81:1": { label: "PgDn", row: 3, col: 19 },

  "72:1": { label: "Up", row: 5, col: 18 },
  "75:1": { label: "Left", row: 6, col: 17 },
  "80:1": { label: "Down", row: 6, col: 18 },
  "77:1": { label: "Right", row: 6, col: 19 },

  // Numpad (Num Lock is scan 69, non-extended)
  "69:0": { label: "Num", row: 2, col: 21 },
  "53:1": { label: "N/", row: 2, col: 22 },
  "55:0": { label: "N*", row: 2, col: 23 },
  "74:0": { label: "N-", row: 2, col: 24 },
  "71:0": { label: "N7", row: 3, col: 21 },
  "72:0": { label: "N8", row: 3, col: 22 },
  "73:0": { label: "N9", row: 3, col: 23 },
  "78:0": { label: "N+", row: 3, col: 24, span: 1 },
  "75:0": { label: "N4", row: 4, col: 21 },
  "76:0": { label: "N5", row: 4, col: 22 },
  "77:0": { label: "N6", row: 4, col: 23 },
  "79:0": { label: "N1", row: 5, col: 21 },
  "80:0": { label: "N2", row: 5, col: 22 },
  "81:0": { label: "N3", row: 5, col: 23 },
  "28:1": { label: "NEnt", row: 5, col: 24 },
  "82:0": { label: "N0", row: 6, col: 21, span: 2 },
  "83:0": { label: "N.", row: 6, col: 23 },
};

export function lookupKey(sc: number, ext: number): KeyMeta {
  const id = `${sc}:${ext}`;
  return MAP[id] ?? { label: `sc${sc}${ext ? "e" : ""}`, row: 0, col: 0 };
}

export function allMappedKeys(): Array<{ id: string; meta: KeyMeta }> {
  return Object.entries(MAP).map(([id, meta]) => ({ id, meta }));
}
