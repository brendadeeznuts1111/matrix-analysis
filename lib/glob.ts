// lib/glob.ts - Pattern matching via Bun.Glob
// =============================================================================
// File glob scanning + pure string pattern matching
// =============================================================================

// -----------------------------------------------------------------------------
// BN-109: Pattern Matching (no filesystem)
// -----------------------------------------------------------------------------
export const match = (pattern: string, input: string): boolean => {
  const g = new Bun.Glob(pattern);
  return g.match(input);
};

// Match multiple inputs, return those that match
export const filter = (pattern: string, inputs: string[]): string[] =>
  inputs.filter((input) => match(pattern, input));

// Test if any input matches the pattern
export const some = (pattern: string, inputs: string[]): boolean =>
  inputs.some((input) => match(pattern, input));

// Create a reusable matcher function
export const matcher = (pattern: string): (input: string) => boolean => {
  const g = new Bun.Glob(pattern);
  return (input: string) => g.match(input);
};
