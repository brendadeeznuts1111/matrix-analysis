// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE FIXES for 50-col-matrix.ts
// Generated: 2026-01-22T11:11:12.361Z
// Apply these changes to optimize bottlenecks BN-001 through BN-005
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────────
// FIX BN-001: Memoized Fibonacci - O(n) instead of O(2^n)
// Location: Insert at module scope (before patterns.map)
// ─────────────────────────────────────────────────────────────────────────────────
const fibCache = new Map<number, number>([[0, 0], [1, 1]]);
const fib = (n: number): number => {
  if (fibCache.has(n)) return fibCache.get(n)!;
  let [a, b] = [0, 1];
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  fibCache.set(n, b);
  return b;
};

// ─────────────────────────────────────────────────────────────────────────────────
// FIX BN-003: Singleton Intl.Segmenter
// Location: Insert at module scope
// ─────────────────────────────────────────────────────────────────────────────────
const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// ─────────────────────────────────────────────────────────────────────────────────
// FIX BN-004: Hoisted Helper Functions
// Location: Insert at module scope (before patterns.map)
// ─────────────────────────────────────────────────────────────────────────────────
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let j = 2; j * j <= n; j++) if (n % j === 0) return false;
  return true;
};

// Use Bun's hardware-accelerated CRC32 instead of manual hash
const hash = (s: string): string => Bun.hash.crc32(s).toString(16).padStart(8, "0");

const getTypeTag = (obj: unknown): string =>
  Object.prototype.toString.call(obj).slice(8, -1);

const getProtoChain = (obj: object): string => {
  const chain: string[] = [];
  let proto = Object.getPrototypeOf(obj);
  while (proto && chain.length < 3) {
    chain.push(proto.constructor?.name || "?");
    proto = Object.getPrototypeOf(proto);
  }
  return chain.join("→") || "null";
};

const countSpecialChars = (s: string): number =>
  (s.match(/[:\\/*?()[\]{}|^$+.]/g) || []).length;

const countSegments = (s: string): number =>
  s.split("/").filter(Boolean).length;

const calcNestingDepth = (s: string): number => {
  let max = 0, cur = 0;
  for (const c of s) {
    if (c === "(" || c === "[" || c === "{") cur++;
    else if (c === ")" || c === "]" || c === "}") cur--;
    max = Math.max(max, cur);
  }
  return max;
};

const calcEntropy = (s: string): number => {
  const freq: Record<string, number> = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;
  let entropy = 0;
  for (const c in freq) {
    const p = freq[c] / s.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};

// ─────────────────────────────────────────────────────────────────────────────────
// FIX BN-005: Pre-compiled Security Regex Patterns
// Location: Insert at module scope
// ─────────────────────────────────────────────────────────────────────────────────
const SEC_PATTERNS = {
  userInput: /\$\{.*INPUT\}|\$\{.*REQUEST\}|\$\{.*QUERY\}/i,
  pathTraversal: /\.\.\/|\.\.\\/,
  openRedirect: /^https?:\/\/\*|:\/\/\$\{/,
  ssrf: /localhost|127\.0\.0\.1|0\.0\.0\.0|internal|private/i,
  nestedQuantifiers: /(\+|\*)\s*(\+|\*)|\([^)]*(\+|\*)[^)]*\)\+/,
  overlappingAlt: /\([^|]+\|[^)]+\)\+|\([^|]+\|[^)]+\)\*/,
  credential: /:password|:token|:secret|:api_key/i,
  basicAuth: /:\/\/[^@]+@/,
  xss: /<|>|javascript:|data:/i,
  sql: /(\bor\b|\band\b|--|;|'|"|\bunion\b)/i,
  cmdInjection: /(\||;|\`|\$\(|&&)/,
} as const;

// ─────────────────────────────────────────────────────────────────────────────────
// FIX BN-002: Lazy Benchmark Evaluation
// Location: Replace lines 921-934 with:
// ─────────────────────────────────────────────────────────────────────────────────
/*
// Only compute benchmarks when --benchmark or --performance-deep flags are set
testOpsPerSec: (showPerfDeep || quickBenchmark) ? (() => {
  const iterations = 100; // Reduced from 1000
  const start = Bun.nanoseconds();
  for (let j = 0; j < iterations; j++) pat.test(testUrl);
  const elapsedNs = Bun.nanoseconds() - start;
  return ((iterations / (elapsedNs / 1e9))).toFixed(0) + "/s";
})() : "-",

execOpsPerSec: (showPerfDeep || quickBenchmark) ? (() => {
  const iterations = 100; // Reduced from 1000
  const start = Bun.nanoseconds();
  for (let j = 0; j < iterations; j++) pat.exec(testUrl);
  const elapsedNs = Bun.nanoseconds() - start;
  return ((iterations / (elapsedNs / 1e9))).toFixed(0) + "/s";
})() : "-",
*/

// ─────────────────────────────────────────────────────────────────────────────────
// USAGE IN I18N SECTION (Fix BN-003):
// Replace line 1133-1134 with:
// ─────────────────────────────────────────────────────────────────────────────────
/*
const graphemes = [...GRAPHEME_SEGMENTER.segment(p)];
*/

// ─────────────────────────────────────────────────────────────────────────────────
// USAGE IN SECURITY SECTION (Fix BN-005):
// Replace lines 1036-1049 with:
// ─────────────────────────────────────────────────────────────────────────────────
/*
const hasUserInput = SEC_PATTERNS.userInput.test(p);
const hasPathTraversal = SEC_PATTERNS.pathTraversal.test(p);
const hasOpenRedirect = SEC_PATTERNS.openRedirect.test(p);
const hasSsrfPattern = SEC_PATTERNS.ssrf.test(p);
const hasNestedQuantifiers = SEC_PATTERNS.nestedQuantifiers.test(p);
const hasOverlappingAlternation = SEC_PATTERNS.overlappingAlt.test(p);
const redosRisk = hasNestedQuantifiers || hasOverlappingAlternation;
const wildcardCount = (p.match(/\*/g) || []).length;
const leadingWildcard = p.startsWith("*") || /^https?:\/\/\*/.test(p);
const hasCredentialPattern = SEC_PATTERNS.credential.test(p);
const hasBasicAuth = SEC_PATTERNS.basicAuth.test(p);
const hasXssVector = SEC_PATTERNS.xss.test(p);
const hasSqlPattern = SEC_PATTERNS.sql.test(p);
const hasCmdInjection = SEC_PATTERNS.cmdInjection.test(p);
*/
