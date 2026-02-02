// lib/str.ts - ANSI-aware string manipulation with Col-89 enforcement
// ═══════════════════════════════════════════════════════════════════════════════
// Uses Bun-native stringWidth, stripANSI, wrapAnsi, escapeHTML
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-025: ANSI Strip/Wrap/Width
// ─────────────────────────────────────────────────────────────────────────────
export const strip = (text: string): string =>
  Bun.stripANSI(text);

export const wrap = (text: string, cols: number = 89): string =>
  Bun.wrapAnsi(text, cols, { wordWrap: true, trim: true, hard: true });

export const width = (text: string): number =>
  Bun.stringWidth(text, { countAnsiEscapeCodes: false });

// ─────────────────────────────────────────────────────────────────────────────
// BN-026: Truncate (binary search on visual width)
// ─────────────────────────────────────────────────────────────────────────────
export const truncate = (
  str: string,
  maxWidth: number,
  ellipsis: string = "\u2026",
): string => {
  const w = Bun.stringWidth(str, { countAnsiEscapeCodes: false });
  if (w <= maxWidth) return str;
  const ellipsisWidth = Bun.stringWidth(ellipsis, { countAnsiEscapeCodes: false });
  const budget = maxWidth - ellipsisWidth;
  if (budget <= 0) return ellipsis.slice(0, maxWidth);
  let lo = 0;
  let hi = str.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (Bun.stringWidth(str.slice(0, mid), { countAnsiEscapeCodes: false }) <= budget) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return str.slice(0, lo) + ellipsis;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-027: Pad/Align
// ─────────────────────────────────────────────────────────────────────────────
export const padEnd = (
  str: string,
  targetWidth: number,
  fill: string = " ",
): string => {
  const w = Bun.stringWidth(str, { countAnsiEscapeCodes: false });
  if (w >= targetWidth) return str;
  const needed = targetWidth - w;
  return str + fill.repeat(needed);
};

export const padStart = (
  str: string,
  targetWidth: number,
  fill: string = " ",
): string => {
  const w = Bun.stringWidth(str, { countAnsiEscapeCodes: false });
  if (w >= targetWidth) return str;
  const needed = targetWidth - w;
  return fill.repeat(needed) + str;
};

export const center = (
  str: string,
  targetWidth: number,
  fill: string = " ",
): string => {
  const w = Bun.stringWidth(str, { countAnsiEscapeCodes: false });
  if (w >= targetWidth) return str;
  const total = targetWidth - w;
  const left = Math.floor(total / 2);
  const right = total - left;
  return fill.repeat(left) + str + fill.repeat(right);
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-028: Col-89 Guard
// ─────────────────────────────────────────────────────────────────────────────
export const COL_WIDTH = 89;

export const assertCol89 = (text: string, context?: string): boolean => {
  const w = Bun.stringWidth(text, { countAnsiEscapeCodes: false });
  if (w > COL_WIDTH) {
    console.warn(
      `[COL-89 VIOLATION] ${context ?? "unknown"} width=${w}`,
    );
    return false;
  }
  return true;
};

export const enforceCol89 = (text: string): string =>
  Bun.wrapAnsi(text, COL_WIDTH, { wordWrap: true, trim: true, hard: true });

// ─────────────────────────────────────────────────────────────────────────────
// BN-029: Escape
// ─────────────────────────────────────────────────────────────────────────────
export const escapeHtml = (input: string): string =>
  Bun.escapeHTML(input);

// ─────────────────────────────────────────────────────────────────────────────
// BN-029b: Newline Search (SIMD-accelerated)
// ─────────────────────────────────────────────────────────────────────────────
// Finds the byte offset of the next \n at or after `offset`.
// Binary data only (Uint8Array/ArrayBuffer). Returns -1 if not found.
export const indexOfLine = (
  data: Uint8Array | ArrayBuffer,
  offset?: number
): number =>
  Bun.indexOfLine(data, offset ?? 0);
