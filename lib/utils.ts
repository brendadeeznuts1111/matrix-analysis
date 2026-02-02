// lib/utils.ts - Shared Bun-native utilities
// ═══════════════════════════════════════════════════════════════════════════════
// Deduplicated helpers for matrix analysis scripts
// All functions use Bun-native APIs for optimal performance
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-001: Memoized Fibonacci - O(n) instead of O(2^n)
// ─────────────────────────────────────────────────────────────────────────────
export const fibCache = new Map<number, number>([[0, 0], [1, 1]]);

export const fib = (n: number): number => {
  if (n < 0) return 0;
  if (fibCache.has(n)) return fibCache.get(n)!;
  let [a, b] = [0, 1];
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  fibCache.set(n, b);
  return b;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-003: Singleton Intl.Segmenter (avoids 2ms allocation per use)
// ─────────────────────────────────────────────────────────────────────────────
export const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export const countGraphemes = (s: string): number =>
  [...GRAPHEME_SEGMENTER.segment(s)].length;

// ─────────────────────────────────────────────────────────────────────────────
// BN-004: Hoisted Helper Functions
// ─────────────────────────────────────────────────────────────────────────────
export const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let j = 3; j * j <= n; j += 2) {
    if (n % j === 0) return false;
  }
  return true;
};

// Use Bun's hardware-accelerated CRC32 (~9 GB/s)
export const hash = (s: string): string =>
  Bun.hash.crc32(s).toString(16).padStart(8, "0");

export const getTypeTag = (obj: unknown): string =>
  Object.prototype.toString.call(obj).slice(8, -1);

export const getProtoChain = (obj: object): string => {
  const chain: string[] = [];
  let proto = Object.getPrototypeOf(obj);
  while (proto && chain.length < 3) {
    chain.push(proto.constructor?.name || "?");
    proto = Object.getPrototypeOf(proto);
  }
  return chain.join("→") || "null";
};

export const countSpecialChars = (s: string): number =>
  (s.match(/[:\\//*?()[\]{}|^$+.]/g) || []).length;

export const countSegments = (s: string): number =>
  s.split("/").filter(Boolean).length;

export const calcNestingDepth = (s: string): number => {
  let max = 0, cur = 0;
  for (const c of s) {
    if (c === "(" || c === "[" || c === "{") cur++;
    else if (c === ")" || c === "]" || c === "}") cur--;
    max = Math.max(max, cur);
  }
  return max;
};

export const calcEntropy = (s: string): number => {
  if (s.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;
  let entropy = 0;
  for (const c in freq) {
    const p = freq[c] / s.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-005: Pre-compiled Security Regex Patterns
// ─────────────────────────────────────────────────────────────────────────────
export const SEC_PATTERNS = {
  userInput: /\$\{.*INPUT\}|\$\{.*REQUEST\}|\$\{.*QUERY\}/i,
  pathTraversal: /\.\.\/|\.\.\\/,
  openRedirect: /^https?:\/\/\*|:\/\/\$\{/,
  ssrf: /localhost|127\.0\.0\.1|0\.0\.0\.0|internal|private/i,
  nestedQuantifiers: /(\+|\*)\s*(\+|\*)|(\([^)]*(\+|\*)[^)]*\))\+/,
  overlappingAlt: /\([^|]+\|[^)]+\)\+|\([^|]+\|[^)]+\)\*/,
  credential: /:password|:token|:secret|:api_key/i,
  basicAuth: /:\/\/[^@]+@/,
  xss: /<|>|javascript:|data:/i,
  sql: /(\bor\b|\band\b|--|;|'|"|\bunion\b)/i,
  cmdInjection: /(\||;|`|\$\(|&&)/,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Additional Utilities
// ─────────────────────────────────────────────────────────────────────────────

// Factorial with memoization
const factorialCache = new Map<number, number>([[0, 1], [1, 1]]);
export const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (factorialCache.has(n)) return factorialCache.get(n)!;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  factorialCache.set(n, result);
  return result;
};

// Digit operations
export const digitSum = (n: number): number => {
  let sum = 0;
  n = Math.abs(n);
  while (n > 0) {
    sum += n % 10;
    n = Math.floor(n / 10);
  }
  return sum;
};

export const digitProduct = (n: number): number => {
  if (n === 0) return 0;
  let product = 1;
  n = Math.abs(n);
  while (n > 0) {
    product *= n % 10;
    n = Math.floor(n / 10);
  }
  return product;
};

export const reverseNumber = (n: number): number => {
  const sign = n < 0 ? -1 : 1;
  return sign * parseInt(Math.abs(n).toString().split("").reverse().join("") || "0");
};

// UUIDv7 with timestamp extraction
export const generateUUIDv7WithTimestamp = (): { uuid: string; timestamp: string } => {
  const uuid = Bun.randomUUIDv7();
  const timestamp = new Date(
    parseInt(uuid.replace(/-/g, "").slice(0, 12), 16)
  ).toISOString().slice(11, 23);
  return { uuid, timestamp };
};

// ─────────────────────────────────────────────────────────────────────────────
// Module Re-exports
// ─────────────────────────────────────────────────────────────────────────────
export * as polish from "./polish/index.ts";
export * as perf from "./perf.ts";
export * as shell from "./shell.ts";
export * as str from "./str.ts";
export * as parse from "./parse.ts";
export * as crypto from "./crypto.ts";
export * as stream from "./stream.ts";
