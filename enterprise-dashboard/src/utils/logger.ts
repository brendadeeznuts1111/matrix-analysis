/**
 * Structured Logging Utility
 *
 * Replaces scattered console.log calls with a unified logging API that:
 * - Supports log levels (debug, info, warn, error)
 * - Uses compile-time feature flags for debug output
 * - Integrates with existing bracket-prefix convention
 * - Provides Bun.inspect.table() integration
 */

import { feature } from "bun:bundle";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_COLORS = {
  debug: "\x1b[90m", // gray
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
} as const;

const RESET = "\x1b[0m";

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  table: (data: unknown[], columns?: string[]) => void;
}

/**
 * Create a scoped logger instance.
 *
 * @example
 * const log = createLogger("Metrics");
 * log.info("Flushing buffer...");
 * log.debug("Buffer contents:", data);
 * log.error("Failed to flush:", error);
 * log.table(metrics, ["name", "value"]);
 */
export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`;

  return {
    debug: (...args: unknown[]) => {
      if (feature("DEBUG_LOGGING")) {
        console.log(`${LEVEL_COLORS.debug}${prefix}${RESET}`, ...args);
      }
    },
    info: (...args: unknown[]) => {
      console.log(`${LEVEL_COLORS.info}${prefix}${RESET}`, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(`${LEVEL_COLORS.warn}${prefix}${RESET}`, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(`${LEVEL_COLORS.error}${prefix}${RESET}`, ...args);
    },
    table: (data: unknown[], columns?: string[]) => {
      console.log(`${LEVEL_COLORS.info}${prefix}${RESET}`);
      console.log(Bun.inspect.table(data, columns, { colors: true }));
    },
  };
}

/**
 * Singleton loggers for commonly used scopes.
 * Import directly for convenience:
 *
 * @example
 * import { dashboardLog } from "../utils/logger";
 * dashboardLog.info("Starting...");
 */
export const dashboardLog = createLogger("Dashboard");
export const metricsLog = createLogger("Metrics");
export const terminalLog = createLogger("Terminal");
export const ptyLog = createLogger("PTY");
export const bookmarkLog = createLogger("Bookmark");
export const securityLog = createLogger("Security");
export const registryLog = createLogger("Registry");
export const serverLog = createLogger("Server");
