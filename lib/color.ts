// lib/color.ts - Terminal colorization with NO_COLOR support
// ═══════════════════════════════════════════════════════════════════════════════
// Lightweight color layer between raw ANSI and the full cli.ts system.
// Respects NO_COLOR convention and provides semantic presets.
// ═══════════════════════════════════════════════════════════════════════════════

import { shouldColor } from "./env.ts";

// Cache color support at module load
const _colorEnabled = shouldColor();

// ─────────────────────────────────────────────────────────────────────────────
// BN-060: NO_COLOR Detection
// ─────────────────────────────────────────────────────────────────────────────
export const noColor = (): boolean => !_colorEnabled;

// ─────────────────────────────────────────────────────────────────────────────
// BN-061: Colorize
// ─────────────────────────────────────────────────────────────────────────────
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

export const colorize = (text: string, hex: string): string => {
  if (!_colorEnabled) return text;
  const ansi = Bun.color(hex, "ansi-16m");
  if (!ansi) return text;
  return `${ansi}${text}${RESET}`;
};

export const bold = (text: string): string =>
  _colorEnabled ? `${BOLD}${text}${RESET}` : text;

export const dim = (text: string): string =>
  _colorEnabled ? `${DIM}${text}${RESET}` : text;

// ─────────────────────────────────────────────────────────────────────────────
// BN-062: Semantic Presets
// ─────────────────────────────────────────────────────────────────────────────
export const PALETTE = {
  success: "#22c55e",
  error: "#ef4444",
  warning: "#eab308",
  info: "#3b82f6",
  muted: "#6b7280",
} as const;

export const success = (text: string): string => colorize(text, PALETTE.success);
export const error = (text: string): string => colorize(text, PALETTE.error);
export const warning = (text: string): string => colorize(text, PALETTE.warning);
export const info = (text: string): string => colorize(text, PALETTE.info);
export const muted = (text: string): string => colorize(text, PALETTE.muted);

// ─────────────────────────────────────────────────────────────────────────────
// BN-063: Hex Conversion
// ─────────────────────────────────────────────────────────────────────────────
export type ColorFormat = "hex" | "HEX" | "rgb" | "rgba" | "hsl" | "number" | "ansi-16m" | "css";

export const convert = (
  input: string | number | [number, number, number],
  format: ColorFormat = "hex"
): string | null => {
  try {
    const result = Bun.color(input as Parameters<typeof Bun.color>[0], format as "hex");
    return result ?? null;
  } catch {
    return null;
  }
};

export const toHex = (input: string | number | [number, number, number]): string | null =>
  convert(input, "hex");

export const toRgb = (hex: string): string | null =>
  convert(hex, "rgb");

export const toHsl = (hex: string): string | null =>
  convert(hex, "hsl");

export const toHex8 = (input: string | number | [number, number, number, number?]): string | null => {
  try {
    const rgba = Bun.color(input as Parameters<typeof Bun.color>[0], "[rgba]" as "hex") as unknown as number[] | null;
    if (!rgba || rgba.length < 3) return null;
    const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
    const [r, g, b, a = 255] = rgba;
    return `#${hex(r)}${hex(g)}${hex(b)}${hex(a)}`;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-064: Status Symbols
// ─────────────────────────────────────────────────────────────────────────────
export const OK = (msg: string): string => success(`\u2713 ${msg}`);
export const FAIL = (msg: string): string => error(`\u2717 ${msg}`);
export const WARN = (msg: string): string => warning(`\u26A0 ${msg}`);
export const INFO = (msg: string): string => info(`\u2139 ${msg}`);

// ─────────────────────────────────────────────────────────────────────────────
// BN-064b: ANSI Constants (eliminate raw escape codes across codebase)
// ─────────────────────────────────────────────────────────────────────────────
export const ANSI = {
  reset: RESET,
  bold: BOLD,
  dim: DIM,
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  inverse: "\x1b[7m",
  strikethrough: "\x1b[9m",
  // Foreground
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  // Background
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
} as const;
