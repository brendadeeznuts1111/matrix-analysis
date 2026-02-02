// lib/env.ts - Typed environment variable access
// ═══════════════════════════════════════════════════════════════════════════════
// Eliminates ad-hoc process.env parsing with parseInt/boolean coercion.
// Provides terminal detection, mode checks, and Bun version gating.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-050: String Getters
// ─────────────────────────────────────────────────────────────────────────────
export const get = (key: string, defaultValue?: string): string | undefined =>
  process.env[key] ?? defaultValue;

export const getRequired = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === "") {
    console.error(`[env] Required environment variable ${key} is not set`);
    process.exit(1);
  }
  return value;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-051: Typed Getters
// ─────────────────────────────────────────────────────────────────────────────
export const getNumber = (key: string, defaultValue: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return defaultValue;
  const n = Number(raw);
  return Number.isNaN(n) ? defaultValue : n;
};

export const getBool = (key: string, defaultValue = false): boolean => {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return defaultValue;
  return raw === "1" || raw.toLowerCase() === "true" || raw.toLowerCase() === "yes";
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-052: Terminal Detection
// ─────────────────────────────────────────────────────────────────────────────
export const isTTY = (): boolean =>
  Boolean(process.stdout?.isTTY);

export const hasNoColor = (): boolean =>
  process.env.NO_COLOR !== undefined;

export const shouldColor = (): boolean =>
  isTTY() && !hasNoColor();

// ─────────────────────────────────────────────────────────────────────────────
// BN-053: Environment Mode
// ─────────────────────────────────────────────────────────────────────────────
export const isDev = (): boolean =>
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined;

export const isProd = (): boolean =>
  process.env.NODE_ENV === "production";

export const isTest = (): boolean =>
  process.env.NODE_ENV === "test" || process.env.CLAUDECODE === "1";

// ─────────────────────────────────────────────────────────────────────────────
// BN-054: Bun Detection
// ─────────────────────────────────────────────────────────────────────────────
export const isBun = (): boolean =>
  typeof Bun !== "undefined";

export const bunVersion = (): string | null =>
  typeof Bun !== "undefined" ? Bun.version : null;

export const requireBunVersion = (range: string): boolean => {
  if (typeof Bun === "undefined") return false;
  return Bun.semver.satisfies(Bun.version, range);
};
