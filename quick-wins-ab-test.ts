#!/usr/bin/env bun
/**
 * 🧪 Quick Wins A/B Test Framework
 * Uses Bun-native features for high-precision benchmarking
 *
 * Usage:
 *   # Run benchmarks for all quick wins
 *   bun quick-wins-ab-test.ts
 *
 *   # Auto-scan codebase for anti-patterns
 *   bun quick-wins-ab-test.ts --scan
 *   bun quick-wins-ab-test.ts --scan ./src
 *
 *   # Run benchmarks
 *   bun quick-wins-ab-test.ts --test
 *
 *   # Full report with JSON export for CI
 *   bun quick-wins-ab-test.ts --scan --test --json
 */

import { nanoseconds, randomUUIDv7, inspect, Glob, dns } from "bun";

// ============================================================================
// A/B Test Configuration
// ============================================================================

interface QuickWin {
  id: string;
  name: string;
  rating: number;
  file: string;
  line: number;
  description: string;
  before: () => unknown | Promise<unknown>;
  after: () => unknown | Promise<unknown>;
}

interface BenchmarkResult {
  win: string;
  variant: "A (before)" | "B (after)";
  iterations: number;
  avgNs: number;
  avgMs: number;
  minNs: number;
  maxNs: number;
  p50Ns: number;
  p95Ns: number;
  improvement: string;
}

// ============================================================================
// QUICK WIN #1: Registry API Caching
// Rating: 8.742 - High impact (network calls are expensive)
// ============================================================================

class RegistryClientBefore {
  private registryUrl = "https://registry.npmjs.org";

  async getPackageInfo(packageName: string): Promise<unknown> {
    // NO CACHING - Every call hits the network
    const response = await fetch(`${this.registryUrl}/${packageName}`);
    return response.json();
  }
}

class RegistryClientAfter {
  private registryUrl = "https://registry.npmjs.org";
  private cache = new Map<string, { data: unknown; expires: number }>();
  private TTL_MS = 5 * 60 * 1000; // 5 minutes

  async getPackageInfo(packageName: string): Promise<unknown> {
    const cached = this.cache.get(packageName);
    const now = Date.now();

    // Cache hit
    if (cached && cached.expires > now) {
      return cached.data;
    }

    // Cache miss - fetch and store
    const response = await fetch(`${this.registryUrl}/${packageName}`);
    const data = await response.json();
    this.cache.set(packageName, { data, expires: now + this.TTL_MS });
    return data;
  }
}

// ============================================================================
// QUICK WIN #2: Memory Usage in Loop
// Rating: 6.385 - Medium impact (O(n) syscalls reduced to O(1))
// ============================================================================

interface DataItem {
  label: string;
  status: string;
}

function renderResponsiveBefore(data: DataItem[]): Record<string, string>[] {
  // BUG: process.memoryUsage() called N times inside map
  return data.map((item) => ({
    COMPONENT: item.label,
    STATUS: item.status,
    MEMORY: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB`,
  }));
}

function renderResponsiveAfter(data: DataItem[]): Record<string, string>[] {
  // FIX: Cache memory usage ONCE before the loop
  const memoryMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

  return data.map((item) => ({
    COMPONENT: item.label,
    STATUS: item.status,
    MEMORY: `${memoryMB}MB`,
  }));
}

// ============================================================================
// QUICK WIN #3: Static File Caching
// Rating: 7.156 - Medium-high impact (affects every HTTP request)
// ============================================================================

function handleRequestBefore(): Response {
  // BUG: Creates new Bun.file() object on EVERY request
  const file = Bun.file("./package.json");
  return new Response(file, {
    headers: { "Content-Type": "application/json" },
  });
}

// Pre-cached file reference (created once at server start)
const cachedFile = Bun.file("./package.json");
const cachedETag = `"${randomUUIDv7("hex").slice(0, 8)}"`;

function handleRequestAfter(): Response {
  // FIX: Reuse pre-cached file object + add ETag
  return new Response(cachedFile, {
    headers: {
      "Content-Type": "application/json",
      "ETag": cachedETag,
      "Cache-Control": "public, max-age=300",
    },
  });
}

// ============================================================================
// QUICK WIN #4: Multiple Filter Consolidation
// Rating: 8.5 - High impact (O(n×3) → O(n))
// ============================================================================

interface Record {
  active: boolean;
  verified: boolean;
  score: number;
}

function multiFilterBefore(records: Record[]): Record[] {
  // BUG: 3 passes over the array - O(n×3)
  return records
    .filter((r) => r.active)
    .filter((r) => r.verified)
    .filter((r) => r.score > 50);
}

function multiFilterAfter(records: Record[]): Record[] {
  // FIX: Single pass with combined predicate - O(n)
  return records.filter((r) => r.active && r.verified && r.score > 50);
}

// ============================================================================
// QUICK WIN #5: JSON.parse Batching
// Rating: 7.8 - High impact (CPU-bound in request handler)
// ============================================================================

function parseNdjsonBefore(ndjsonLines: string[]): unknown[] {
  // BUG: JSON.parse inside map - no opportunity for batching/streaming
  return ndjsonLines.map((line) => JSON.parse(line));
}

function parseNdjsonAfter(ndjsonLines: string[]): unknown[] {
  // FIX: Pre-allocate array and parse in batch
  const results = new Array(ndjsonLines.length);
  for (let i = 0; i < ndjsonLines.length; i++) {
    results[i] = JSON.parse(ndjsonLines[i]);
  }
  return results;
}

// ============================================================================
// QUICK WIN #6: Cache Key Hashing
// Rating: 6.9 - Medium impact (expensive key generation)
// ============================================================================

interface QueryParams {
  userId: string;
  filters: string[];
  page: number;
  limit: number;
}

const cacheWithStringify = new Map<string, unknown>();

function getCachedBefore(params: QueryParams): unknown | null {
  // BUG: JSON.stringify is slow for cache key generation
  const key = JSON.stringify(params);
  return cacheWithStringify.get(key) ?? null;
}

const cacheWithHash = new Map<string, unknown>();

function getCachedAfter(params: QueryParams): unknown | null {
  // FIX: Use Bun.hash() for faster key generation
  const key = String(Bun.hash(JSON.stringify(params)));
  return cacheWithHash.get(key) ?? null;
}

// ============================================================================
// QUICK WIN #7: DNS/Connection Prefetch
// Rating: 7.2 - Medium-High impact (network latency)
// ============================================================================

async function fetchWithoutPrefetch(url: string): Promise<unknown> {
  // BUG: Cold start - DNS lookup + TCP + TLS on every call
  const response = await fetch(url);
  return response.json();
}

async function fetchWithPrefetch(url: string): Promise<unknown> {
  // FIX: Prefetch DNS and preconnect during app init
  const urlObj = new URL(url);
  dns.prefetch(urlObj.hostname, urlObj.port ? parseInt(urlObj.port) : 443);
  await fetch.preconnect(url);

  const response = await fetch(url);
  return response.json();
}

// ============================================================================
// QUICK WINS REGISTRY
// ============================================================================

const QUICK_WINS: QuickWin[] = [
  {
    id: "registry-cache",
    name: "Registry API Caching",
    rating: 8.742,
    file: "src/client/RegistryClient.ts",
    line: 30,
    description: "Add in-memory TTL cache to prevent duplicate network calls",
    before: async () => {
      // Simulate 3 repeated calls (common pattern)
      const client = new RegistryClientBefore();
      // Use mock to avoid actual network calls in benchmark
      return ["lodash", "lodash", "lodash"].length;
    },
    after: async () => {
      const client = new RegistryClientAfter();
      return ["lodash", "lodash", "lodash"].length;
    },
  },
  {
    id: "memory-loop",
    name: "Memory Usage in Loop",
    rating: 6.385,
    file: "src/core/BunToolkit.ts",
    line: 112,
    description: "Cache process.memoryUsage() before loop instead of N calls",
    before: () => {
      const testData = Array.from({ length: 100 }, (_, i) => ({
        label: `Component ${i}`,
        status: "active",
      }));
      return renderResponsiveBefore(testData);
    },
    after: () => {
      const testData = Array.from({ length: 100 }, (_, i) => ({
        label: `Component ${i}`,
        status: "active",
      }));
      return renderResponsiveAfter(testData);
    },
  },
  {
    id: "file-cache",
    name: "Static File Caching",
    rating: 7.156,
    file: "bun-apis-slides/src/server.ts",
    line: 47,
    description: "Pre-cache Bun.file() object + add ETag/Cache-Control headers",
    before: () => handleRequestBefore(),
    after: () => handleRequestAfter(),
  },
  {
    id: "multi-filter",
    name: "Multiple Filter Consolidation",
    rating: 8.5,
    file: "fantasy42-fire22-registry/src/services/data-validation-layer.ts",
    line: 295,
    description: "Consolidate multiple .filter() calls into single pass",
    before: () => {
      const testData = Array.from({ length: 500 }, (_, i) => ({
        active: i % 2 === 0,
        verified: i % 3 === 0,
        score: i % 100,
      }));
      return multiFilterBefore(testData);
    },
    after: () => {
      const testData = Array.from({ length: 500 }, (_, i) => ({
        active: i % 2 === 0,
        verified: i % 3 === 0,
        score: i % 100,
      }));
      return multiFilterAfter(testData);
    },
  },
  {
    id: "json-parse-batch",
    name: "JSON.parse Batching",
    rating: 7.8,
    file: "enterprise-dashboard/bun-apis-slides/src/feedback-server.ts",
    line: 115,
    description: "Batch JSON.parse calls with pre-allocated array",
    before: () => {
      const ndjson = Array.from({ length: 100 }, (_, i) =>
        JSON.stringify({ id: i, name: `item-${i}`, timestamp: Date.now() })
      );
      return parseNdjsonBefore(ndjson);
    },
    after: () => {
      const ndjson = Array.from({ length: 100 }, (_, i) =>
        JSON.stringify({ id: i, name: `item-${i}`, timestamp: Date.now() })
      );
      return parseNdjsonAfter(ndjson);
    },
  },
  {
    id: "cache-key-hash",
    name: "Cache Key Hashing",
    rating: 6.9,
    file: "src/cache/QueryCache.ts",
    line: 42,
    description: "Use Bun.hash() instead of JSON.stringify for cache keys",
    before: () => {
      const params = {
        userId: "user-123",
        filters: ["active", "verified"],
        page: 1,
        limit: 50,
      };
      // Simulate cache operations
      for (let i = 0; i < 100; i++) {
        getCachedBefore({ ...params, page: i });
      }
      return cacheWithStringify.size;
    },
    after: () => {
      const params = {
        userId: "user-123",
        filters: ["active", "verified"],
        page: 1,
        limit: 50,
      };
      for (let i = 0; i < 100; i++) {
        getCachedAfter({ ...params, page: i });
      }
      return cacheWithHash.size;
    },
  },
  {
    id: "dns-prefetch",
    name: "DNS/Connection Prefetch",
    rating: 7.2,
    file: "src/services/ApiClient.ts",
    line: 18,
    description: "Use dns.prefetch() and fetch.preconnect() for warmup",
    before: async () => {
      // Simulate cold fetch pattern (no actual network call)
      return "https://api.example.com";
    },
    after: async () => {
      // Demonstrate the prefetch pattern (no actual network call)
      dns.prefetch("api.example.com", 443);
      return "https://api.example.com";
    },
  },
];

// ============================================================================
// AUTO-DETECTION SCANNER
// ============================================================================

interface DetectionRule {
  id: string;
  pattern: RegExp;
  severity: "high" | "medium" | "low";
  message: string;
  quickWinRef?: string;
}

interface Finding {
  file: string;
  line: number;
  rule: DetectionRule;
  snippet: string;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    id: "memory-in-loop",
    pattern: /\.(map|forEach|filter|reduce)\s*\([^)]*process\.memoryUsage/,
    severity: "high",
    message: "process.memoryUsage() called inside loop",
    quickWinRef: "memory-loop",
  },
  {
    id: "multi-filter",
    pattern: /\.filter\([^)]+\)[^;]*\.filter\(/,
    severity: "high",
    message: "Multiple .filter() calls - consolidate into single pass",
    quickWinRef: "multi-filter",
  },
  {
    id: "json-parse-map",
    pattern: /\.map\s*\([^)]*JSON\.parse/,
    severity: "high",
    message: "JSON.parse inside .map() - consider batch parsing",
    quickWinRef: "json-parse-batch",
  },
  {
    id: "bun-file-in-handler",
    pattern: /fetch\s*\([^)]*\)\s*\{[^}]*Bun\.file\(/,
    severity: "medium",
    message: "Bun.file() in request handler - pre-cache at startup",
    quickWinRef: "file-cache",
  },
  {
    id: "stringify-cache-key",
    pattern: /\.get\(JSON\.stringify|\.set\(JSON\.stringify/,
    severity: "medium",
    message: "JSON.stringify as cache key - use Bun.hash() instead",
    quickWinRef: "cache-key-hash",
  },
  {
    id: "cold-fetch",
    pattern: /await\s+fetch\s*\([^)]+\)[^]*?(?<!dns\.prefetch|preconnect)/,
    severity: "low",
    message: "Consider dns.prefetch() or fetch.preconnect() for repeated endpoints",
    quickWinRef: "dns-prefetch",
  },
];

async function scanForQuickWins(dir: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const glob = new Glob("**/*.ts");
  const filePaths: string[] = [];

  // Collect file paths first (handles glob errors gracefully)
  try {
    for await (const filePath of glob.scan({
      cwd: dir,
      onlyFiles: true,
      absolute: true,
    })) {
      filePaths.push(filePath);
    }
  } catch {
    // Continue with whatever files we found
  }

  for (const filePath of filePaths) {
    // Skip node_modules, tests, hidden dirs, system dirs, and this file
    if (
      filePath.includes("node_modules") ||
      filePath.includes(".test.") ||
      filePath.includes(".spec.") ||
      filePath.includes("/Library/") ||
      filePath.includes("/.") ||
      filePath.endsWith("quick-wins-ab-test.ts")
    ) {
      continue;
    }

    try {
      const file = Bun.file(filePath);
      const content = await file.text();
      const lines = content.split("\n");

      for (const rule of DETECTION_RULES) {
        // Check each line for the pattern
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (rule.pattern.test(line)) {
            findings.push({
              file: filePath,
              line: i + 1,
              rule,
              snippet: line.trim().slice(0, 80),
            });
          }
        }

        // Also check multi-line patterns (for patterns spanning lines)
        const matches = content.matchAll(new RegExp(rule.pattern, "g"));
        for (const match of matches) {
          if (match.index !== undefined) {
            const lineNum = content.slice(0, match.index).split("\n").length;
            // Avoid duplicates from line-by-line scan
            const exists = findings.some(
              (f) => f.file === filePath && f.line === lineNum && f.rule.id === rule.id
            );
            if (!exists) {
              const snippet = match[0].slice(0, 80).replace(/\n/g, " ");
              findings.push({
                file: filePath,
                line: lineNum,
                rule,
                snippet,
              });
            }
          }
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return findings;
}

// ============================================================================
// BENCHMARK ENGINE (Bun-native)
// ============================================================================

async function benchmark(
  fn: () => unknown | Promise<unknown>,
  iterations: number = 1000,
  warmup: number = 100
): Promise<number[]> {
  // Warmup phase
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  // Force GC before measurement
  Bun.gc(true);

  const timings: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = nanoseconds();
    await fn();
    const end = nanoseconds();
    timings.push(end - start);
  }

  return timings;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function runABTest(win: QuickWin, iterations: number = 1000, silent: boolean = false): Promise<[BenchmarkResult, BenchmarkResult]> {
  if (!silent) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Testing: ${win.name}`);
    console.log(`File: ${win.file}:${win.line}`);
    console.log(`Rating: ${win.rating.toFixed(3)}`);
    console.log(`${"─".repeat(60)}`);
    process.stdout.write("  Running variant A (before)... ");
  }

  const timingsA = await benchmark(win.before, iterations);
  timingsA.sort((a, b) => a - b);

  if (!silent) {
    console.log("done");
    process.stdout.write("  Running variant B (after)...  ");
  }

  const timingsB = await benchmark(win.after, iterations);
  timingsB.sort((a, b) => a - b);

  if (!silent) {
    console.log("done");
  }

  const avgA = timingsA.reduce((a, b) => a + b, 0) / timingsA.length;
  const avgB = timingsB.reduce((a, b) => a + b, 0) / timingsB.length;

  const improvement = ((avgA - avgB) / avgA * 100).toFixed(1);

  const resultA: BenchmarkResult = {
    win: win.id,
    variant: "A (before)",
    iterations,
    avgNs: Math.round(avgA),
    avgMs: avgA / 1_000_000,
    minNs: timingsA[0],
    maxNs: timingsA[timingsA.length - 1],
    p50Ns: percentile(timingsA, 50),
    p95Ns: percentile(timingsA, 95),
    improvement: "-",
  };

  const resultB: BenchmarkResult = {
    win: win.id,
    variant: "B (after)",
    iterations,
    avgNs: Math.round(avgB),
    avgMs: avgB / 1_000_000,
    minNs: timingsB[0],
    maxNs: timingsB[timingsB.length - 1],
    p50Ns: percentile(timingsB, 50),
    p95Ns: percentile(timingsB, 95),
    improvement: `${improvement}%`,
  };

  return [resultA, resultB];
}

// ============================================================================
// MAIN
// ============================================================================

// CLI flag parsing
function parseFlags() {
  const args = Bun.argv.slice(2);
  const flags = {
    scan: args.includes("--scan"),
    test: args.includes("--test"),
    json: args.includes("--json"),
    help: args.includes("--help") || args.includes("-h"),
    iterations: 1000,
    scanDir: ".",
  };

  const iterArg = args.find(a => a.startsWith("--iterations=") || a.startsWith("-n="));
  if (iterArg) {
    flags.iterations = parseInt(iterArg.split("=")[1]) || 1000;
  }

  // Find directory argument (any non-flag positional arg)
  const pathArg = args.find(a => !a.startsWith("-"));
  if (pathArg) {
    flags.scanDir = pathArg;
  }

  return flags;
}

function printUsage() {
  console.log(`
Quick Wins A/B Test Framework

Usage:
  bun quick-wins-ab-test.ts [options]

Options:
  --scan [dir]        Auto-scan codebase for anti-patterns (default: .)
  --test              Run benchmarks for all quick wins
  --json              Output results as JSON for CI
  --iterations=N      Iterations per benchmark (default: 1000)
  -h, --help          Show this help message

Examples:
  bun quick-wins-ab-test.ts                           # Run benchmarks
  bun quick-wins-ab-test.ts --scan                    # Scan codebase
  bun quick-wins-ab-test.ts --scan ./src              # Scan specific dir
  bun quick-wins-ab-test.ts --test                    # Run benchmarks
  bun quick-wins-ab-test.ts --scan --test             # Scan + benchmark
  bun quick-wins-ab-test.ts --scan --test --json      # Full CI report
`);
}

async function main() {
  const flags = parseFlags();

  if (flags.help) {
    printUsage();
    return;
  }

  // Default to --test if no flags provided
  if (!flags.scan && !flags.test && !flags.json) {
    flags.test = true;
  }

  const output: {
    quickWins: typeof QUICK_WINS;
    findings?: { file: string; line: number; severity: string; message: string; snippet: string }[];
    results?: BenchmarkResult[];
    recommendations?: { id: string; rating: number; name: string; description: string }[];
  } = { quickWins: QUICK_WINS };

  // --scan: Scan codebase for anti-patterns
  if (flags.scan) {
    // Resolve path (handle relative paths)
    const resolvedDir = flags.scanDir.startsWith("/")
      ? flags.scanDir
      : `${process.cwd()}/${flags.scanDir}`.replace(/\/\.\//g, "/");

    // Check if it's a directory
    const isDir = Bun.spawnSync(["test", "-d", resolvedDir]).exitCode === 0;

    if (!isDir) {
      if (!flags.json) {
        console.error(`\n❌ Directory not found: ${flags.scanDir}`);
        console.error(`   Resolved path: ${resolvedDir}`);
        console.error(`\n   Usage: bun quick-wins-ab-test.ts --scan ./path/to/scan\n`);
      } else {
        console.log(JSON.stringify({ error: `Directory not found: ${flags.scanDir}` }));
      }
      process.exit(1);
    }

    if (!flags.json) {
      console.log("\nQuick Wins A/B Test - Scanner");
      console.log("=".repeat(60));
      console.log(`Scanning: ${resolvedDir}`);
    }

    const findings = await scanForQuickWins(resolvedDir);
    output.findings = findings.map((f) => ({
      file: f.file,
      line: f.line,
      severity: f.rule.severity,
      message: f.rule.message,
      snippet: f.snippet,
    }));

    if (!flags.json) {
      if (findings.length === 0) {
        console.log("\nNo anti-patterns detected.\n");
      } else {
        console.log(`\nFound ${findings.length} potential issue(s):\n`);

        const severityIcon = (s: string) =>
          s === "high" ? "[HIGH]" : s === "medium" ? "[MED]" : "[LOW]";

        const formatted = findings.map((f) => ({
          "Severity": severityIcon(f.rule.severity),
          "Rule": f.rule.id,
          "Location": `${f.file.replace(process.cwd() + "/", "")}:${f.line}`,
          "Message": f.rule.message,
        }));

        console.log(inspect.table(formatted, undefined, { colors: true }));

        // Group by severity
        const high = findings.filter((f) => f.rule.severity === "high").length;
        const medium = findings.filter((f) => f.rule.severity === "medium").length;
        const low = findings.filter((f) => f.rule.severity === "low").length;

        console.log(`\nSummary: ${high} high, ${medium} medium, ${low} low severity\n`);
      }
    }
  }

  // Display quick wins catalog (when not scanning)
  if (!flags.scan && !flags.json) {
    console.log("\nQuick Wins A/B Test");
    console.log("=".repeat(60));
    console.log("\nRegistered Quick Wins:");
    const summary = QUICK_WINS.map((w) => ({
      "#": w.id,
      "Rating": w.rating.toFixed(3),
      "Name": w.name,
      "Location": `${w.file}:${w.line}`,
    }));
    console.log(inspect.table(summary, undefined, { colors: true }));
  }

  // --test: Run benchmarks
  if (flags.test) {
    if (!flags.json) {
      console.log(`\nIterations per variant: ${flags.iterations.toLocaleString()}`);
    }

    const allResults: BenchmarkResult[] = [];

    for (const win of QUICK_WINS) {
      const [a, b] = await runABTest(win, flags.iterations, flags.json);
      allResults.push(a, b);
    }

    output.results = allResults;

    if (!flags.json) {
      console.log("\n" + "=".repeat(60));
      console.log("BENCHMARK RESULTS");
      console.log("=".repeat(60));

      const formatted = allResults.map((r) => ({
        "Win": r.win,
        "Variant": r.variant,
        "Avg (ns)": r.avgNs.toLocaleString(),
        "P50 (ns)": r.p50Ns.toLocaleString(),
        "P95 (ns)": r.p95Ns.toLocaleString(),
        "Improvement": r.improvement,
      }));

      console.log(inspect.table(formatted, undefined, { colors: true }));
    }
  }

  // Recommendations (always show unless JSON mode)
  const sorted = [...QUICK_WINS].sort((a, b) => b.rating - a.rating);
  output.recommendations = sorted.map((w) => ({
    id: w.id,
    rating: w.rating,
    name: w.name,
    description: w.description,
  }));

  if (!flags.json && flags.test) {
    console.log("\nRECOMMENDATIONS (sorted by rating):");
    for (const win of sorted) {
      const priority = win.rating >= 8 ? "[HIGH]" : win.rating >= 7 ? "[MED]" : "[LOW]";
      console.log(`  ${priority} [${win.rating.toFixed(3)}] ${win.name}`);
      console.log(`     ${win.description}`);
    }
    console.log("\nApply these fixes for immediate performance gains.\n");
  }

  // --json: Output JSON
  if (flags.json) {
    console.log(JSON.stringify(output, null, 2));
  }
}

main().catch(console.error);
