// bottleneck-analysis.ts - Performance Bottleneck Analysis for 50-col-matrix.ts
// Uses MATRIX v3.0 style analysis with Bun.inspect.table()

import { $ } from "bun";

// ─────────────────────────────────────────────────────────────────────────────
// BOTTLENECK DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

interface Bottleneck {
  id: string;
  name: string;
  location: string;
  line: number;
  category: "algorithmic" | "allocation" | "io" | "compilation" | "redundancy";
  severity: "critical" | "high" | "medium" | "low";
  impact: string;
  rootCause: string;
  fix: string;
  beforeCode: string;
  afterCode: string;
  estimatedSpeedup: string;
  effort: "trivial" | "easy" | "moderate" | "complex";
}

const bottlenecks: Bottleneck[] = [
  {
    id: "BN-001",
    name: "Recursive Fibonacci O(2^n)",
    location: "50-col-matrix.ts:770",
    line: 770,
    category: "algorithmic",
    severity: "critical",
    impact: "Exponential time complexity - fib(15) = 610 calls, fib(20) = 6,765 calls",
    rootCause: "Naive recursive implementation without memoization, redefined per row",
    fix: "Use iterative algorithm with O(n) time, hoist outside map callback",
    beforeCode: `const fib = (n: number): number => (n <= 1 ? n : fib(n - 1) + fib(n - 2));`,
    afterCode: `// Hoisted outside map, O(n) iterative
const fibCache = new Map<number, number>([[0, 0], [1, 1]]);
const fib = (n: number): number => {
  if (fibCache.has(n)) return fibCache.get(n)!;
  let [a, b] = [0, 1];
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  fibCache.set(n, b);
  return b;
};`,
    estimatedSpeedup: "1000x+ for n > 20",
    effort: "trivial",
  },
  {
    id: "BN-002",
    name: "Inline Micro-Benchmarks",
    location: "50-col-matrix.ts:921-934",
    line: 921,
    category: "redundancy",
    severity: "high",
    impact: "2000 iterations per row × 15 rows = 30,000 synchronous ops blocking main thread",
    rootCause: "Benchmarks embedded in row generation IIFE, run unconditionally",
    fix: "Lazy evaluation with optional --benchmark flag, reduce iterations, use Bun.nanoseconds()",
    beforeCode: `testOpsPerSec: (() => {
  const iterations = 1000;
  const start = performance.now();
  for (let j = 0; j < iterations; j++) pat.test(testUrl);
  const elapsed = performance.now() - start;
  return ((iterations / elapsed) * 1000).toFixed(0) + "/s";
})(),`,
    afterCode: `// Lazy benchmark - only compute when --benchmark flag present
testOpsPerSec: showPerfDeep ? (() => {
  const iterations = 100; // Reduced from 1000
  const start = Bun.nanoseconds();
  for (let j = 0; j < iterations; j++) pat.test(testUrl);
  const elapsedNs = Bun.nanoseconds() - start;
  return ((iterations / (elapsedNs / 1e9))).toFixed(0) + "/s";
})() : "-",`,
    estimatedSpeedup: "10x when not benchmarking, 10x when benchmarking (reduced iterations)",
    effort: "easy",
  },
  {
    id: "BN-003",
    name: "Intl.Segmenter Instantiation Per Row",
    location: "50-col-matrix.ts:1133",
    line: 1133,
    category: "allocation",
    severity: "high",
    impact: "Heavy ICU object created 15 times instead of once, ~2ms allocation overhead each",
    rootCause: "Segmenter created inside row map callback instead of hoisted",
    fix: "Hoist Intl.Segmenter to module scope (singleton pattern)",
    beforeCode: `const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const graphemes = [...graphemeSegmenter.segment(p)];`,
    afterCode: `// Module-level singleton (before patterns.map)
const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// Inside row generation:
const graphemes = [...GRAPHEME_SEGMENTER.segment(p)];`,
    estimatedSpeedup: "15x for i18n analysis (30ms → 2ms)",
    effort: "trivial",
  },
  {
    id: "BN-004",
    name: "Helper Functions Redefined Per Row",
    location: "50-col-matrix.ts:769-815",
    line: 769,
    category: "redundancy",
    severity: "medium",
    impact: "6 helper functions (fib, isPrime, hash, getTypeTag, etc.) recreated 15 times",
    rootCause: "Functions defined inside map callback instead of module scope",
    fix: "Hoist all pure helper functions to module scope",
    beforeCode: `const allRows: RowData[] = patterns.slice(0, rowLimit).map((p, i) => {
  // ... pattern setup ...

  // helpers - REDEFINED EVERY ITERATION
  const fib = (n: number): number => ...
  const isPrime = (n: number): boolean => ...
  const hash = (s: string): string => ...
  const getTypeTag = (obj: unknown): string => ...
  const getProtoChain = (obj: object): string => ...
  const countSpecialChars = (s: string): number => ...`,
    afterCode: `// ═══════════════════════════════════════════════════════════════════════════
// HOISTED HELPERS (module scope - defined once)
// ═══════════════════════════════════════════════════════════════════════════
const fib = (n: number): number => { /* memoized version */ };
const isPrime = (n: number): boolean => { /* ... */ };
const hash = (s: string): string => Bun.hash.crc32(s).toString(16);
const getTypeTag = (obj: unknown): string => Object.prototype.toString.call(obj).slice(8, -1);
const getProtoChain = (obj: object): string => { /* ... */ };
const countSpecialChars = (s: string): number => (s.match(/[:\\\\/*?()[\\]{}|^$+.]/g) || []).length;

const allRows: RowData[] = patterns.slice(0, rowLimit).map((p, i) => {
  // helpers now referenced, not recreated`,
    estimatedSpeedup: "2-3x reduction in GC pressure, minor CPU improvement",
    effort: "easy",
  },
  {
    id: "BN-005",
    name: "Security Regex Recompilation",
    location: "50-col-matrix.ts:1036-1049",
    line: 1036,
    category: "compilation",
    severity: "medium",
    impact: "~15 regex patterns compiled per row = 225 regex compilations for 15 patterns",
    rootCause: "Regex literals inside IIFE, recompiled each invocation despite being static",
    fix: "Pre-compile security regexes as module-level constants",
    beforeCode: `...(() => {
  const hasUserInput = /\\$\\{.*INPUT\\}|\\$\\{.*REQUEST\\}|\\$\\{.*QUERY\\}/i.test(p);
  const hasPathTraversal = /\\.\\.\\/|\\.\\.\\\\/.test(p);
  const hasOpenRedirect = /^https?:\\/\\/\\*|:\\/\\/\\$\\{/.test(p);
  const hasSsrfPattern = /localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|internal|private/i.test(p);
  // ... 10+ more regex patterns`,
    afterCode: `// Pre-compiled security patterns (module scope)
const SEC_PATTERNS = {
  userInput: /\\$\\{.*INPUT\\}|\\$\\{.*REQUEST\\}|\\$\\{.*QUERY\\}/i,
  pathTraversal: /\\.\\.\\/|\\.\\.\\\\/,
  openRedirect: /^https?:\\/\\/\\*|:\\/\\/\\$\\{/,
  ssrf: /localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|internal|private/i,
  nestedQuantifiers: /(\\+|\\*)\\s*(\\+|\\*)|\\([^)]*(\\+|\\*)[^)]*\\)\\+/,
  overlappingAlt: /\\([^|]+\\|[^)]+\\)\\+|\\([^|]+\\|[^)]+\\)\\*/,
  credential: /:password|:token|:secret|:api_key/i,
  basicAuth: /:\\/\\/[^@]+@/,
  xss: /<|>|javascript:|data:/i,
  sql: /(\\bor\\b|\\band\\b|--|;|'|"|\\bunion\\b)/i,
  cmdInjection: /(\\||;|\`|\\$\\(|&&)/,
} as const;

// Inside row generation:
const hasUserInput = SEC_PATTERNS.userInput.test(p);
const hasPathTraversal = SEC_PATTERNS.pathTraversal.test(p);
// ... etc`,
    estimatedSpeedup: "5-10x for security analysis section",
    effort: "moderate",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATRIX-STYLE ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

function analyzeBottlenecks() {
  const severityScore = { critical: 10, high: 7, medium: 4, low: 1 };
  const effortScore = { trivial: 1, easy: 2, moderate: 4, complex: 8 };
  const categoryIcon = {
    algorithmic: "🧮",
    allocation: "📦",
    io: "💾",
    compilation: "⚙️",
    redundancy: "🔄",
  };
  const severityIcon = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  };

  // Calculate ROI score (impact / effort)
  const rows = bottlenecks.map((b, i) => {
    const impact = severityScore[b.severity];
    const effort = effortScore[b.effort];
    const roi = ((impact / effort) * 10).toFixed(1);
    const priority = impact / effort > 5 ? "🔥 NOW" : impact / effort > 2 ? "⚡ SOON" : "📋 LATER";

    return {
      "#": i + 1,
      ID: b.id,
      Name: b.name.slice(0, 28) + (b.name.length > 28 ? "…" : ""),
      Cat: `${categoryIcon[b.category]} ${b.category.slice(0, 6)}`,
      Sev: `${severityIcon[b.severity]} ${b.severity}`,
      Line: b.line,
      Effort: b.effort,
      ROI: roi,
      Priority: priority,
      Speedup: b.estimatedSpeedup.slice(0, 15),
    };
  });

  // Sort by ROI descending
  rows.sort((a, b) => parseFloat(b.ROI) - parseFloat(a.ROI));

  console.log("═".repeat(100));
  console.log("🔍 BOTTLENECK ANALYSIS - 50-col-matrix.ts");
  console.log("═".repeat(100));
  console.log("");
  console.log(Bun.inspect.table(rows, { colors: true }));

  // Summary stats
  const totalImpact = bottlenecks.reduce((a, b) => a + severityScore[b.severity], 0);
  const totalEffort = bottlenecks.reduce((a, b) => a + effortScore[b.effort], 0);
  const criticalCount = bottlenecks.filter(b => b.severity === "critical").length;
  const highCount = bottlenecks.filter(b => b.severity === "high").length;

  console.log("");
  console.log("─".repeat(60));
  console.log("📊 SUMMARY");
  console.log("─".repeat(60));
  console.log(`  Bottlenecks:     ${bottlenecks.length}`);
  console.log(`  Critical:        ${criticalCount} 🔴`);
  console.log(`  High:            ${highCount} 🟠`);
  console.log(`  Total Impact:    ${totalImpact} points`);
  console.log(`  Total Effort:    ${totalEffort} effort-units`);
  console.log(`  Aggregate ROI:   ${(totalImpact / totalEffort * 10).toFixed(1)}`);
  console.log("");

  return bottlenecks;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAILED ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

function showDetailedAnalysis() {
  console.log("═".repeat(100));
  console.log("📝 DETAILED BOTTLENECK DOCUMENTATION");
  console.log("═".repeat(100));

  for (const b of bottlenecks) {
    console.log("");
    console.log(`┌${"─".repeat(98)}┐`);
    console.log(`│ ${b.id}: ${b.name.padEnd(85)} │`);
    console.log(`├${"─".repeat(98)}┤`);
    console.log(`│ Location:   ${b.location.padEnd(84)} │`);
    console.log(`│ Category:   ${b.category.padEnd(84)} │`);
    console.log(`│ Severity:   ${b.severity.padEnd(84)} │`);
    console.log(`│ Effort:     ${b.effort.padEnd(84)} │`);
    console.log(`│ Speedup:    ${b.estimatedSpeedup.padEnd(84)} │`);
    console.log(`├${"─".repeat(98)}┤`);
    console.log(`│ Impact:                                                                                          │`);
    const impactLines = wrapText(b.impact, 94);
    impactLines.forEach(line => console.log(`│   ${line.padEnd(94)} │`));
    console.log(`├${"─".repeat(98)}┤`);
    console.log(`│ Root Cause:                                                                                      │`);
    const causeLines = wrapText(b.rootCause, 94);
    causeLines.forEach(line => console.log(`│   ${line.padEnd(94)} │`));
    console.log(`├${"─".repeat(98)}┤`);
    console.log(`│ Fix Strategy:                                                                                    │`);
    const fixLines = wrapText(b.fix, 94);
    fixLines.forEach(line => console.log(`│   ${line.padEnd(94)} │`));
    console.log(`└${"─".repeat(98)}┘`);
  }
}

function wrapText(text: string, width: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length <= width) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATED FIX GENERATION
// ─────────────────────────────────────────────────────────────────────────────

async function generateFixes() {
  console.log("");
  console.log("═".repeat(100));
  console.log("🔧 AUTOMATED FIX GENERATION");
  console.log("═".repeat(100));

  const fixContent = `// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE FIXES for 50-col-matrix.ts
// Generated: ${new Date().toISOString()}
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
  (s.match(/[:\\\\/*?()[\\]{}|^$+.]/g) || []).length;

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
  userInput: /\\$\\{.*INPUT\\}|\\$\\{.*REQUEST\\}|\\$\\{.*QUERY\\}/i,
  pathTraversal: /\\.\\.\\/|\\.\\.\\\\/,
  openRedirect: /^https?:\\/\\/\\*|:\\/\\/\\$\\{/,
  ssrf: /localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|internal|private/i,
  nestedQuantifiers: /(\\+|\\*)\\s*(\\+|\\*)|\\([^)]*(\\+|\\*)[^)]*\\)\\+/,
  overlappingAlt: /\\([^|]+\\|[^)]+\\)\\+|\\([^|]+\\|[^)]+\\)\\*/,
  credential: /:password|:token|:secret|:api_key/i,
  basicAuth: /:\\/\\/[^@]+@/,
  xss: /<|>|javascript:|data:/i,
  sql: /(\\bor\\b|\\band\\b|--|;|'|"|\\bunion\\b)/i,
  cmdInjection: /(\\||;|\\\`|\\$\\(|&&)/,
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
const wildcardCount = (p.match(/\\*/g) || []).length;
const leadingWildcard = p.startsWith("*") || /^https?:\\/\\/\\*/.test(p);
const hasCredentialPattern = SEC_PATTERNS.credential.test(p);
const hasBasicAuth = SEC_PATTERNS.basicAuth.test(p);
const hasXssVector = SEC_PATTERNS.xss.test(p);
const hasSqlPattern = SEC_PATTERNS.sql.test(p);
const hasCmdInjection = SEC_PATTERNS.cmdInjection.test(p);
*/
`;

  await Bun.write("performance-fixes.ts", fixContent);
  console.log("");
  console.log("📁 Generated: performance-fixes.ts");
  console.log("");

  // Show fix summary table
  const fixSummary = bottlenecks.map((b, i) => ({
    "#": i + 1,
    ID: b.id,
    Fix: b.fix.slice(0, 50) + (b.fix.length > 50 ? "…" : ""),
    Effort: b.effort,
    Speedup: b.estimatedSpeedup,
  }));

  console.log(Bun.inspect.table(fixSummary, { colors: true }));

  return fixContent;
}

// ─────────────────────────────────────────────────────────────────────────────────
// BENCHMARK: Measure actual impact
// ─────────────────────────────────────────────────────────────────────────────────

async function runBenchmark() {
  console.log("");
  console.log("═".repeat(100));
  console.log("⏱️  BENCHMARK: Measuring Bottleneck Impact");
  console.log("═".repeat(100));
  console.log("");

  // BN-001: Fibonacci comparison
  console.log("BN-001: Fibonacci O(2^n) vs O(n)");
  console.log("─".repeat(50));

  const fibRecursive = (n: number): number => (n <= 1 ? n : fibRecursive(n - 1) + fibRecursive(n - 2));
  const fibIterative = (n: number): number => {
    if (n <= 1) return n;
    let [a, b] = [0, 1];
    for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
    return b;
  };

  const testValues = [10, 15, 20, 25, 30];
  const fibResults: { n: number; recursive: string; iterative: string; speedup: string }[] = [];

  for (const n of testValues) {
    // Only benchmark recursive up to 30 (otherwise too slow)
    const recursiveStart = Bun.nanoseconds();
    if (n <= 30) fibRecursive(n);
    const recursiveTime = Bun.nanoseconds() - recursiveStart;

    const iterativeStart = Bun.nanoseconds();
    fibIterative(n);
    const iterativeTime = Bun.nanoseconds() - iterativeStart;

    fibResults.push({
      n,
      recursive: n <= 30 ? `${(recursiveTime / 1000).toFixed(2)}µs` : "SKIPPED",
      iterative: `${(iterativeTime / 1000).toFixed(2)}µs`,
      speedup: n <= 30 ? `${(recursiveTime / iterativeTime).toFixed(0)}x` : "∞",
    });
  }

  console.log(Bun.inspect.table(fibResults, { colors: true }));

  // BN-003: Intl.Segmenter instantiation
  console.log("");
  console.log("BN-003: Intl.Segmenter - Per-call vs Singleton");
  console.log("─".repeat(50));

  const testString = "Hello 👨‍👩‍👧 World 🌍 日本語";
  const iterations = 100;

  // Per-call (bottleneck)
  const perCallStart = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    [...seg.segment(testString)];
  }
  const perCallTime = Bun.nanoseconds() - perCallStart;

  // Singleton (fixed)
  const singletonSeg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const singletonStart = Bun.nanoseconds();
  for (let i = 0; i < iterations; i++) {
    [...singletonSeg.segment(testString)];
  }
  const singletonTime = Bun.nanoseconds() - singletonStart;

  console.log(Bun.inspect.table([
    { method: "Per-call (bottleneck)", time: `${(perCallTime / 1e6).toFixed(2)}ms`, opsPerSec: `${(iterations / (perCallTime / 1e9)).toFixed(0)}/s` },
    { method: "Singleton (fixed)", time: `${(singletonTime / 1e6).toFixed(2)}ms`, opsPerSec: `${(iterations / (singletonTime / 1e9)).toFixed(0)}/s` },
    { method: "Speedup", time: `${(perCallTime / singletonTime).toFixed(1)}x`, opsPerSec: "-" },
  ], { colors: true }));

  // BN-005: Regex compilation
  console.log("");
  console.log("BN-005: Regex - Inline vs Pre-compiled");
  console.log("─".repeat(50));

  const testPattern = "https://example.com/api/users/:id/settings";
  const regexIterations = 1000;

  // Inline (bottleneck)
  const inlineStart = Bun.nanoseconds();
  for (let i = 0; i < regexIterations; i++) {
    /localhost|127\.0\.0\.1/.test(testPattern);
    /:password|:token|:secret/i.test(testPattern);
    /\.\.\/|\.\.\\/.test(testPattern);
  }
  const inlineTime = Bun.nanoseconds() - inlineStart;

  // Pre-compiled (fixed)
  const preSSRF = /localhost|127\.0\.0\.1/;
  const preCred = /:password|:token|:secret/i;
  const prePath = /\.\.\/|\.\.\\/;

  const precompiledStart = Bun.nanoseconds();
  for (let i = 0; i < regexIterations; i++) {
    preSSRF.test(testPattern);
    preCred.test(testPattern);
    prePath.test(testPattern);
  }
  const precompiledTime = Bun.nanoseconds() - precompiledStart;

  console.log(Bun.inspect.table([
    { method: "Inline regex (bottleneck)", time: `${(inlineTime / 1e6).toFixed(2)}ms`, iterations: regexIterations },
    { method: "Pre-compiled (fixed)", time: `${(precompiledTime / 1e6).toFixed(2)}ms`, iterations: regexIterations },
    { method: "Speedup", time: `${(inlineTime / precompiledTime).toFixed(1)}x`, iterations: "-" },
  ], { colors: true }));
}

// ─────────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────────

const args = new Set(Bun.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`
bottleneck-analysis.ts - Performance Bottleneck Analysis

Usage:
  bun bottleneck-analysis.ts [options]

Options:
  --summary     Show matrix-style bottleneck summary (default)
  --detail      Show detailed documentation for each bottleneck
  --fix         Generate automated fix file (performance-fixes.ts)
  --benchmark   Run actual benchmarks to measure impact
  --all         Run all analyses
  -h, --help    Show this help
`);
  process.exit(0);
}

const showSummary = args.has("--summary") || args.size === 0 || args.has("--all");
const showDetail = args.has("--detail") || args.has("--all");
const showFix = args.has("--fix") || args.has("--all");
const showBenchmark = args.has("--benchmark") || args.has("--all");

if (showSummary) analyzeBottlenecks();
if (showDetail) showDetailedAnalysis();
if (showFix) await generateFixes();
if (showBenchmark) await runBenchmark();

console.log("");
console.log("═".repeat(100));
console.log("✅ Analysis complete");
console.log("═".repeat(100));
