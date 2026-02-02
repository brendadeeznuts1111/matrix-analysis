// lib/log.ts - Lightweight structured logger
// ═══════════════════════════════════════════════════════════════════════════════
// Replaces raw console.log across 30+ files with level-filtered,
// timestamped, NO_COLOR-aware output. Uses lib/color.ts for styling.
// ═══════════════════════════════════════════════════════════════════════════════

import { shouldColor, hasNoColor } from "./env.ts";

// ─────────────────────────────────────────────────────────────────────────────
// BN-085: Log Levels
// ─────────────────────────────────────────────────────────────────────────────
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

const LEVEL_LABEL: Record<Exclude<LogLevel, "silent">, string> = {
  debug: "DBG",
  info: "INF",
  warn: "WRN",
  error: "ERR",
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-086: Color & Timestamp Helpers
// ─────────────────────────────────────────────────────────────────────────────
const _color = shouldColor();
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

const LEVEL_COLORS: Record<Exclude<LogLevel, "silent">, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

const colorWrap = (text: string, code: string): string =>
  _color ? `${code}${text}${RESET}` : text;

const timestamp = (): string => {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-087: Logger Instance
// ─────────────────────────────────────────────────────────────────────────────
export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamps?: boolean;
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  setLevel: (level: LogLevel) => void;
  child: (prefix: string) => Logger;
}

export const createLogger = (options?: LoggerOptions): Logger => {
  let currentLevel = LEVEL_ORDER[options?.level ?? "info"];
  const prefix = options?.prefix ?? "";
  const showTime = options?.timestamps ?? true;

  const emit = (level: Exclude<LogLevel, "silent">, args: unknown[]) => {
    if (LEVEL_ORDER[level] < currentLevel) return;

    const parts: string[] = [];
    if (showTime) parts.push(colorWrap(timestamp(), DIM));
    parts.push(colorWrap(LEVEL_LABEL[level], LEVEL_COLORS[level]));
    if (prefix) parts.push(colorWrap(`[${prefix}]`, DIM));

    const out = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    out(parts.join(" "), ...args);
  };

  const logger: Logger = {
    debug: (...args) => emit("debug", args),
    info: (...args) => emit("info", args),
    warn: (...args) => emit("warn", args),
    error: (...args) => emit("error", args),
    setLevel: (level) => { currentLevel = LEVEL_ORDER[level]; },
    child: (childPrefix) => createLogger({
      level: Object.entries(LEVEL_ORDER).find(([, v]) => v === currentLevel)?.[0] as LogLevel ?? "info",
      prefix: prefix ? `${prefix}:${childPrefix}` : childPrefix,
      timestamps: showTime,
    }),
  };

  return logger;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-088: Default Logger & Convenience Exports
// ─────────────────────────────────────────────────────────────────────────────
const _default = createLogger({
  level: hasNoColor() ? "info" : "debug",
});

export const debug = _default.debug;
export const info = _default.info;
export const warn = _default.warn;
export const error = _default.error;
export const setLevel = _default.setLevel;

// ─────────────────────────────────────────────────────────────────────────────
// BN-089: Structured Logging Helpers
// ─────────────────────────────────────────────────────────────────────────────
export const measure = async <T>(
  label: string,
  fn: () => Promise<T>,
  logger: Logger = _default
): Promise<T> => {
  const t0 = Bun.nanoseconds();
  try {
    const result = await fn();
    const ms = (Bun.nanoseconds() - t0) / 1e6;
    logger.info(`${label}`, colorWrap(`${ms.toFixed(2)}ms`, DIM));
    return result;
  } catch (err) {
    const ms = (Bun.nanoseconds() - t0) / 1e6;
    logger.error(`${label} failed`, colorWrap(`${ms.toFixed(2)}ms`, DIM), err);
    throw err;
  }
};

export const measureSafe = async <T>(
  label: string,
  fn: () => Promise<T>,
  logger?: Logger
): Promise<T | null> =>
  measure(label, fn, logger).catch(() => null);
