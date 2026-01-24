/**
 * ANSI Color Codes for Terminal Output
 *
 * Centralized color definitions to ensure consistency across the codebase.
 * Use these instead of hardcoded escape sequences.
 */

// ============================================================================
// ANSI Escape Codes
// ============================================================================

/**
 * ANSI escape code constants for terminal styling.
 * Use these for direct color control or combine with semantic helpers.
 *
 * @example
 * console.log(`${ANSI.GREEN}Success!${ANSI.RESET}`);
 * console.log(`${ANSI.BOLD}${ANSI.CYAN}Title${ANSI.RESET}`);
 */
export const ANSI = {
  // Reset
  RESET: "\x1b[0m",

  // Regular Colors
  BLACK: "\x1b[30m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  WHITE: "\x1b[37m",

  // Bright Colors
  BRIGHT_BLACK: "\x1b[90m",
  BRIGHT_RED: "\x1b[91m",
  BRIGHT_GREEN: "\x1b[92m",
  BRIGHT_YELLOW: "\x1b[93m",
  BRIGHT_BLUE: "\x1b[94m",
  BRIGHT_MAGENTA: "\x1b[95m",
  BRIGHT_CYAN: "\x1b[96m",
  BRIGHT_WHITE: "\x1b[97m",

  // Background Colors
  BG_BLACK: "\x1b[40m",
  BG_RED: "\x1b[41m",
  BG_GREEN: "\x1b[42m",
  BG_YELLOW: "\x1b[43m",
  BG_BLUE: "\x1b[44m",
  BG_MAGENTA: "\x1b[45m",
  BG_CYAN: "\x1b[46m",
  BG_WHITE: "\x1b[47m",

  // Text Styles
  BOLD: "\x1b[1m",
  DIM: "\x1b[2m",
  ITALIC: "\x1b[3m",
  UNDERLINE: "\x1b[4m",
  INVERSE: "\x1b[7m",
  STRIKETHROUGH: "\x1b[9m",
} as const;

// ============================================================================
// Semantic Color Helpers
// ============================================================================

/**
 * Format text with success styling (green).
 */
export function success(text: string): string {
  return `${ANSI.GREEN}${text}${ANSI.RESET}`;
}

/**
 * Format text with error styling (red).
 */
export function error(text: string): string {
  return `${ANSI.RED}${text}${ANSI.RESET}`;
}

/**
 * Format text with warning styling (yellow).
 */
export function warn(text: string): string {
  return `${ANSI.YELLOW}${text}${ANSI.RESET}`;
}

/**
 * Format text with info styling (cyan).
 */
export function info(text: string): string {
  return `${ANSI.CYAN}${text}${ANSI.RESET}`;
}

/**
 * Format text with debug/muted styling (gray).
 */
export function dim(text: string): string {
  return `${ANSI.BRIGHT_BLACK}${text}${ANSI.RESET}`;
}

/**
 * Format text with highlight styling (magenta).
 */
export function highlight(text: string): string {
  return `${ANSI.MAGENTA}${text}${ANSI.RESET}`;
}

/**
 * Format text with accent styling (bright blue).
 */
export function accent(text: string): string {
  return `${ANSI.BRIGHT_BLUE}${text}${ANSI.RESET}`;
}

// ============================================================================
// Status Icons (colored)
// ============================================================================

/**
 * Pre-formatted colored status icons for terminal output.
 *
 * @example
 * console.log(`${STATUS.SUCCESS} Operation completed`);
 * console.log(`${STATUS.FAIL} Connection failed`);
 */
export const STATUS = {
  SUCCESS: `${ANSI.GREEN}✓${ANSI.RESET}`,
  FAIL: `${ANSI.RED}✗${ANSI.RESET}`,
  WARN: `${ANSI.YELLOW}⚠${ANSI.RESET}`,
  INFO: `${ANSI.CYAN}ℹ${ANSI.RESET}`,
  CHECK: `${ANSI.GREEN}✅${ANSI.RESET}`,
  CROSS: `${ANSI.RED}❌${ANSI.RESET}`,
  ARROW: `${ANSI.CYAN}→${ANSI.RESET}`,
} as const;

// ============================================================================
// Tier Labels
// ============================================================================

/**
 * Pre-formatted tier labels for feature gating logs.
 *
 * @example
 * console.log(`${TIER.PRO} Advanced Metrics enabled`);
 * console.log(`${TIER.ENTERPRISE} Shell access granted`);
 */
export const TIER = {
  FREE: `${ANSI.CYAN}[FREE]${ANSI.RESET}`,
  PRO: `${ANSI.MAGENTA}[PRO]${ANSI.RESET}`,
  ENTERPRISE: `${ANSI.BRIGHT_BLUE}[ENTERPRISE]${ANSI.RESET}`,
  DEBUG: `${ANSI.BRIGHT_BLACK}[DEBUG]${ANSI.RESET}`,
} as const;

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format a label with consistent styling.
 */
export function label(category: string, text: string): string {
  return `${ANSI.BRIGHT_BLACK}[${category}]${ANSI.RESET} ${text}`;
}

/**
 * Format a trace/timing message.
 */
export function trace(name: string, durationMs: number): string {
  return `${ANSI.BRIGHT_BLACK}[Trace] ${name} completed in ${durationMs.toFixed(2)}ms${ANSI.RESET}`;
}

/**
 * Format a performance mark.
 */
export function mark(label: string, durationMs: number): string {
  return `${ANSI.CYAN}[Mark] ${label}: ${durationMs.toFixed(3)}ms${ANSI.RESET}`;
}

/**
 * Strip ANSI codes from a string (for logging to files).
 */
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Check if the terminal supports colors.
 */
export function supportsColor(): boolean {
  if (typeof process !== "undefined") {
    // NO_COLOR environment variable disables colors
    if (process.env.NO_COLOR !== undefined) return false;
    // FORCE_COLOR enables colors
    if (process.env.FORCE_COLOR !== undefined) return true;
    // Check if stdout is a TTY
    return process.stdout?.isTTY ?? false;
  }
  return false;
}
