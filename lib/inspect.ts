// lib/inspect.ts - Object inspection and table formatting
// =============================================================================
// Bun-native inspect with Col-89 enforcement
// =============================================================================

// -----------------------------------------------------------------------------
// BN-102: Inspect
// -----------------------------------------------------------------------------
export interface InspectOptions {
  depth?: number | null;
  colors?: boolean;
  compact?: boolean | number;
  showHidden?: boolean;
}

export const inspect = (
  value: unknown,
  options?: InspectOptions
): string =>
  Bun.inspect(value, {
    depth: options?.depth ?? 2,
    colors: options?.colors ?? false,
    compact: options?.compact ?? false,
    showHidden: options?.showHidden ?? false,
  });

export const inspectColor = (
  value: unknown,
  options?: Omit<InspectOptions, "colors">
): string =>
  inspect(value, { ...options, colors: true });

// Compact single-line inspect
export const inspectCompact = (
  value: unknown,
  depth?: number
): string =>
  Bun.inspect(value, { depth: depth ?? 2, colors: false, compact: true });

// Deep inspect — unlimited depth
export const inspectDeep = (
  value: unknown,
  colors?: boolean
): string =>
  Bun.inspect(value, { depth: null, colors: colors ?? false, compact: false });

// -----------------------------------------------------------------------------
// BN-102b: Table
// -----------------------------------------------------------------------------
export const table = (
  data: unknown[] | Record<string, unknown>,
  columns?: string[],
  colors?: boolean
): string =>
  columns
    ? Bun.inspect.table(data, columns, { colors: colors ?? false })
    : Bun.inspect.table(data, { colors: colors ?? false } as any);

// Col-89 safe inspect — wraps output to 89 columns
export const safeInspect = (
  value: unknown,
  maxDepth?: number
): string => {
  const raw = Bun.inspect(value, {
    depth: maxDepth ?? 6,
    colors: false,
    compact: 3,
  });
  return Bun.wrapAnsi(raw, 89, { wordWrap: true, trim: true, hard: true });
};

// Custom inspect symbol
export const CUSTOM = Bun.inspect.custom;
