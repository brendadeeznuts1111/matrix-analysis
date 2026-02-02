// lib/semver.ts - Semantic version comparison and gating
// =============================================================================
// Bun-native semver for version checks and ordering
// =============================================================================

// -----------------------------------------------------------------------------
// BN-104: Semver Comparison
// -----------------------------------------------------------------------------
export const satisfies = (version: string, range: string): boolean => {
  try {
    return Bun.semver.satisfies(version, range);
  } catch {
    return false;
  }
};

export const order = (a: string, b: string): -1 | 0 | 1 => {
  try {
    return Bun.semver.order(a, b);
  } catch {
    return 0;
  }
};

export const gt = (a: string, b: string): boolean =>
  order(a, b) === 1;

export const lt = (a: string, b: string): boolean =>
  order(a, b) === -1;

export const eq = (a: string, b: string): boolean =>
  order(a, b) === 0;

export const gte = (a: string, b: string): boolean =>
  order(a, b) >= 0;

export const lte = (a: string, b: string): boolean =>
  order(a, b) <= 0;

// Gate: assert minimum version or exit
export const requireVersion = (
  minVersion: string,
  current: string = Bun.version
): boolean =>
  satisfies(current, `>=${minVersion}`);
