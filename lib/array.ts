// lib/array.ts - Array manipulation primitives
// ═══════════════════════════════════════════════════════════════════════════════
// Chunk, partition, group, dedupe, and transform operations.
// Zero dependencies. All pure functions, no mutation.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-075: Chunk & Batch
// ─────────────────────────────────────────────────────────────────────────────
export const chunk = <T>(arr: readonly T[], size: number): T[][] => {
  if (size < 1) return [];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

export const windows = <T>(arr: readonly T[], size: number): T[][] => {
  if (size < 1 || size > arr.length) return [];
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - size; i++) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-076: Unique & Dedupe
// ─────────────────────────────────────────────────────────────────────────────
export const unique = <T>(arr: readonly T[]): T[] => [...new Set(arr)];

export const uniqueBy = <T, K>(arr: readonly T[], keyFn: (item: T) => K): T[] => {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of arr) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-077: Group & Partition
// ─────────────────────────────────────────────────────────────────────────────
export const groupBy = <T, K extends string | number>(
  arr: readonly T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  const result = {} as Record<K, T[]>;
  for (const item of arr) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
};

export const partition = <T>(
  arr: readonly T[],
  predicate: (item: T) => boolean
): [T[], T[]] => {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of arr) {
    (predicate(item) ? pass : fail).push(item);
  }
  return [pass, fail];
};

export const countBy = <T, K extends string | number>(
  arr: readonly T[],
  keyFn: (item: T) => K
): Record<K, number> => {
  const result = {} as Record<K, number>;
  for (const item of arr) {
    const key = keyFn(item);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-078: Filter & Transform
// ─────────────────────────────────────────────────────────────────────────────
export const compact = <T>(arr: readonly (T | null | undefined | false | 0 | "")[]): T[] =>
  arr.filter(Boolean) as T[];

export const flatten = <T>(arr: readonly (T | T[])[]): T[] =>
  arr.flat() as T[];

export const zip = <A, B>(a: readonly A[], b: readonly B[]): [A, B][] => {
  const len = Math.min(a.length, b.length);
  const result: [A, B][] = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = [a[i], b[i]];
  }
  return result;
};

export const interleave = <T>(a: readonly T[], b: readonly T[]): T[] => {
  const result: T[] = [];
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-079: Aggregate & Search
// ─────────────────────────────────────────────────────────────────────────────
export const sum = (arr: readonly number[]): number => {
  let total = 0;
  for (const n of arr) total += n;
  return total;
};

export const mean = (arr: readonly number[]): number =>
  arr.length === 0 ? 0 : sum(arr) / arr.length;

export const minBy = <T>(arr: readonly T[], fn: (item: T) => number): T | null => {
  if (arr.length === 0) return null;
  let best = arr[0];
  let bestVal = fn(best);
  for (let i = 1; i < arr.length; i++) {
    const val = fn(arr[i]);
    if (val < bestVal) {
      best = arr[i];
      bestVal = val;
    }
  }
  return best;
};

export const maxBy = <T>(arr: readonly T[], fn: (item: T) => number): T | null => {
  if (arr.length === 0) return null;
  let best = arr[0];
  let bestVal = fn(best);
  for (let i = 1; i < arr.length; i++) {
    const val = fn(arr[i]);
    if (val > bestVal) {
      best = arr[i];
      bestVal = val;
    }
  }
  return best;
};

export const sortBy = <T>(arr: readonly T[], fn: (item: T) => number | string): T[] =>
  [...arr].sort((a, b) => {
    const va = fn(a);
    const vb = fn(b);
    return va < vb ? -1 : va > vb ? 1 : 0;
  });
