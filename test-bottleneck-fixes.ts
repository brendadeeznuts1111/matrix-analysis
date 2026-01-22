// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE BENCHMARK & EDGE CASE TESTS for Bottleneck Fixes
// ═══════════════════════════════════════════════════════════════════════════════

// Replicate the fixes from 50-col-matrix.ts
const fibCache = new Map<number, number>([[0, 0], [1, 1]]);
const fib = (n: number): number => {
  if (n < 0) return 0; // Handle negative edge case
  if (fibCache.has(n)) return fibCache.get(n)!;
  let [a, b] = [0, 1];
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  fibCache.set(n, b);
  return b;
};

const fibRecursive = (n: number): number => (n <= 1 ? n : fibRecursive(n - 1) + fibRecursive(n - 2));

const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: "grapheme" });

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
  cmdInjection: /(\||;|`|\$\(|&&)/,
} as const;

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let j = 2; j * j <= n; j++) if (n % j === 0) return false;
  return true;
};

const hash = (s: string): string => Bun.hash.crc32(s).toString(16).padStart(8, "0");

const calcEntropy = (s: string): number => {
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

const calcNestingDepth = (s: string): number => {
  let max = 0, cur = 0;
  for (const c of s) {
    if (c === "(" || c === "[" || c === "{") cur++;
    else if (c === ")" || c === "]" || c === "}") cur--;
    max = Math.max(max, cur);
  }
  return max;
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEST RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log("═".repeat(80));
console.log("COMPREHENSIVE BENCHMARK & EDGE CASE TESTS");
console.log("═".repeat(80));

// ─────────────────────────────────────────────────────────────────────────────
// BN-001: Fibonacci Benchmarks
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📊 BN-001: Fibonacci Performance\n" + "─".repeat(50));

const fibBench: { n: number; recursive: string; memoized: string; speedup: string; result: number }[] = [];

for (const n of [0, 1, 5, 10, 15, 20, 25, 30, 35, 40]) {
  // Memoized (always fast)
  fibCache.clear();
  fibCache.set(0, 0);
  fibCache.set(1, 1);
  const memoStart = Bun.nanoseconds();
  const memoResult = fib(n);
  const memoTime = Bun.nanoseconds() - memoStart;

  // Recursive (only up to n=30 to avoid timeout)
  let recTime = 0;
  if (n <= 30) {
    const recStart = Bun.nanoseconds();
    fibRecursive(n);
    recTime = Bun.nanoseconds() - recStart;
  }

  const speedup = recTime > 0 ? (recTime / memoTime).toFixed(0) + "x" : "∞";

  fibBench.push({
    n,
    recursive: recTime > 0 ? (recTime / 1000).toFixed(2) + "µs" : "skipped",
    memoized: (memoTime / 1000).toFixed(2) + "µs",
    speedup,
    result: memoResult,
  });
}

console.log(Bun.inspect.table(fibBench, { colors: true }));

// ─────────────────────────────────────────────────────────────────────────────
// BN-001: Fibonacci Edge Cases
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🧪 BN-001: Fibonacci Edge Cases\n" + "─".repeat(50));

// Reset cache for clean tests
fibCache.clear();
fibCache.set(0, 0);
fibCache.set(1, 1);

const fibEdgeCases: { case: string; input: number; expected: number; actual: number; pass: string }[] = [
  { case: "fib(0)", input: 0, expected: 0, actual: fib(0), pass: "" },
  { case: "fib(1)", input: 1, expected: 1, actual: fib(1), pass: "" },
  { case: "fib(2)", input: 2, expected: 1, actual: fib(2), pass: "" },
  { case: "fib(10)", input: 10, expected: 55, actual: fib(10), pass: "" },
  { case: "fib(20)", input: 20, expected: 6765, actual: fib(20), pass: "" },
  { case: "fib(negative)", input: -1, expected: 0, actual: fib(-1), pass: "" },
  { case: "fib(50)", input: 50, expected: 12586269025, actual: fib(50), pass: "" },
  { case: "fib(cache hit)", input: 50, expected: 12586269025, actual: fib(50), pass: "" },
];

fibEdgeCases.forEach(t => t.pass = t.actual === t.expected ? "✅" : "❌");
console.log(Bun.inspect.table(fibEdgeCases, { colors: true }));

// ─────────────────────────────────────────────────────────────────────────────
// BN-003: Intl.Segmenter Edge Cases
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🧪 BN-003: Intl.Segmenter Edge Cases\n" + "─".repeat(50));

const segmenterCases: { case: string; input: string; graphemes: number; chars: number; pass: string }[] = [
  { case: "Empty string", input: "", graphemes: 0, chars: 0, pass: "" },
  { case: "ASCII", input: "hello", graphemes: 5, chars: 5, pass: "" },
  { case: "Emoji", input: "👋🌍", graphemes: 2, chars: 4, pass: "" },
  { case: "ZWJ family", input: "👨‍👩‍👧", graphemes: 1, chars: 8, pass: "" },
  { case: "Flag emoji", input: "🇺🇸", graphemes: 1, chars: 4, pass: "" },
  { case: "Skin tone", input: "👋🏽", graphemes: 1, chars: 4, pass: "" },
  { case: "Combining marks", input: "é", graphemes: 1, chars: 1, pass: "" },
  { case: "Korean", input: "한글", graphemes: 2, chars: 2, pass: "" },
  { case: "CJK", input: "中文", graphemes: 2, chars: 2, pass: "" },
  { case: "Mixed", input: "Hi👋世界", graphemes: 5, chars: 6, pass: "" },
];

segmenterCases.forEach(t => {
  const actual = [...GRAPHEME_SEGMENTER.segment(t.input)].length;
  t.pass = actual === t.graphemes ? "✅" : "❌ got " + actual;
});

console.log(Bun.inspect.table(segmenterCases, { colors: true }));

// Benchmark singleton vs per-call
console.log("\n📊 BN-003: Segmenter Performance (1000 iterations)\n" + "─".repeat(50));

const testStrings = ["hello", "👨‍👩‍👧‍👦", "中文テスト", "🇺🇸🇬🇧🇫🇷"];
const segBench: { input: string; perCall: string; singleton: string; speedup: string }[] = [];

for (const s of testStrings) {
  // Per-call (bottleneck)
  const perCallStart = Bun.nanoseconds();
  for (let i = 0; i < 1000; i++) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    [...seg.segment(s)];
  }
  const perCallTime = Bun.nanoseconds() - perCallStart;

  // Singleton (fixed)
  const singletonStart = Bun.nanoseconds();
  for (let i = 0; i < 1000; i++) {
    [...GRAPHEME_SEGMENTER.segment(s)];
  }
  const singletonTime = Bun.nanoseconds() - singletonStart;

  segBench.push({
    input: s.length > 10 ? s.slice(0, 8) + "..." : s,
    perCall: (perCallTime / 1e6).toFixed(2) + "ms",
    singleton: (singletonTime / 1e6).toFixed(2) + "ms",
    speedup: (perCallTime / singletonTime).toFixed(1) + "x",
  });
}

console.log(Bun.inspect.table(segBench, { colors: true }));

// ─────────────────────────────────────────────────────────────────────────────
// BN-005: Security Regex Edge Cases
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🧪 BN-005: Security Regex Edge Cases\n" + "─".repeat(50));

const securityCases: { pattern: string; check: string; expected: boolean; actual: boolean; pass: string }[] = [
  // Path traversal
  { pattern: "/files/../etc/passwd", check: "pathTraversal", expected: true, actual: false, pass: "" },
  { pattern: "/files/..\\windows", check: "pathTraversal", expected: true, actual: false, pass: "" },
  { pattern: "/api/users/:id", check: "pathTraversal", expected: false, actual: false, pass: "" },

  // SSRF
  { pattern: "http://localhost:8080", check: "ssrf", expected: true, actual: false, pass: "" },
  { pattern: "http://127.0.0.1/admin", check: "ssrf", expected: true, actual: false, pass: "" },
  { pattern: "http://internal.corp", check: "ssrf", expected: true, actual: false, pass: "" },
  { pattern: "https://api.example.com", check: "ssrf", expected: false, actual: false, pass: "" },

  // Credentials
  { pattern: "/api/:password", check: "credential", expected: true, actual: false, pass: "" },
  { pattern: "/api/:token/verify", check: "credential", expected: true, actual: false, pass: "" },
  { pattern: "/api/:id", check: "credential", expected: false, actual: false, pass: "" },

  // XSS vectors
  { pattern: "/page/<script>", check: "xss", expected: true, actual: false, pass: "" },
  { pattern: "/redirect?url=javascript:", check: "xss", expected: true, actual: false, pass: "" },
  { pattern: "/api/data", check: "xss", expected: false, actual: false, pass: "" },

  // SQL injection
  { pattern: "/search?q=' OR 1=1", check: "sql", expected: true, actual: false, pass: "" },
  { pattern: "/api/users--", check: "sql", expected: true, actual: false, pass: "" },
  { pattern: "/api/users/:id", check: "sql", expected: false, actual: false, pass: "" },

  // Command injection
  { pattern: "/exec?cmd=ls|cat", check: "cmdInjection", expected: true, actual: false, pass: "" },
  { pattern: "/run?cmd=$(whoami)", check: "cmdInjection", expected: true, actual: false, pass: "" },
  { pattern: "/api/execute", check: "cmdInjection", expected: false, actual: false, pass: "" },
];

securityCases.forEach(t => {
  t.actual = SEC_PATTERNS[t.check as keyof typeof SEC_PATTERNS].test(t.pattern);
  t.pass = t.actual === t.expected ? "✅" : "❌";
});

console.log(Bun.inspect.table(securityCases, { colors: true }));

// ─────────────────────────────────────────────────────────────────────────────
// BN-004: Helper Functions Edge Cases
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🧪 BN-004: Helper Functions Edge Cases\n" + "─".repeat(50));

// isPrime
const primeCases: { n: number; expected: boolean; actual: boolean; pass: string }[] = [
  { n: -1, expected: false, actual: isPrime(-1), pass: "" },
  { n: 0, expected: false, actual: isPrime(0), pass: "" },
  { n: 1, expected: false, actual: isPrime(1), pass: "" },
  { n: 2, expected: true, actual: isPrime(2), pass: "" },
  { n: 3, expected: true, actual: isPrime(3), pass: "" },
  { n: 4, expected: false, actual: isPrime(4), pass: "" },
  { n: 17, expected: true, actual: isPrime(17), pass: "" },
  { n: 100, expected: false, actual: isPrime(100), pass: "" },
  { n: 997, expected: true, actual: isPrime(997), pass: "" },
];
primeCases.forEach(t => t.pass = t.actual === t.expected ? "✅" : "❌");

console.log("isPrime tests:");
console.log(Bun.inspect.table(primeCases, { colors: true }));

// hash (CRC32)
const hashCases: { input: string; length: number; consistent: boolean; pass: string }[] = [
  { input: "", length: 8, consistent: hash("") === hash(""), pass: "" },
  { input: "hello", length: 8, consistent: hash("hello") === hash("hello"), pass: "" },
  { input: "Hello", length: 8, consistent: hash("Hello") !== hash("hello"), pass: "" },
  { input: "a".repeat(1000), length: 8, consistent: hash("a".repeat(1000)) === hash("a".repeat(1000)), pass: "" },
  { input: "👋🌍", length: 8, consistent: hash("👋🌍") === hash("👋🌍"), pass: "" },
];
hashCases.forEach(t => {
  const h = hash(t.input);
  t.pass = h.length === t.length && t.consistent ? "✅" : "❌";
});

console.log("\nhash (CRC32) tests:");
console.log(Bun.inspect.table(hashCases, { colors: true }));

// calcEntropy
const entropyCases: { input: string; minEntropy: number; maxEntropy: number; actual: number; pass: string }[] = [
  { input: "aaaa", minEntropy: 0, maxEntropy: 0.01, actual: 0, pass: "" },
  { input: "abcd", minEntropy: 1.9, maxEntropy: 2.1, actual: 0, pass: "" },
  { input: "aabb", minEntropy: 0.9, maxEntropy: 1.1, actual: 0, pass: "" },
  { input: "", minEntropy: 0, maxEntropy: 0, actual: 0, pass: "" },
];
entropyCases.forEach(t => {
  t.actual = calcEntropy(t.input);
  t.pass = t.actual >= t.minEntropy && t.actual <= t.maxEntropy ? "✅" : "❌";
});

console.log("\ncalcEntropy tests:");
console.log(Bun.inspect.table(entropyCases, { colors: true }));

// calcNestingDepth
const nestingCases: { input: string; expected: number; actual: number; pass: string }[] = [
  { input: "abc", expected: 0, actual: calcNestingDepth("abc"), pass: "" },
  { input: "(a)", expected: 1, actual: calcNestingDepth("(a)"), pass: "" },
  { input: "((a))", expected: 2, actual: calcNestingDepth("((a))"), pass: "" },
  { input: "([{a}])", expected: 3, actual: calcNestingDepth("([{a}])"), pass: "" },
  { input: "(a)(b)", expected: 1, actual: calcNestingDepth("(a)(b)"), pass: "" },
  { input: "", expected: 0, actual: calcNestingDepth(""), pass: "" },
];
nestingCases.forEach(t => t.pass = t.actual === t.expected ? "✅" : "❌");

console.log("\ncalcNestingDepth tests:");
console.log(Bun.inspect.table(nestingCases, { colors: true }));

// ─────────────────────────────────────────────────────────────────────────────
// BN-005: Regex Benchmark
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📊 BN-005: Regex Performance (10000 iterations)\n" + "─".repeat(50));

const testPatterns = [
  "/api/../secret",
  "http://localhost:3000/admin",
  "/users/:password/reset",
  "/page?q=' OR 1=1--",
];

const regexBench: { pattern: string; inline: string; precompiled: string; speedup: string }[] = [];

for (const p of testPatterns) {
  // Inline regex (bottleneck)
  const inlineStart = Bun.nanoseconds();
  for (let i = 0; i < 10000; i++) {
    /\.\.\/|\.\.\\/.test(p);
    /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(p);
    /:password|:token|:secret/i.test(p);
    /(\bor\b|\band\b|--|;|')/i.test(p);
  }
  const inlineTime = Bun.nanoseconds() - inlineStart;

  // Pre-compiled (fixed)
  const precompiledStart = Bun.nanoseconds();
  for (let i = 0; i < 10000; i++) {
    SEC_PATTERNS.pathTraversal.test(p);
    SEC_PATTERNS.ssrf.test(p);
    SEC_PATTERNS.credential.test(p);
    SEC_PATTERNS.sql.test(p);
  }
  const precompiledTime = Bun.nanoseconds() - precompiledStart;

  regexBench.push({
    pattern: p.length > 20 ? p.slice(0, 18) + "..." : p,
    inline: (inlineTime / 1e6).toFixed(2) + "ms",
    precompiled: (precompiledTime / 1e6).toFixed(2) + "ms",
    speedup: (inlineTime / precompiledTime).toFixed(1) + "x",
  });
}

console.log(Bun.inspect.table(regexBench, { colors: true }));

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(80));
console.log("SUMMARY");
console.log("═".repeat(80));

const allTests = [
  ...fibEdgeCases.map(t => ({ category: "BN-001 Fibonacci", pass: t.pass === "✅" })),
  ...segmenterCases.map(t => ({ category: "BN-003 Segmenter", pass: t.pass === "✅" })),
  ...securityCases.map(t => ({ category: "BN-005 Security", pass: t.pass === "✅" })),
  ...primeCases.map(t => ({ category: "BN-004 isPrime", pass: t.pass === "✅" })),
  ...hashCases.map(t => ({ category: "BN-004 hash", pass: t.pass === "✅" })),
  ...entropyCases.map(t => ({ category: "BN-004 entropy", pass: t.pass === "✅" })),
  ...nestingCases.map(t => ({ category: "BN-004 nesting", pass: t.pass === "✅" })),
];

const summary = Object.entries(
  allTests.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = { passed: 0, failed: 0 };
    if (t.pass) acc[t.category].passed++;
    else acc[t.category].failed++;
    return acc;
  }, {} as Record<string, { passed: number; failed: number }>)
).map(([category, { passed, failed }]) => ({
  Category: category,
  Passed: passed,
  Failed: failed,
  Status: failed === 0 ? "✅ PASS" : "❌ FAIL",
}));

console.log(Bun.inspect.table(summary, { colors: true }));

const totalPassed = allTests.filter(t => t.pass).length;
const totalFailed = allTests.filter(t => !t.pass).length;
console.log(`\nTotal: ${totalPassed}/${allTests.length} passed, ${totalFailed} failed`);
console.log(totalFailed === 0 ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED");
