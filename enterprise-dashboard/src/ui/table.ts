/**
 * Unicode-Safe Table Utilities (Bun 1.3.6+)
 *
 * Uses Bun.stringWidth() for accurate terminal column measurement.
 * Handles CJK characters, emoji, and ANSI escape sequences correctly.
 */

// ============================================================================
// Core Truncation
// ============================================================================

/**
 * Truncate text to fit within a maximum column width.
 * Unicode-aware: handles emoji (2 cols), CJK (2 cols), combining marks (0 cols).
 */
export function safeTruncate(text: string, maxCols: number, ellipsis = "…"): string {
  const textWidth = Bun.stringWidth(text);
  if (textWidth <= maxCols) return text;

  const ellipsisWidth = Bun.stringWidth(ellipsis);
  const targetWidth = maxCols - ellipsisWidth;

  if (targetWidth <= 0) return ellipsis.slice(0, maxCols);

  let result = "";
  let currentWidth = 0;

  for (const char of text) {
    const charWidth = Bun.stringWidth(char);
    if (currentWidth + charWidth > targetWidth) break;
    result += char;
    currentWidth += charWidth;
  }

  return result + ellipsis;
}

/**
 * Truncate from the middle, preserving start and end.
 * Useful for file paths: "/Users/.../file.ts"
 */
export function middleTruncate(text: string, maxCols: number, ellipsis = "…"): string {
  const textWidth = Bun.stringWidth(text);
  if (textWidth <= maxCols) return text;

  const ellipsisWidth = Bun.stringWidth(ellipsis);
  const availableWidth = maxCols - ellipsisWidth;
  if (availableWidth <= 0) return ellipsis.slice(0, maxCols);

  const startWidth = Math.ceil(availableWidth / 2);
  const endWidth = Math.floor(availableWidth / 2);

  let start = "";
  let startCols = 0;
  for (const char of text) {
    const w = Bun.stringWidth(char);
    if (startCols + w > startWidth) break;
    start += char;
    startCols += w;
  }

  let end = "";
  let endCols = 0;
  const chars = [...text].reverse();
  for (const char of chars) {
    const w = Bun.stringWidth(char);
    if (endCols + w > endWidth) break;
    end = char + end;
    endCols += w;
  }

  return start + ellipsis + end;
}

// ============================================================================
// Table Column Definitions
// ============================================================================

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  width: number;
  align?: "left" | "right" | "center";
  format?: (value: T[keyof T], row: T) => string;
}

/**
 * Format data for Bun.inspect.table with proper column widths.
 */
export function formatTableData<T extends Record<string, unknown>>(
  data: T[],
  columns: TableColumn<T>[]
): Record<string, string>[] {
  return data.map((row) => {
    const formatted: Record<string, string> = {};
    for (const col of columns) {
      const value = row[col.key];
      const text = col.format ? col.format(value, row) : String(value ?? "—");
      formatted[col.header] = safeTruncate(text, col.width);
    }
    return formatted;
  });
}

/**
 * Render a formatted table to console.
 */
export function renderTable<T extends Record<string, unknown>>(
  data: T[],
  columns: TableColumn<T>[],
  options: { colors?: boolean } = {}
): void {
  const formatted = formatTableData(data, columns);
  const headers = columns.map((c) => c.header);
  console.log(Bun.inspect.table(formatted, headers, { colors: options.colors ?? true }));
}

// ============================================================================
// Formatting Helpers
// ============================================================================

export function formatPath(path: string, maxCols: number): string {
  return middleTruncate(path, maxCols);
}

export function formatUrl(url: string, maxCols: number): string {
  return middleTruncate(url.replace(/^https?:\/\//, ""), maxCols);
}

const STATUS_ICONS: Record<string, string> = {
  success: "✓", error: "✗", warning: "⚠", pending: "○", running: "◉", stopped: "◯",
};

export function formatStatus(status: string): string {
  const icon = STATUS_ICONS[status.toLowerCase()] ?? "•";
  return `${icon} ${status}`;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${["B", "KB", "MB", "GB", "TB"][i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
