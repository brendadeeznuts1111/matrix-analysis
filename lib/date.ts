// lib/date.ts - Date/time formatting and parsing
// ═══════════════════════════════════════════════════════════════════════════════
// Lightweight date utilities without external dependencies.
// Covers the 12+ codebase instances of manual Date formatting.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-080: Core Formatters
// ─────────────────────────────────────────────────────────────────────────────
const pad = (n: number, len = 2): string => String(n).padStart(len, "0");

export const formatDate = (d: Date | number = Date.now()): string => {
  const date = typeof d === "number" ? new Date(d) : d;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatTime = (d: Date | number = Date.now()): string => {
  const date = typeof d === "number" ? new Date(d) : d;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const formatDateTime = (d: Date | number = Date.now()): string =>
  `${formatDate(d)} ${formatTime(d)}`;

export const formatISO = (d: Date | number = Date.now()): string =>
  (typeof d === "number" ? new Date(d) : d).toISOString();

export const formatTimestamp = (d: Date | number = Date.now()): string =>
  formatISO(d).replace("T", " ").slice(0, 23);

// ─────────────────────────────────────────────────────────────────────────────
// BN-081: Duration Formatting
// ─────────────────────────────────────────────────────────────────────────────
export const formatMs = (ms: number): string => {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}\u00B5s`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(1);
  return `${mins}m ${secs}s`;
};

export const formatNs = (ns: number): string => {
  if (ns < 1000) return `${ns.toFixed(0)}ns`;
  return formatMs(ns / 1e6);
};

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return `${h}h ${m}m ${s}s`;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-082: Relative Time
// ─────────────────────────────────────────────────────────────────────────────
const UNITS: [number, string][] = [
  [31536000, "year"],
  [2592000, "month"],
  [604800, "week"],
  [86400, "day"],
  [3600, "hour"],
  [60, "minute"],
  [1, "second"],
];

export const formatRelative = (d: Date | number, base: Date | number = Date.now()): string => {
  const ms = (typeof base === "number" ? base : base.getTime())
    - (typeof d === "number" ? d : d.getTime());
  const seconds = Math.abs(Math.floor(ms / 1000));
  const future = ms < 0;

  if (seconds < 5) return "just now";

  for (const [threshold, unit] of UNITS) {
    const count = Math.floor(seconds / threshold);
    if (count >= 1) {
      const label = count === 1 ? unit : `${unit}s`;
      return future ? `in ${count} ${label}` : `${count} ${label} ago`;
    }
  }
  return "just now";
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-083: Parse & Validate
// ─────────────────────────────────────────────────────────────────────────────
export const parseTimestamp = (input: string): Date | null => {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const isValidDate = (d: Date): boolean =>
  d instanceof Date && !Number.isNaN(d.getTime());

export const toUnix = (d: Date | number = Date.now()): number =>
  Math.floor((typeof d === "number" ? d : d.getTime()) / 1000);

export const fromUnix = (seconds: number): Date =>
  new Date(seconds * 1000);

// ─────────────────────────────────────────────────────────────────────────────
// BN-084: Arithmetic & Comparison
// ─────────────────────────────────────────────────────────────────────────────
export const addMs = (d: Date, ms: number): Date =>
  new Date(d.getTime() + ms);

export const addSeconds = (d: Date, s: number): Date => addMs(d, s * 1000);
export const addMinutes = (d: Date, m: number): Date => addMs(d, m * 60000);
export const addHours = (d: Date, h: number): Date => addMs(d, h * 3600000);
export const addDays = (d: Date, days: number): Date => addMs(d, days * 86400000);

export const diffMs = (a: Date, b: Date): number =>
  a.getTime() - b.getTime();

export const isBefore = (a: Date, b: Date): boolean => a.getTime() < b.getTime();
export const isAfter = (a: Date, b: Date): boolean => a.getTime() > b.getTime();
export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const now = (): Date => new Date();
export const today = (): string => formatDate();
