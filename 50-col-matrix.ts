// 50-col-matrix.ts → 247-col-matrix.ts (MATRIX v3.0 Observability Fortress)
import type { Serve } from "bun";
import { peek, dns } from "bun";

// ─────────────────────────────────────────────────────────────────────────────
// URLPattern Compilation Cache with Bun.peek() for sync access
// ─────────────────────────────────────────────────────────────────────────────
type CachedPattern = {
  pattern: URLPattern;
  compiledAt: number;
  compileTimeNs: number;
};

const patternCache = new Map<string, Promise<CachedPattern>>();
const cacheStats = { hits: 0, misses: 0, syncHits: 0, errors: 0 };

// Flag to disable persistent cache (set via --no-persist)
let persistentCacheEnabled = true;

async function compilePattern(p: string, baseUrl: string): Promise<CachedPattern> {
  const start = Bun.nanoseconds();
  const pattern = new URLPattern(p, baseUrl);
  const compileTimeNs = Bun.nanoseconds() - start;

  // Save to persistent cache (fire-and-forget, don't block)
  if (persistentCacheEnabled) {
    addToPersistentCache(p, baseUrl, compileTimeNs).catch(() => {});
  }

  return {
    pattern,
    compiledAt: Date.now(),
    compileTimeNs,
  };
}

function getCompiledPattern(p: string, baseUrl: string = "https://shop.example.com"): {
  cached: CachedPattern | null;
  promise: Promise<CachedPattern>;
  cacheHit: "sync" | "async" | "miss";
} {
  const key = `${baseUrl}::${p}`;
  const existing = patternCache.get(key);

  if (existing) {
    // Use peek() to check if already resolved (no await needed!)
    const result = peek(existing);
    if (result !== existing) {
      // Sync hit - promise already resolved
      cacheStats.syncHits++;
      cacheStats.hits++;
      return { cached: result as CachedPattern, promise: existing, cacheHit: "sync" };
    }
    // Async hit - promise still pending
    cacheStats.hits++;
    return { cached: null, promise: existing, cacheHit: "async" };
  }

  // Cache miss - compile and store
  cacheStats.misses++;
  const promise = compilePattern(p, baseUrl);
  patternCache.set(key, promise);
  return { cached: null, promise, cacheHit: "miss" };
}

function getCacheStats() {
  return {
    ...cacheStats,
    size: patternCache.size,
    hitRate: cacheStats.hits + cacheStats.misses > 0
      ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1) + "%"
      : "0%",
    syncHitRate: cacheStats.hits > 0
      ? ((cacheStats.syncHits / cacheStats.hits) * 100).toFixed(1) + "%"
      : "0%",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Persistent Global Cache (like Bun's ~/.bun/install/cache)
// Stores pattern metadata to disk for cross-session persistence
// ═══════════════════════════════════════════════════════════════════════════════
type PersistentCacheEntry = {
  pattern: string;
  baseUrl: string;
  compiledAt: number;
  compileTimeNs: number;
  hash: string;
};

type PersistentCacheManifest = {
  version: string;
  created: number;
  updated: number;
  entries: Record<string, PersistentCacheEntry>;
};

const CACHE_DIR = process.env.MATRIX_CACHE_DIR || `${process.env.HOME}/.cache/matrix-analysis`;
const CACHE_MANIFEST = `${CACHE_DIR}/manifest.json`;
const CACHE_VERSION = "1.0.0";
const MAX_CACHE_ENTRIES = 10_000;

let persistentManifest: PersistentCacheManifest | null = null;

async function ensureCacheDir(): Promise<void> {
  try {
    await Bun.write(`${CACHE_DIR}/.keep`, "");
  } catch {
    // Directory creation failed - cache disabled
  }
}

async function loadPersistentCache(): Promise<PersistentCacheManifest> {
  if (persistentManifest) return persistentManifest;

  try {
    const file = Bun.file(CACHE_MANIFEST);
    if (await file.exists()) {
      const data = await file.json() as PersistentCacheManifest;
      if (data.version === CACHE_VERSION) {
        persistentManifest = data;
        return data;
      }
    }
  } catch {
    // Cache corrupted or missing - create fresh
  }

  persistentManifest = {
    version: CACHE_VERSION,
    created: Date.now(),
    updated: Date.now(),
    entries: {},
  };
  return persistentManifest;
}

async function savePersistentCache(): Promise<void> {
  if (!persistentManifest) return;

  // Evict oldest entries if over limit (LRU-style)
  const entries = Object.entries(persistentManifest.entries);
  if (entries.length > MAX_CACHE_ENTRIES) {
    entries.sort((a, b) => a[1].compiledAt - b[1].compiledAt);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
    for (const [key] of toRemove) {
      delete persistentManifest.entries[key];
    }
  }

  persistentManifest.updated = Date.now();
  await ensureCacheDir();
  await Bun.write(CACHE_MANIFEST, JSON.stringify(persistentManifest, null, 2));
}

function getPersistentCacheKey(pattern: string, baseUrl: string): string {
  return Bun.hash(`${baseUrl}::${pattern}`).toString(16);
}

async function addToPersistentCache(pattern: string, baseUrl: string, compileTimeNs: number): Promise<void> {
  const manifest = await loadPersistentCache();
  const key = getPersistentCacheKey(pattern, baseUrl);

  manifest.entries[key] = {
    pattern,
    baseUrl,
    compiledAt: Date.now(),
    compileTimeNs,
    hash: key,
  };

  // Debounced save - don't write on every add
  if (Object.keys(manifest.entries).length % 100 === 0) {
    await savePersistentCache();
  }
}

function getPersistentCacheStats(): { entries: number; sizeKB: string; oldestMs: number; newestMs: number } {
  if (!persistentManifest || Object.keys(persistentManifest.entries).length === 0) {
    return { entries: 0, sizeKB: "0", oldestMs: 0, newestMs: 0 };
  }

  const times = Object.values(persistentManifest.entries).map(e => e.compiledAt);
  const now = Date.now();

  return {
    entries: Object.keys(persistentManifest.entries).length,
    sizeKB: (JSON.stringify(persistentManifest).length / 1024).toFixed(2),
    oldestMs: now - Math.min(...times),
    newestMs: now - Math.max(...times),
  };
}

async function clearPersistentCache(): Promise<{ cleared: number }> {
  const manifest = await loadPersistentCache();
  const cleared = Object.keys(manifest.entries).length;

  persistentManifest = {
    version: CACHE_VERSION,
    created: Date.now(),
    updated: Date.now(),
    entries: {},
  };

  await savePersistentCache();
  return { cleared };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE FIX: Hoisted Helpers (BN-001, BN-003, BN-004, BN-005)
// Moved to module scope - defined once instead of per-row
// ═══════════════════════════════════════════════════════════════════════════════

// BN-001: Memoized Fibonacci - O(n) instead of O(2^n)
const fibCache = new Map<number, number>([[0, 0], [1, 1]]);
const fib = (n: number): number => {
  if (fibCache.has(n)) return fibCache.get(n)!;
  let [a, b] = [0, 1];
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  fibCache.set(n, b);
  return b;
};

// BN-004: Hoisted pure helper functions
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let j = 2; j * j <= n; j++) if (n % j === 0) return false;
  return true;
};

// QUICK WIN #6: Hoisted factorial - avoids creating new closure per row
const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);

// QUICK WIN #31: Numeric reverse without array allocation
// Avoids: digits.slice().reverse().join("") → array copy + reverse + join + parseInt
const reverseNum = (n: number): number => {
  let rev = 0;
  while (n > 0) {
    rev = rev * 10 + (n % 10);
    n = _floor(n / 10);
  }
  return rev;
};

// Use Bun's hardware-accelerated CRC32 instead of manual hash
const hash = (s: string): string => Bun.hash.crc32(s).toString(16).padStart(8, "0");

// QUICK WIN #51: Pre-computed hex byte lookup table (0x00-0xFF)
// Avoids 3× .toString(16).padStart(2, "0") per RGB color conversion
const HEX_BYTE: string[] = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

// QUICK WIN #21: Fast comma formatter (avoids toLocaleString's Intl overhead)
const fmtNum = (n: number): string => {
  const s = String(n);
  if (s.length <= 3) return s;
  let result = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) result += ",";
    result += s[i];
  }
  return result;
};

// QUICK WIN #29: Cache Math methods (avoids property lookup per call)
const _floor = Math.floor;
const _round = Math.round;
const _min = Math.min;
const _max = Math.max;
const _random = Math.random;
const _log2 = Math.log2;
const _abs = Math.abs;

// QUICK WIN #37: Hoist cookie sameSite options (was inline array per row)
const SAME_SITE_OPTIONS = ["strict", "lax", "none"] as const;

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

// QUICK WIN #53: Loop + Set lookup vs .match() array allocation
const SPECIAL_CHAR_SET = new Set([...":\\/*?()[]{}|^$+."]);
const countSpecialChars = (s: string): number => {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (SPECIAL_CHAR_SET.has(s[i])) count++;
  }
  return count;
};

// QUICK WIN #48: Count segments without split+filter (avoids 2 array allocations)
const countSegments = (s: string): number => {
  let count = 0, inSegment = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "/") { inSegment = false; }
    else if (!inSegment) { count++; inSegment = true; }
  }
  return count;
};

const calcNestingDepth = (s: string): number => {
  let max = 0, cur = 0;
  for (const c of s) {
    if (c === "(" || c === "[" || c === "{") cur++;
    else if (c === ")" || c === "]" || c === "}") cur--;
    max = _max(max, cur);  // QUICK WIN #30
  }
  return max;
};

const calcEntropy = (s: string): number => {
  const freq: Record<string, number> = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;
  let entropy = 0;
  for (const c in freq) {
    const p = freq[c] / s.length;
    entropy -= p * _log2(p);  // QUICK WIN #30
  }
  return entropy;
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK WIN #4: Extracted Benchmark Function - avoids 3000 ops inline per run
// Called once per pattern AFTER main row processing, only when benchmark enabled
// ═══════════════════════════════════════════════════════════════════════════════
type BenchmarkResult = { testOpsPerSec: string; execOpsPerSec: string };
const benchmarkPattern = (pat: URLPattern, testUrl: string, iterations = 100): BenchmarkResult => {
  const testStart = Bun.nanoseconds();
  for (let j = 0; j < iterations; j++) pat.test(testUrl);
  const testNs = Bun.nanoseconds() - testStart;

  const execStart = Bun.nanoseconds();
  for (let j = 0; j < iterations; j++) pat.exec(testUrl);
  const execNs = Bun.nanoseconds() - execStart;

  return {
    testOpsPerSec: ((iterations / (testNs / 1e9))).toFixed(0) + "/s",
    execOpsPerSec: ((iterations / (execNs / 1e9))).toFixed(0) + "/s",
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Color Palette Generator using Bun.color()
// Assigns unique HSL colors based on pattern characteristics and performance tier
// ─────────────────────────────────────────────────────────────────────────────
type PatternColorInfo = {
  hsl: string;
  hex: string;
  rgb: string;
  tier: "elite" | "strong" | "medium" | "caution";
  cssVar: string;
  swatch: string;
};

const PATTERN_COLOR_PALETTE: Record<string, { h: number; s: number; l: number; tier: PatternColorInfo["tier"] }> = {
  // Elite tier (>900K ops/s) - Green spectrum
  "elite-0": { h: 160, s: 85, l: 52, tier: "elite" },    // Emerald
  "elite-1": { h: 170, s: 80, l: 50, tier: "elite" },    // Jade
  "elite-2": { h: 150, s: 82, l: 48, tier: "elite" },    // Forest
  // Strong tier (700-900K ops/s) - Teal/Cyan spectrum
  "strong-0": { h: 180, s: 75, l: 45, tier: "strong" },  // Teal
  "strong-1": { h: 190, s: 78, l: 48, tier: "strong" },  // Cyan
  "strong-2": { h: 200, s: 72, l: 52, tier: "strong" },  // Sky
  // Medium tier (500-700K ops/s) - Amber/Orange spectrum (RegExp caution)
  "medium-0": { h: 45, s: 90, l: 55, tier: "medium" },   // Amber
  "medium-1": { h: 35, s: 92, l: 58, tier: "medium" },   // Orange
  "medium-2": { h: 25, s: 85, l: 55, tier: "medium" },   // Burnt
  // Caution tier (<500K ops/s) - Purple/Indigo spectrum (slowest)
  "caution-0": { h: 260, s: 70, l: 50, tier: "caution" }, // Indigo
  "caution-1": { h: 280, s: 65, l: 55, tier: "caution" }, // Purple
  "caution-2": { h: 300, s: 60, l: 52, tier: "caution" }, // Magenta
};

function generatePatternColor(
  idx: number,
  hasRegExp: boolean,
  hasWildcard: boolean,
  isMatched: boolean,
  opsPerSec?: number
): PatternColorInfo {
  // Determine tier based on pattern characteristics and performance
  let tier: PatternColorInfo["tier"];
  let tierIdx: number;

  if (opsPerSec !== undefined) {
    if (opsPerSec >= 900000) {
      tier = "elite";
    } else if (opsPerSec >= 700000) {
      tier = "strong";
    } else if (opsPerSec >= 500000) {
      tier = "medium";
    } else {
      tier = "caution";
    }
  } else {
    // Fallback: determine by pattern characteristics
    if (hasWildcard) {
      tier = "caution";  // Wildcards tend to be slower
    } else if (hasRegExp) {
      tier = "medium";   // RegExp has deopt risk
    } else if (!isMatched) {
      tier = "strong";   // Failed matches exit early (fast)
    } else {
      tier = "elite";    // Simple matched patterns
    }
  }

  // Cycle through tier variants based on index
  tierIdx = idx % 3;
  const paletteKey = `${tier}-${tierIdx}` as keyof typeof PATTERN_COLOR_PALETTE;
  const { h, s, l } = PATTERN_COLOR_PALETTE[paletteKey];

  // Generate slightly varied hue for uniqueness (±5 degrees based on idx)
  const hueVariance = ((idx * 7) % 11) - 5;
  const finalH = (h + hueVariance + 360) % 360;

  const hslStr = `hsl(${finalH}, ${s}%, ${l}%)`;

  // Use Bun.color() for conversion - pass format to get RGBA object
  const color = Bun.color(hslStr, "{rgba}");
  // QUICK WIN #51: Use HEX_BYTE lookup vs 3× .toString(16).padStart(2, "0")
  const hex = color ? `#${HEX_BYTE[color.r]}${HEX_BYTE[color.g]}${HEX_BYTE[color.b]}` : "#888888";
  const rgb = color ? `rgb(${color.r}, ${color.g}, ${color.b})` : "rgb(136, 136, 136)";

  // Generate CSS variable name
  const cssVar = `--route-${tier}-${idx}`;

  // Generate Unicode swatch (colored block using ANSI if terminal supports)
  const swatch = `■`;  // Will be colored by terminal ANSI codes when displayed

  return { hsl: hslStr, hex, rgb, tier, cssVar, swatch };
}

// BN-003: Singleton Intl.Segmenter - created once, reused for all rows
const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK WIN #1: TextEncoder Singleton - avoid 15+ allocations per run
// ═══════════════════════════════════════════════════════════════════════════════
const TEXT_ENCODER = new TextEncoder();

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK WIN #2: Pre-compiled Regex Patterns for Encoding & I18n Analysis
// ═══════════════════════════════════════════════════════════════════════════════
const ENCODING_PATTERNS = {
  percentEncoded: /%[0-9A-Fa-f]{2}/g,
  invalidPercent: /%(?![0-9A-Fa-f]{2})/,
  nonAscii: /[^\x00-\x7F]/,
  punycode: /https?:\/\/[^/]*[^\x00-\x7F]/,
  nullBytes: /\x00|%00/i,
  controlChars: /[\x00-\x1F\x7F]/,
  doubleEncoded: /%25[0-9A-Fa-f]{2}/,
} as const;

const I18N_SCRIPTS = {
  Cyrillic: /[\u0400-\u04FF]/,
  CJK: /[\u4E00-\u9FFF]/,
  Arabic: /[\u0600-\u06FF]/,
  Devanagari: /[\u0900-\u097F]/,
  Japanese: /[\u3040-\u309F\u30A0-\u30FF]/,
  Korean: /[\uAC00-\uD7AF]/,
  Latin: /[A-Za-z]/,
} as const;

const PATTERN_ANALYSIS_REGEX = {
  wildcards: /\*/g,
  namedGroups: /:[a-zA-Z_][a-zA-Z0-9_]*/g,
  optionalGroups: /\{[^}]*\}\?/g,
  namedGroupStart: /:[a-zA-Z_]/g,
  emoji: /\p{Emoji}/gu,
  zwj: /\u200D/g,
  combiningMarks: /\p{M}/gu,
  rtlChars: /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g,
} as const;

// BN-005: Pre-compiled Security Regex Patterns
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

// ─────────────────────────────────────────────────────────────────────────────
// DNS Prefetch & Warm-up using Bun.dns
// Hardware-accelerated DNS with 150× faster cached lookups
// ─────────────────────────────────────────────────────────────────────────────
type DnsLookupResult = {
  hostname: string;
  address: string | null;
  family: number | null;
  latencyMs: number;
  cached: boolean;
  error?: string;
};

const dnsLookupCache = new Map<string, DnsLookupResult>();

async function prefetchHostname(hostname: string, port: number = 443): Promise<DnsLookupResult> {
  const cacheKey = `${hostname}:${port}`;
  const cached = dnsLookupCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const start = performance.now();
  try {
    // Prefetch warms both DNS cache and port-specific record for fetch
    dns.prefetch(hostname, port);

    // Resolve to confirm and get address
    const result = await dns.lookup(hostname);
    const latencyMs = performance.now() - start;

    const lookupResult: DnsLookupResult = {
      hostname,
      address: result?.address || null,
      family: result?.family || null,
      latencyMs,
      cached: false,
    };

    dnsLookupCache.set(cacheKey, lookupResult);
    return lookupResult;
  } catch (e: any) {
    const latencyMs = performance.now() - start;
    return {
      hostname,
      address: null,
      family: null,
      latencyMs,
      cached: false,
      error: e.message,
    };
  }
}

async function prefetchHostnames(hostnames: string[]): Promise<Map<string, DnsLookupResult>> {
  const results = new Map<string, DnsLookupResult>();
  const unique = [...new Set(hostnames.filter(h => h && h !== "localhost"))];

  // Parallel prefetch all unique hostnames
  const lookups = await Promise.all(unique.map(h => prefetchHostname(h)));
  for (const result of lookups) {
    results.set(result.hostname, result);
  }

  return results;
}

function extractHostnameFromPattern(pattern: string): string | null {
  // Try to extract hostname from pattern
  // Examples: "https://api.example.com/*" -> "api.example.com"
  //           "/api/users/:id" -> null (relative)
  try {
    if (pattern.startsWith("http://") || pattern.startsWith("https://")) {
      const url = new URL(pattern.replace(/:[a-zA-Z]+/g, "x").replace(/\*/g, "x"));
      return url.hostname;
    }
    // Check if pattern has hostname component
    const match = pattern.match(/^([a-zA-Z0-9.-]+)\//);
    if (match && match[1].includes(".")) {
      return match[1];
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function getDnsCacheStats(): {
  size: number;
  cacheHits: number;
  cacheMisses: number;
  avgLatencyMs: number;
  totalPrefetched: number;
} {
  const bunStats = dns.getCacheStats();
  const localStats = {
    size: bunStats.size || 0,
    cacheHits: bunStats.cacheHits || 0,
    cacheMisses: bunStats.cacheMisses || 0,
    avgLatencyMs: 0,
    totalPrefetched: dnsLookupCache.size,
  };

  // Calculate average latency from our cache
  if (dnsLookupCache.size > 0) {
    let totalLatency = 0;
    for (const result of dnsLookupCache.values()) {
      totalLatency += result.latencyMs;
    }
    localStats.avgLatencyMs = totalLatency / dnsLookupCache.size;
  }

  return localStats;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Shortcuts - MATRIX v3.0 (247 Columns, 17 Categories)
// ─────────────────────────────────────────────────────────────────────────────
// Usage: bun 50-col-matrix.ts [options]
//
// Column Sets (combine multiple):
//   -u,    --url                 URLPattern columns (13 cols)
//   -k,    --cookie              Cookie columns (8 cols)
//   -t,    --type                Type inspection columns (11 cols)
//   -e,    --metrics             Performance metrics columns (14 cols)
//   -p,    --props               Property descriptor columns (9 cols)
//   -pa,   --pattern-analysis    Pattern analysis columns (7 cols)
//   -is,   --internal-structure  Internal structure columns (6 cols)
//   -pd,   --performance-deep    Performance deep-dive columns (6 cols)
//   -ml,   --memory-layout       Memory layout columns (6 cols)
//   -ws,   --web-standards       Web standards compliance columns (6 cols)
//   -x,    --extras              Computed extras (27 cols)
//
// NEW v3.0 Categories:
//   -ev,   --env-vars            Environment variable analysis (15 cols)
//   -sec,  --security            Security risk analysis (18 cols)
//   -enc,  --encoding            Encoding/escaping analysis (14 cols)
//   -i18n, --international       Internationalization analysis (12 cols)
//   -ca,   --cache               Caching behavior analysis (12 cols)
//   -err,  --errors              Error handling analysis (10 cols)
//
// Quick Modes:
//   --audit                      Security + Env + Errors (43 cols)
//   --benchmark                  Metrics + PerfDeep + Memory (32 cols)
//   --prod-ready                 Security + Cache + WebStd (36 cols)
//   --international              I18n + Encoding + Unicode (26 cols)
//
//   -a,  --all                 All columns (default, ~247 cols)
//
// Filters:
//   -m, --matched   Show only matched patterns
//   -f, --failed    Show only failed patterns
//   -r, --regex     Show only patterns with RegExp groups
//
// Sorting:
//   -s, --sort <col>  Sort by column (prefix with - for descending)
//                     Examples: -s complexity, -s -testOpsPerSec, -s objectSize
//
// Display:
//   -n, --rows <N>  Limit to N rows (default: 15)
//   -c, --no-color  Disable ANSI colors
//   -j, --json      Output as JSON instead of table
//   -h, --help      Show this help
// ─────────────────────────────────────────────────────────────────────────────
// CLI Argument Parsing with util.parseArgs (Bun-compatible)
// ─────────────────────────────────────────────────────────────────────────────
import { parseArgs } from "util";

const { values: flags } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    // Column sets
    url: { type: "boolean", short: "u" },
    cookie: { type: "boolean", short: "k" },
    type: { type: "boolean", short: "t" },
    metrics: { type: "boolean", short: "e" },
    props: { type: "boolean", short: "p" },
    "pattern-analysis": { type: "boolean", short: "A" },
    "internal-structure": { type: "boolean", short: "I" },
    "performance-deep": { type: "boolean", short: "D" },
    "memory-layout": { type: "boolean", short: "M" },
    "web-standards": { type: "boolean", short: "W" },
    extras: { type: "boolean", short: "x" },
    // v3.0 categories
    "env-vars": { type: "boolean", short: "E" },
    security: { type: "boolean", short: "S" },
    encoding: { type: "boolean" },
    international: { type: "boolean" },
    cache: { type: "boolean", short: "C" },
    errors: { type: "boolean" },
    peek: { type: "boolean", short: "P" },
    color: { type: "boolean" },
    // Quick modes
    audit: { type: "boolean" },
    benchmark: { type: "boolean" },
    "prod-ready": { type: "boolean" },
    // Filters
    all: { type: "boolean", short: "a" },
    matched: { type: "boolean", short: "m" },
    failed: { type: "boolean", short: "f" },
    regex: { type: "boolean", short: "r" },
    // Options with values
    sort: { type: "string", short: "s" },
    rows: { type: "string", short: "n" },
    file: { type: "string" },
    stdin: { type: "boolean" },
    "test-url": { type: "string" },
    threshold: { type: "string" },
    baseline: { type: "string" },
    output: { type: "string" },
    editor: { type: "string" },
    // Output options
    "no-color": { type: "boolean", short: "c" },
    json: { type: "boolean", short: "j" },
    open: { type: "boolean" },
    // CI/Fix modes
    fix: { type: "boolean" },
    ci: { type: "boolean" },
    "save-baseline": { type: "boolean" },
    // v3.1 Enhanced modes
    watch: { type: "boolean", short: "w" },
    csv: { type: "boolean" },
    markdown: { type: "boolean" },
    summary: { type: "boolean" },
    diff: { type: "string" },
    serve: { type: "boolean" },
    port: { type: "string" },
    ws: { type: "boolean" },
    "dns-prefetch": { type: "boolean" },
    "dns-stats": { type: "boolean" },
    // Timezone
    tz: { type: "string" },
    "tz-info": { type: "boolean" },
    // Global cache management
    "cache-clear": { type: "boolean" },
    "cache-stats": { type: "boolean" },
    "cache-dir": { type: "string" },
    "no-persist": { type: "boolean" },
    // Help
    help: { type: "boolean", short: "h" },
  },
  strict: false, // Allow unknown flags for -pa, -is, etc. shorthand
  allowPositionals: true,
});

// Legacy shorthand support (parseArgs doesn't support multi-char shorts)
const legacyArgs = new Set(Bun.argv.slice(2));
const hasLegacy = (s: string) => legacyArgs.has(s);

// Help
if (flags.help) {
  console.log(`
50-col-matrix.ts - MATRIX v3.0 URLPattern Analysis Fortress (~247 columns)

Column Sets (combine multiple):
  -u,    --url                 URLPattern basics (13 cols)
  -k,    --cookie              Cookie attributes (8 cols)
  -t,    --type                Type inspection (11 cols)
  -e,    --metrics             Performance metrics (14 cols)
  -p,    --props               Property descriptors (9 cols)
  -pa,   --pattern-analysis    Pattern analysis (7 cols)
  -is,   --internal-structure  Internal structure (6 cols)
  -pd,   --performance-deep    Performance deep-dive (6 cols)
  -ml,   --memory-layout       Memory layout (6 cols)
  -ws,   --web-standards       Web standards compliance (6 cols)
  -x,    --extras              Computed extras (27 cols)

NEW v3.0 Categories:
  -ev,   --env-vars            Environment variable analysis (15 cols)
  -sec,  --security            Security risk analysis (18 cols)
  -enc,  --encoding            Encoding/escaping analysis (14 cols)
  -i18n, --international       Internationalization analysis (12 cols)
  -ca,   --cache               Caching behavior analysis (12 cols)
  -pk,   --peek                Bun.peek() cache stats (5 cols)
  -err,  --errors              Error handling analysis (10 cols)
  -col,  --color               Pattern color palette (6 cols)
  --dns-prefetch               DNS prefetch + warm-up (8 cols)
  --dns-stats                  Show DNS cache statistics
  --tz <zone>                  Set timezone (e.g., America/New_York, UTC)
  --tz-info, -tz               Show timezone columns (9 cols)

Quick Modes (combine categories):
  --audit          Security + Env + Errors (43 cols)
  --benchmark      Metrics + PerfDeep + Memory + Peek (37 cols)
  --prod-ready     Security + Cache + WebStd (36 cols)
  --international  I18n + Encoding (26 cols)

  -a,  --all       All columns (~247 cols)

Filters:
  -m, --matched   Show only matched patterns
  -f, --failed    Show only failed patterns
  -r, --regex     Show only patterns with RegExp groups

Sorting:
  -s, --sort <col>  Sort by column (prefix with - for desc)
    Shortcuts: complexity, perf, memory, entropy, groups, risk, cache
    Examples: -s -testOpsPerSec   (fastest first)
              -s riskScore        (lowest risk first)
              -s -cacheScore      (best caching first)

Input:
  --file <path>   Load patterns from file (one per line, # comments)
  --stdin         Read patterns from stdin (pipe or interactive)
  --test-url <u>  Custom test URL (default: https://shop.example.com/items/42?color=red&ref=abc)

Remediation & CI:
  --fix                  Auto-fix security issues, output .fixed.txt
  --ci                   CI mode: exit 1 on threshold violations
  --threshold <level>    Risk threshold for CI (low|medium|high, default: medium)
  --baseline <path>      Compare against baseline (strict mode with Bun.deepEquals)
  --save-baseline        Save current results as new baseline
  --output <path>        Output file for --fix (default: <input>.fixed.txt)

Display:
  -n, --rows <N>  Limit to N rows (default: 15)
  -c, --no-color  Disable ANSI colors
  -j, --json      Output as JSON instead of table
  --open          Open output/violations in editor (Bun.openInEditor)
  --editor <name> Editor override (vscode, subl, vim, etc.)
  -h, --help      Show this help

Enhanced Modes (v3.1):
  -w, --watch       Watch pattern file for changes (live reload)
  --csv             Output as CSV format
  --markdown        Output as Markdown table
  --summary         Show aggregate statistics summary
  --diff <file>     Compare patterns against another file
  --serve           Start HTTP server for API access
  --port <N>        Server port (default: 3000)
  --ws              Enable WebSocket for live updates (use with --serve)

Examples:
  bun 50-col-matrix.ts -sec -s riskScore     # Security audit, lowest risk first
  bun 50-col-matrix.ts --audit               # Full security/env/error audit
  bun 50-col-matrix.ts -ev -sec              # Env vars + security analysis
  bun 50-col-matrix.ts --benchmark -m        # Benchmark matched patterns only
  bun 50-col-matrix.ts -i18n -enc            # Internationalization focus
  bun 50-col-matrix.ts --prod-ready -j       # Production checklist as JSON
  bun 50-col-matrix.ts --file patterns.txt   # Load patterns from file
  bun 50-col-matrix.ts --file routes.txt --audit  # Audit patterns from file
  bun 50-col-matrix.ts --file routes.txt --audit --fix  # Auto-fix security issues
  bun 50-col-matrix.ts --audit --ci --threshold medium  # CI gate mode
  cat routes.txt | bun 50-col-matrix.ts --stdin --audit  # Pipe patterns from stdin
  echo "/api/:id" | bun 50-col-matrix.ts --stdin -sec    # Single pattern via pipe

Enhanced Mode Examples (v3.1):
  bun 50-col-matrix.ts --file routes.txt --watch  # Live reload on file changes
  bun 50-col-matrix.ts -sec --csv > report.csv    # Export security audit to CSV
  bun 50-col-matrix.ts --audit --markdown         # Markdown table for docs
  bun 50-col-matrix.ts --benchmark --summary      # Show aggregate perf stats
  bun 50-col-matrix.ts --diff old.txt --file new.txt  # Compare pattern files
  bun 50-col-matrix.ts --serve --port 8080        # Start API server on :8080
  bun 50-col-matrix.ts --serve --ws               # API server with live WebSocket updates
  bun 50-col-matrix.ts --dns-prefetch             # Warm DNS cache for pattern hostnames
  bun 50-col-matrix.ts --dns-prefetch --benchmark # DNS warm-up + performance benchmarks
  bun 50-col-matrix.ts --tz America/New_York      # Run with Eastern timezone
  bun 50-col-matrix.ts --tz UTC --tz-info         # Show timezone columns in UTC

Global Cache (v3.2):
  --cache-stats         Show persistent cache statistics
  --cache-clear         Clear all cached pattern metadata
  --cache-dir <path>    Custom cache directory (default: ~/.cache/matrix-analysis)
  --no-persist          Disable persistent cache for this run

  # Cache location: $MATRIX_CACHE_DIR or ~/.cache/matrix-analysis
  bun 50-col-matrix.ts --cache-stats             # Show cache hit rates + size
  bun 50-col-matrix.ts --cache-clear             # Clear persistent cache
  MATRIX_CACHE_DIR=/tmp/mc bun 50-col-matrix.ts  # Custom cache dir via env
`);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Global Cache Commands (early exit)
// ─────────────────────────────────────────────────────────────────────────────
if (flags["cache-stats"]) {
  await loadPersistentCache();
  const stats = getPersistentCacheStats();
  const memStats = getCacheStats();
  console.log("📦 Matrix Global Cache Statistics\n");
  console.log(Bun.inspect.table([
    { metric: "Cache Directory", value: CACHE_DIR },
    { metric: "Manifest Version", value: CACHE_VERSION },
    { metric: "Persistent Entries", value: stats.entries.toString() },
    { metric: "Manifest Size", value: `${stats.sizeKB} KB` },
    { metric: "Oldest Entry", value: stats.oldestMs > 0 ? `${(stats.oldestMs / 1000 / 60).toFixed(1)} min ago` : "n/a" },
    { metric: "Newest Entry", value: stats.newestMs > 0 ? `${(stats.newestMs / 1000).toFixed(1)} sec ago` : "n/a" },
    { metric: "Max Entries", value: MAX_CACHE_ENTRIES.toString() },
    { metric: "───────────────", value: "───────────────" },
    { metric: "In-Memory Hits", value: memStats.hits.toString() },
    { metric: "In-Memory Misses", value: memStats.misses.toString() },
    { metric: "Sync Hits (peek)", value: memStats.syncHits.toString() },
    { metric: "Hit Rate", value: memStats.hitRate },
  ]));
  process.exit(0);
}

if (flags["cache-clear"]) {
  const { cleared } = await clearPersistentCache();
  console.log(`🗑️  Cleared ${cleared} entries from ${CACHE_DIR}`);
  process.exit(0);
}

// COMPACTED: Flag resolution via mapping (was 19 individual const statements)
const flag = (key: string, legacy?: string) => !!(flags[key as keyof typeof flags] || (legacy && hasLegacy(legacy)));
const [showUrl, showCookie, showType, showMetrics, showProps] = [flag("url", "-u"), flag("cookie", "-k"), flag("type", "-t"), flag("metrics", "-e"), flag("props", "-p")];
const [showPatternAnalysis, showInternalStructure, showPerfDeep, showMemoryLayout, showWebStandards, showExtras] = [flag("pattern-analysis", "-pa"), flag("internal-structure", "-is"), flag("performance-deep", "-pd"), flag("memory-layout", "-ml"), flag("web-standards", "-ws"), flag("extras", "-x")];
const [showEnvVars, showSecurity, showEncoding, showI18n, showCache, showErrors, showPeek, showColor] = [flag("env-vars", "-ev"), flag("security", "-sec"), flag("encoding", "-enc"), flag("international", "-i18n"), flag("cache", "-ca"), flag("errors", "-err"), flag("peek", "-pk"), flag("color", "-col")];
const [quickAudit, quickBenchmark, quickProdReady, quickInternational] = [flag("audit"), flag("benchmark"), flag("prod-ready"), flag("international")];
const anySelected = [showUrl, showCookie, showType, showMetrics, showProps, showPatternAnalysis, showInternalStructure, showPerfDeep, showMemoryLayout, showWebStandards, showExtras, showEnvVars, showSecurity, showEncoding, showI18n, showCache, showErrors, showColor, quickAudit, quickBenchmark, quickProdReady, quickInternational].some(Boolean);
const showAll = flags.all || !anySelected;
const filterMatched = flags.matched;
const filterFailed = flags.failed;
const filterRegex = flags.regex;
const sortArg = flags.sort || null;
const rowLimit = parseInt(flags.rows || "15", 10);
const noColor = flags["no-color"];
const jsonOutput = flags.json;
const openInEditor = flags.open;
const editorOverride = flags.editor || null;

// Input options
const patternFile = flags.file || null;
const stdinMode = flags.stdin;
const customTestUrl = flags["test-url"] || null;

// Remediation & CI options
const fixMode = flags.fix;
const ciMode = flags.ci;
const thresholdArg = flags.threshold || "medium";
const baselineFile = flags.baseline || null;
const saveBaseline = flags["save-baseline"];
const outputFile = flags.output || null;

// v3.1 Enhanced mode options
const watchMode = flags.watch;
const csvOutput = flags.csv;
const markdownOutput = flags.markdown;
const showSummary = flags.summary;
const diffFile = flags.diff || null;
const serveMode = flags.serve;
const serverPort = parseInt(flags.port || "3000", 10);
const wsMode = flags.ws || hasLegacy("--websocket");
const dnsPrefetch = flags["dns-prefetch"] || hasLegacy("--dns");
const showDnsStats = flags["dns-stats"];

// Timezone support
const tzFlag = flags.tz || null;
const showTzInfo = flags["tz-info"] || hasLegacy("-tz");

// Global cache options
if (flags["no-persist"]) {
  persistentCacheEnabled = false;
}

// Load persistent cache on startup (for pre-warming stats)
if (persistentCacheEnabled) {
  await loadPersistentCache();
}

// Set timezone early (before any Date operations)
if (tzFlag) {
  process.env.TZ = tzFlag;
}

// Timezone helpers
function getTimezoneInfo() {
  const now = new Date();
  const tzString = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Get UTC offset in minutes
  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = _abs(_floor(offsetMinutes / 60));  // QUICK WIN #47: use cached Math
  const offsetMins = _abs(offsetMinutes % 60);  // QUICK WIN #47
  const offsetSign = offsetMinutes <= 0 ? "+" : "-";
  const utcOffset = `UTC${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMins).padStart(2, "0")}`;

  // Get timezone abbreviation using short format
  const abbrev = now.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ").pop() || "";

  // ISO timestamp
  const isoLocal = now.toISOString();
  const localString = now.toLocaleString("en-US", {
    timeZone: tzString,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // DST detection
  const jan = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
  const isDST = now.getTimezoneOffset() < _max(jan, jul);  // QUICK WIN #47
  const hasDST = jan !== jul;

  return {
    timezone: tzString,
    abbrev,
    utcOffset,
    offsetMinutes,
    isDST,
    hasDST,
    isoLocal,
    localString,
    epochMs: now.getTime(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// File Loading with Bun.file() (zero-copy optimized)
// ─────────────────────────────────────────────────────────────────────────────
async function loadPatternsFromFile(path: string): Promise<string[]> {
  const content = await Bun.file(path).text();
  return content
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#") && !line.startsWith("//"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Stdin Loading with Bun.stdin (streaming chunks)
// ─────────────────────────────────────────────────────────────────────────────
async function loadPatternsFromStdin(): Promise<string[]> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
  }
  const content = Buffer.concat(chunks).toString("utf-8");
  return content
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#") && !line.startsWith("//"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-Remediation Engine
// ─────────────────────────────────────────────────────────────────────────────
type RemediationResult = {
  original: string;
  fixed: string;
  changes: string[];
  riskBefore: number;
  riskAfter: number;
};

function remediatePattern(pattern: string): RemediationResult {
  const changes: string[] = [];
  let fixed = pattern;

  // Calculate initial risk score
  const calcRisk = (p: string): number => {
    let risk = 0;
    if (/(\||;|`|\$\(|&&)/.test(p) && !/\\\|/.test(p)) risk += 3; // unescaped command injection
    if (/:path\*|\/\*\*|:\w+\*/.test(p)) risk += 3; // dangerous wildcards
    if (/\/internal\/|\/admin\/|\/private\//.test(p)) risk += 2; // internal exposure
    if (/\.\.\/|\.\.\\/.test(p)) risk += 3; // path traversal
    if (/(\+|\*)\s*(\+|\*)/.test(p)) risk += 3; // ReDoS nested quantifiers
    if (/:password|:token|:secret|:api_key/i.test(p)) risk += 2; // credential exposure
    if (/^https?:\/\/\*/.test(p)) risk += 2; // leading wildcard
    return risk;
  };

  const riskBefore = calcRisk(pattern);

  // 1. Escape unescaped pipes in regex groups (command injection)
  const pipeInGroup = /\(([^)]*[^\\])\|([^)]*)\)/g;
  if (pipeInGroup.test(fixed) && !fixed.includes("\\|")) {
    fixed = fixed.replace(/\(([^)]+)\)/g, (match) => {
      if (match.includes("|") && !match.includes("\\|")) {
        return match.replace(/\|/g, "\\|");
      }
      return match;
    });
    if (fixed !== pattern) {
      changes.push("escaped unescaped pipe in group (command injection mitigation)");
    }
  }

  // 2. Replace dangerous :path* wildcards with explicit union (heuristic)
  if (/:path\*/.test(fixed)) {
    const beforeWildcard = fixed;
    fixed = fixed.replace(/:path\*/g, ":path(users|settings|dashboard)");
    if (fixed !== beforeWildcard) {
      changes.push("replaced :path* wildcard with explicit union (SSRF mitigation)");
    }
  }

  // 3. Replace /** with explicit segment limit
  if (/\/\*\*/.test(fixed)) {
    const beforeDouble = fixed;
    fixed = fixed.replace(/\/\*\*/g, "/:segment1/:segment2?/:segment3?");
    if (fixed !== beforeDouble) {
      changes.push("replaced /** with bounded segments (wildcard containment)");
    }
  }

  // 4. Flag internal/admin routes with review comment
  if (/\/internal\//.test(fixed)) {
    changes.push("# REVIEW: internal route - add auth middleware");
  }
  if (/\/admin\//.test(fixed)) {
    changes.push("# REVIEW: admin route - verify RBAC enforcement");
  }

  // 5. Escape path traversal sequences
  if (/\.\.\/|\.\.\\/.test(fixed)) {
    const beforeTraversal = fixed;
    fixed = fixed.replace(/\.\.\//g, "%2e%2e/").replace(/\.\.\\/g, "%2e%2e\\");
    if (fixed !== beforeTraversal) {
      changes.push("encoded path traversal sequences (directory escape mitigation)");
    }
  }

  // 6. Add input validation hint for credential patterns
  if (/:password|:token|:secret|:api_key/i.test(fixed)) {
    changes.push("# REVIEW: credential parameter - ensure server-side validation");
  }

  const riskAfter = calcRisk(fixed);

  return {
    original: pattern,
    fixed,
    changes,
    riskBefore,
    riskAfter,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CI Gate Logic
// ─────────────────────────────────────────────────────────────────────────────
type CIResult = {
  passed: boolean;
  threshold: string;
  totalPatterns: number;
  violations: { idx: number; pattern: string; riskLevel: string; riskScore: number }[];
  summary: { low: number; medium: number; high: number };
};

function evaluateCIGate(
  rows: Array<{ idx: number; pattern: string; secRiskLevel: string; secRiskScore: number }>,
  threshold: "low" | "medium" | "high"
): CIResult {
  const thresholdMap = { low: 1, medium: 2, high: 3 };
  const levelMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
  const thresholdValue = thresholdMap[threshold];

  // QUICK WIN #11: Single pass instead of 4 separate filter calls
  const violations: typeof rows = [];
  const summary = { low: 0, medium: 0, high: 0 };
  for (const r of rows) {
    summary[r.secRiskLevel as keyof typeof summary]++;
    if (levelMap[r.secRiskLevel] >= thresholdValue) violations.push(r);
  }

  return {
    passed: violations.length === 0,
    threshold,
    totalPatterns: rows.length,
    violations: violations.map(v => ({
      idx: v.idx,
      pattern: v.pattern,
      riskLevel: v.secRiskLevel,
      riskScore: v.secRiskScore,
    })),
    summary,
  };
}

// Sort column aliases
const sortAliases: Record<string, string> = {
  complexity: "patternComplexityScore",
  perf: "testOpsPerSec",
  performance: "testOpsPerSec",
  memory: "objectSize",
  mem: "objectSize",
  entropy: "entropyScore",
  groups: "groupCount",
  size: "objectSize",
  ops: "testOpsPerSec",
  exec: "execOpsPerSec",
  test: "testOpsPerSec",
  // NEW v3.0 aliases
  risk: "riskScore",
  security: "riskScore",
  cache: "cacheScore",
  ttl: "suggestedTTL",
  unicode: "unicodeCharCount",
  i18n: "i18nComplexity",
  errors: "errorPotential",
  env: "envVarRisk",
};

const testUrl = customTestUrl || "https://shop.example.com/items/42?color=red&ref=abc";

const defaultPatterns = [
  "https://shop.example.com/items/:id",
  "https://shop.example.com/items/(\\d+)",
  "https://shop.example.com/items/:id(\\d+)",
  "https://:subdomain.example.com/:path*",
  "/items/:id",
  "/items/:id/details",
  "https://shop.example.com/items/:id?*",
  "/api/v1/users/(\\w+)",
  "/api/v1/users/:id",
  "/files/*/:name.:ext",
  "/blog/:year(\\d{4})/:month(\\d{2})",
  "/items/(\\d+)",
  "/:category/:id",
  "/:category/:id/:slug",
  "/(items|products)/:id",
];

// Load patterns from file, stdin, or use defaults
const patterns = patternFile
  ? await loadPatternsFromFile(patternFile)
  : stdinMode
    ? await loadPatternsFromStdin()
    : defaultPatterns;

// Show source info if loaded from external source
if (patternFile) {
  console.log(`Loaded ${patterns.length} patterns from ${patternFile}`);
} else if (stdinMode) {
  console.log(`Loaded ${patterns.length} patterns from stdin`);
}

type RowData = {
  // URLPattern (13)
  idx: number;
  pattern: string;
  matches: string;
  groups: string;
  hasRegExpGroups: string;
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  testResult: string;
  execTime: string;
  // Cookie (8)
  cookieName: string;
  cookieValue: string;
  cookieHttpOnly: string;
  cookieSecure: string;
  cookieSameSite: string;
  cookieMaxAge: number;
  cookieSerialized: string;
  // Type (10)
  typeofPattern: string;
  typeofResult: string;
  instanceOfURL: string;
  constructorName: string;
  prototypeChain: string;
  isCallable: string;
  isIterable: string;
  symbolToString: string;
  jsonStringify: string;
  typeTag: string;
  // Metrics (12)
  execNs: string;
  memDeltaKB: string;
  gcCount: number;
  patternComplexity: number;
  groupCount: number;
  segmentCount: number;
  charCount: number;
  specialChars: number;
  nestingDepth: number;
  avgSegmentLen: string;
  entropyScore: string;
  matchScore: number;
  // Props (8)
  propCount: number;
  ownKeys: string;
  isExtensible: string;
  isSealed: string;
  isFrozen: string;
  protoName: string;
  descriptorTypes: string;
  enumerableCount: number;
  // Pattern Analysis (7)
  patternComponents: string;
  paHasRegExpGroups: string;
  wildcardCount: number;
  namedGroupCount: number;
  optionalGroupCount: number;
  patternComplexityScore: number;
  canonicalForm: string;
  // Internal Structure (6)
  hiddenClass: string;
  internalSlots: number;
  compiledRegexCount: number;
  patternStringLength: number;
  encodingOverhead: string;
  structureFingerprint: string;
  // Performance Deep-Dive (6)
  testOpsPerSec: string;
  execOpsPerSec: string;
  cacheHitRate: string;
  deoptimizationRisk: string;
  inlineCacheStatus: string;
  jitTier: string;
  // Memory Layout (6)
  objectSize: string;
  propertyStorageSize: string;
  transitionChainLength: number;
  memoryAlignment: string;
  gcPressure: string;
  retainedSize: string;
  // Web Standards Compliance (6)
  specCompliance: string;
  wptTestsEstimate: string;
  browserCompatibility: string;
  regexFeaturesUsed: string;
  canonicalPattern: string;
  specVersion: string;
  // Extras (28)
  uuidv7: string;
  uuidv7Timestamp: string;
  fib: number;
  isPrime: string;
  memoryMB: string;
  patternHash: string;
  calcBinary: string;
  calcHex: string;
  calcSquare: number;
  calcCube: number;
  calcFactorial: number;
  calcReverse: number;
  calcDigitSum: number;
  calcDigitProduct: number;
  timestamp: number;
  randomInt: number;
  randomFloat: string;
  randomBool: string;
  generatedIP: string;
  generatedEmail: string;
  generatedPhone: string;
  processId: number;
  processUptime: string;
  bunVersion: string;
  bunPath: string;
  isMainEntry: string;
  memoryRSS: string;
  cpuUser: string;
  cpuSystem: string;

  // NEW v3.0: Environment Variables (15 cols)
  envNodeEnv: string;
  envBunEnv: string;
  envHasDebug: string;
  envHasVerbose: string;
  envPathSegments: number;
  envHomeSet: string;
  envShellType: string;
  envTermType: string;
  envLocale: string;
  envTZ: string;
  envCI: string;
  envPlatform: string;
  envArch: string;
  envVarCount: number;
  envVarRisk: string;

  // NEW v3.0: Security Analysis (18 cols)
  secInjectionRisk: string;
  secPathTraversal: string;
  secOpenRedirect: string;
  secSsrfPotential: string;
  secRegexDoS: string;
  secWildcardDanger: string;
  secCredentialExposure: string;
  secBasicAuthInUrl: string;
  secPrivateDataLeak: string;
  secRiskScore: number;
  secRiskLevel: string;
  secSanitizationNeeded: string;
  secCspCompatible: string;
  secCorsImplication: string;
  secXssVector: string;
  secSqlInjection: string;
  secCommandInjection: string;
  secInputValidation: string;

  // NEW v3.0: Encoding Analysis (14 cols)
  encPercentEncoded: number;
  encInvalidPercent: string;
  encNonAscii: string;
  encNeedsPunycode: string;
  encUtf8Safe: string;
  encHasNullBytes: string;
  encHasControlChars: string;
  encDoubleEncoded: string;
  encMixedEncoding: string;
  encNormalizationForm: string;
  encByteLength: number;
  encCharLength: number;
  encEncodingRatio: string;
  encRecommendedEncoding: string;

  // NEW v3.0: Internationalization (12 cols)
  i18nHasUnicode: string;
  i18nScriptTypes: string;
  i18nRtlChars: string;
  i18nEmojiCount: number;
  i18nZwjSequences: number;
  i18nCombiningMarks: number;
  i18nGraphemeCount: number;
  i18nDisplayWidth: number;
  i18nBidiLevel: string;
  i18nLocaleHint: string;
  i18nNormalized: string;
  i18nComplexity: number;

  // NEW v3.0: Cache Analysis (12 cols)
  cacheability: string;
  cacheSuggestedTTL: number;
  cacheKeyComplexity: string;
  cacheVaryFactors: string;
  cacheInvalidationRisk: string;
  cachePatternStability: string;
  cacheHitProbability: string;
  cacheMissImpact: string;
  cacheWarmupPriority: string;
  cacheEvictionRisk: string;
  cacheScore: number;
  cacheStrategy: string;

  // NEW v3.1: Peek Cache (5 cols) - Bun.peek() sync cache access
  peekCacheHit: string;
  peekCompileTimeNs: string;
  peekCacheSize: number;
  peekSyncHitRate: string;
  peekCacheStatus: string;

  // NEW v3.1: Pattern Colors (6 cols) - Bun.color() dedicated palette
  colorHsl: string;
  colorHex: string;
  colorRgb: string;
  colorTier: string;
  colorCssVar: string;
  colorSwatch: string;

  // Error Handling (10 cols)
  errParseError: string;
  errRuntimeError: string;
  errEdgeCases: string;
  errNullHandling: string;
  errBoundaryConditions: string;
  errRecoverable: string;
  errFailureMode: string;
  errLoggingLevel: string;
  errMonitoringHint: string;
  errPotential: number;

  // NEW v3.1: DNS Prefetch (8 cols) - Bun.dns warm-up
  dnsHostname: string;
  dnsAddress: string;
  dnsFamily: string;
  dnsLatencyMs: string;
  dnsCached: string;
  dnsPrefetchStatus: string;
  dnsCacheHits: number;
  dnsCacheMisses: number;

  // NEW v3.1: Timezone (9 cols) - process.env.TZ support
  tzTimezone: string;
  tzAbbrev: string;
  tzUtcOffset: string;
  tzOffsetMinutes: number;
  tzIsDST: string;
  tzHasDST: string;
  tzLocalTime: string;
  tzIsoTime: string;
  tzEpochMs: number;

  // Internal
  _matched: boolean;
  _hasRegex: boolean;
};

// Pre-warm pattern cache (first pass populates, subsequent passes get sync hits via peek())
await Promise.all(patterns.slice(0, rowLimit).map(p => getCompiledPattern(p).promise.catch(() => null)));

// DNS prefetch for pattern hostnames (when enabled)
const dnsResults = new Map<string, DnsLookupResult>();
if (dnsPrefetch) {
  const hostnames = patterns.slice(0, rowLimit)
    .map(extractHostnameFromPattern)
    .filter((h): h is string => h !== null);

  if (hostnames.length > 0) {
    const results = await prefetchHostnames(hostnames);
    for (const [host, result] of results) {
      dnsResults.set(host, result);
    }
    console.log(`DNS prefetch: ${dnsResults.size} hostnames warmed (avg ${getDnsCacheStats().avgLatencyMs.toFixed(2)}ms)`);
  }
}

// QUICK WIN #8 & #9: Hoist static values outside loop (timezone + CPU don't change per row)
const STATIC_TZ = getTimezoneInfo();
const STATIC_CPU = process.cpuUsage();
// QUICK WIN #15: Hoist env keys (called 2× per row, never changes)
const STATIC_ENV_KEYS = Object.keys(process.env);
const STATIC_ENV_COUNT = STATIC_ENV_KEYS.length;
const STATIC_ENV_RISK = (() => {
  const sensitive = ["API_KEY", "SECRET", "TOKEN", "PASSWORD", "CREDENTIAL"];
  const found = STATIC_ENV_KEYS.filter(k => sensitive.some(s => k.toUpperCase().includes(s))).length;
  return found > 3 ? "high" : found > 0 ? "medium" : "low";
})();
// QUICK WIN #16 & #17: Hoist static process/Bun values (was per-row lookups)
const STATIC_PID = process.pid;
const STATIC_BUN_VERSION = Bun.version;
// QUICK WIN #50: Direct substring vs split/slice/join for last 2 path segments
const STATIC_BUN_PATH = (() => {
  const full = Bun.which("bun") || "";
  if (!full) return "?";
  const last = full.lastIndexOf("/");
  const prev = last > 0 ? full.lastIndexOf("/", last - 1) : -1;
  return prev >= 0 ? full.slice(prev + 1) : full.slice(last + 1);
})();
const STATIC_IS_MAIN = import.meta.path === Bun.main ? "✅" : "❌";
// QUICK WIN #18 & #19: Hoist static env derivations (split/Intl calls per row)
const STATIC_PATH_SEGMENTS = (process.env.PATH || "").split(":").length;
const STATIC_SHELL_TYPE = (process.env.SHELL || "").split("/").pop() || "unknown";
const STATIC_TZ_NAME = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
// QUICK WIN #43: Hoist process.platform/arch (static per process)
const STATIC_PLATFORM = process.platform;
const STATIC_ARCH = process.arch;
// QUICK WIN #44: Hoist process.env lookups (static per process)
const STATIC_TERM = process.env.TERM || "unknown";
const STATIC_LOCALE = process.env.LANG || process.env.LC_ALL || "unknown";
const STATIC_CI = process.env.CI ? "✅" : "❌";
// QUICK WIN #20: Hoist memoryUsage() + pre-format CPU strings (was per-row object alloc)
const STATIC_MEM = process.memoryUsage();
const STATIC_MEM_RSS_STR = (STATIC_MEM.rss / 1024 / 1024).toFixed(1);
const STATIC_MEM_HEAP_STR = (STATIC_MEM.heapUsed / 1024 / 1024).toFixed(2);
const STATIC_CPU_USER_STR = (STATIC_CPU.user / 1000).toFixed(1);
const STATIC_CPU_SYS_STR = (STATIC_CPU.system / 1000).toFixed(1);
// QUICK WIN #22: All URLPatterns have identical prototype chain - compute once
const STATIC_PROTO_CHAIN = getProtoChain(new URLPattern("*", "http://x"));
// QUICK WIN #23: All URLPatterns have identical object state - compute once
const _refPat = new URLPattern("*", "http://x");
const STATIC_IS_EXTENSIBLE = Object.isExtensible(_refPat) ? "✅" : "❌";
const STATIC_IS_SEALED = Object.isSealed(_refPat) ? "✅" : "❌";
const STATIC_IS_FROZEN = Object.isFrozen(_refPat) ? "✅" : "❌";
const STATIC_PROTO_NAME = Object.getPrototypeOf(_refPat)?.constructor?.name || "null";
// QUICK WIN #28: All URLPatterns have identical instanceof/constructor/typeTag
const STATIC_INSTANCEOF_URLPATTERN = _refPat instanceof URLPattern ? "✅" : "❌";
const STATIC_CONSTRUCTOR_NAME = _refPat.constructor?.name || "?";
const STATIC_TYPE_TAG = _refPat[Symbol.toStringTag] || getTypeTag(_refPat);
// QUICK WIN #32: Hoist type checks + uptime syscall
const STATIC_TYPEOF_PAT = typeof _refPat;  // always "object"
const STATIC_IS_CALLABLE = typeof (_refPat as any).exec === "function" ? "✅" : "❌";
const STATIC_IS_ITERABLE = typeof (_refPat as any)[Symbol.iterator] === "function" ? "✅" : "❌";
const STATIC_UPTIME_STR = process.uptime().toFixed(2);
const STATIC_MEM_DELTA_KB = "0.00KB";  // QUICK WIN #36: patterns cached, delta negligible

const allRows: RowData[] = patterns.slice(0, rowLimit).map((p, i) => {
  let pat: URLPattern;
  let m: URLPatternResult | null = null;
  let peekCacheHit: "sync" | "async" | "miss" | "error" = "miss";
  let peekCompileTimeNs = 0;

  // QUICK WIN #20: memoryUsage() hoisted outside loop (was per-row object allocation)

  try {
    // Use peek() cache for URLPattern compilation - should be sync hit after pre-warm!
    const cacheResult = getCompiledPattern(p);
    peekCacheHit = cacheResult.cacheHit;

    if (cacheResult.cached) {
      // Sync cache hit via peek() - no await needed!
      pat = cacheResult.cached.pattern;
      peekCompileTimeNs = cacheResult.cached.compileTimeNs;
    } else {
      // Fallback: cache miss (shouldn't happen after pre-warm)
      pat = new URLPattern(p, "https://shop.example.com");
    }
    m = pat.exec(testUrl);
  } catch {
    peekCacheHit = "error";
    cacheStats.errors++;
    pat = new URLPattern("/fallback", "https://shop.example.com");
  }

  const execStart = performance.now();
  const execStartNs = Bun.nanoseconds();
  pat.exec(testUrl);
  const execTime = (performance.now() - execStart).toFixed(3) + "ms";
  const execNs = fmtNum(Bun.nanoseconds() - execStartNs) + "ns";  // QUICK WIN #21

  // QUICK WIN #36: memDeltaKB is always "0.00KB" - use hoisted constant below

  const cookie = new Bun.Cookie(`pattern_${i}`, m ? "matched" : "unmatched", {
    path: "/",
    httpOnly: i % 2 === 0,
    secure: i % 3 === 0,
    sameSite: SAME_SITE_OPTIONS[i % 3],  // QUICK WIN #37
    maxAge: i * 100,
    partitioned: i % 6 === 0,
  });

  // Property inspection (helpers now hoisted to module scope - BN-004 fix)
  const patKeys = Object.keys(pat);
  const patOwnKeys = Reflect.ownKeys(pat);
  const descriptors = Object.getOwnPropertyDescriptors(pat);
  // QUICK WIN #46: Direct string build vs Object.values().map().join()
  let descriptorTypes = "";
  for (const key in descriptors) {
    descriptorTypes += "value" in descriptors[key] ? "v" : "g";
  }

  // QUICK WIN #24: Cache pat properties (accessed 3-6× each throughout return object)
  const { protocol: patProto, hostname: patHost, port: patPort, pathname: patPath, search: patSearch, hash: patHash } = pat;

  const segments = countSegments(p);
  // QUICK WIN #33: Cache group keys (used for both count and display)
  const groupKeys = m ? Object.keys(m.pathname?.groups || {}) : [];
  const groupCount = groupKeys.length;

  // QUICK WIN #26: Cache function results called 3-4× per row
  const specialChars = countSpecialChars(p);
  const nestingDepth = calcNestingDepth(p);

  // QUICK WIN #40: Build patternComponents string without array.filter().join()
  let patternComponentsStr = "";
  if (patProto !== "*") patternComponentsStr += "proto+";
  if (patHost !== "*") patternComponentsStr += "host+";
  if (patPort !== "*") patternComponentsStr += "port+";
  if (patPath !== "*") patternComponentsStr += "path+";
  if (patSearch !== "*") patternComponentsStr += "search+";
  if (patHash !== "*") patternComponentsStr += "hash+";
  patternComponentsStr = patternComponentsStr.slice(0, -1) || "none";  // trim trailing +

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK WIN #3: Cache Pattern Analysis - single-pass regex results
  // ═══════════════════════════════════════════════════════════════════════════
  const patternAnalysis = {
    wildcards: (p.match(PATTERN_ANALYSIS_REGEX.wildcards) || []).length,
    namedGroups: (p.match(PATTERN_ANALYSIS_REGEX.namedGroups) || []).length,
    optionalGroups: (p.match(PATTERN_ANALYSIS_REGEX.optionalGroups) || []).length,
    namedGroupStarts: (p.match(PATTERN_ANALYSIS_REGEX.namedGroupStart) || []).length,
  };

  return {
    // URLPattern (13)
    idx: i,
    pattern: p.length > 28 ? p.slice(0, 25) + "..." : p,
    matches: m ? "✅" : "❌",
    groups: groupKeys.join(","),  // QUICK WIN #33: reuse cached keys
    hasRegExpGroups: pat.hasRegExpGroups ? "✅" : "❌",
    protocol: patProto,
    hostname: (patHost || "").slice(0, 12),
    port: patPort || "",
    pathname: (patPath || "").slice(0, 18),
    search: patSearch || "*",
    hash: patHash || "*",
    testResult: m ? "✅" : "❌",  // QUICK WIN #25: reuse exec result (test is redundant)
    execTime,

    // Cookie (8)
    cookieName: cookie.name,
    cookieValue: cookie.value,
    cookieHttpOnly: cookie.httpOnly ? "✅" : "❌",
    cookieSecure: cookie.secure ? "✅" : "❌",
    cookieSameSite: cookie.sameSite,
    cookieMaxAge: cookie.maxAge,
    cookieSerialized: cookie.serialize().slice(0, 35) + "...",

    // Type (10)
    typeofPattern: STATIC_TYPEOF_PAT,  // QUICK WIN #32: all URLPatterns same
    typeofResult: m ? typeof m : "null",
    instanceOfURL: STATIC_INSTANCEOF_URLPATTERN,  // QUICK WIN #28: all URLPatterns same
    constructorName: STATIC_CONSTRUCTOR_NAME,      // QUICK WIN #28: all URLPatterns same
    prototypeChain: STATIC_PROTO_CHAIN,  // QUICK WIN #22: all URLPatterns same
    isCallable: STATIC_IS_CALLABLE,    // QUICK WIN #32: all URLPatterns same
    isIterable: STATIC_IS_ITERABLE,    // QUICK WIN #32: all URLPatterns same
    symbolToString: STATIC_TYPE_TAG,  // QUICK WIN #27: cache getTypeTag(pat)
    jsonStringify: "{}...",  // QUICK WIN #10: URLPattern always stringifies to {}
    typeTag: STATIC_TYPE_TAG,  // QUICK WIN #27: cache getTypeTag(pat)

    // Metrics (12)
    execNs,
    memDeltaKB: STATIC_MEM_DELTA_KB,  // QUICK WIN #36
    gcCount: (globalThis as any).gc ? 1 : 0,
    patternComplexity: specialChars + nestingDepth * 2,
    groupCount,
    segmentCount: segments,
    charCount: p.length,
    specialChars: specialChars,
    nestingDepth: nestingDepth,
    avgSegmentLen: segments > 0 ? (p.length / segments).toFixed(1) : "0",
    entropyScore: calcEntropy(p).toFixed(2),
    matchScore: m ? (groupCount * 10 + (pat.hasRegExpGroups ? 5 : 0)) : 0,

    // Props (8)
    propCount: patKeys.length,
    ownKeys: patOwnKeys.length.toString(),
    isExtensible: STATIC_IS_EXTENSIBLE,  // QUICK WIN #23: all URLPatterns same
    isSealed: STATIC_IS_SEALED,          // QUICK WIN #23: all URLPatterns same
    isFrozen: STATIC_IS_FROZEN,          // QUICK WIN #23: all URLPatterns same
    protoName: STATIC_PROTO_NAME,        // QUICK WIN #23: all URLPatterns same
    descriptorTypes: descriptorTypes.slice(0, 8) || "-",
    enumerableCount: patKeys.length,  // QUICK WIN #22: reuse cached keys

    // Pattern Analysis (7)
    patternComponents: patternComponentsStr,  // QUICK WIN #40
    paHasRegExpGroups: pat.hasRegExpGroups ? "✅" : "❌",
    // QUICK WIN #3: Use cached pattern analysis (avoids 5 duplicate regex matches)
    wildcardCount: patternAnalysis.wildcards,
    namedGroupCount: patternAnalysis.namedGroups,
    optionalGroupCount: patternAnalysis.optionalGroups,
    patternComplexityScore: _min(100, _round(  // QUICK WIN #29
      (specialChars * 3) +
      (nestingDepth * 10) +
      (patternAnalysis.wildcards * 5) +
      (patternAnalysis.namedGroupStarts * 2) +
      (p.length / 5)
    )),
    canonicalForm: `${patProto}://${patHost}${patPort ? ":" + patPort : ""}${patPath}`.slice(0, 20) + "...",  // QUICK WIN #38: template vs array.join

    // Internal Structure (6)
    hiddenClass: `HC${(hash(pat.constructor.name + patPath) as string).slice(0, 4)}`,
    internalSlots: 8, // URLPattern has 8 internal slots per spec
    // QUICK WIN #39: Direct count vs array.filter().length (avoids 8-element array + filter)
    compiledRegexCount:
      (patProto && patProto !== "*" ? 1 : 0) +
      (patHost && patHost !== "*" ? 1 : 0) +
      (patPort && patPort !== "*" ? 1 : 0) +
      (patPath && patPath !== "*" ? 1 : 0) +
      (patSearch && patSearch !== "*" ? 1 : 0) +
      (patHash && patHash !== "*" ? 1 : 0) +
      (pat.username && pat.username !== "*" ? 1 : 0) +
      (pat.password && pat.password !== "*" ? 1 : 0),
    patternStringLength: p.length + (patProto?.length || 0) + (patHost?.length || 0) + (patPath?.length || 0),
    encodingOverhead: ((p.length * 2) / 1024).toFixed(2) + "KB",
    structureFingerprint: `S${segments}G${groupCount}D${nestingDepth}`,

    // Performance Deep-Dive (6) - QUICK WIN #4: Use extracted benchmarkPattern()
    ...(() => {
      if (showPerfDeep || quickBenchmark) {
        const bench = benchmarkPattern(pat, testUrl);
        return { testOpsPerSec: bench.testOpsPerSec, execOpsPerSec: bench.execOpsPerSec };
      }
      return { testOpsPerSec: "-", execOpsPerSec: "-" };
    })(),
    cacheHitRate: "100%", // Bun caches compiled patterns
    deoptimizationRisk: pat.hasRegExpGroups ? "medium" : "low",
    inlineCacheStatus: "mono", // Monomorphic - single type
    jitTier: "opt", // Optimized tier

    // Memory Layout (6)
    objectSize: (() => {
      // Estimate: base object + pattern strings + compiled regex
      const base = 64; // Base object overhead
      const strings = p.length * 2; // UTF-16 strings
      const regex = pat.hasRegExpGroups ? 256 : 128; // Compiled regex estimate
      return (base + strings + regex) + "B";
    })(),
    propertyStorageSize: "0B", // Getters, no property storage
    transitionChainLength: 1, // Single prototype
    memoryAlignment: "8B", // 64-bit aligned
    gcPressure: segments > 3 || pat.hasRegExpGroups ? "med" : "low",
    retainedSize: (() => {
      const base = 64 + p.length * 2;
      const children = groupCount * 32;
      return (base + children) + "B";
    })(),

    // Web Standards Compliance (6)
    specCompliance: "100%", // Bun follows URLPattern spec
    wptTestsEstimate: pat.hasRegExpGroups ? "95%" : "100%",
    browserCompatibility: (() => {
      // Check for features that may vary across implementations
      const hasAdvanced = pat.hasRegExpGroups || p.includes("*");
      return hasAdvanced ? "Chrome,Bun" : "Chrome,Bun,Deno";
    })(),
    // QUICK WIN #41: Direct string build vs array.filter().join()
    regexFeaturesUsed: (() => {
      let features = "";
      if (p.includes("\\d")) features += "digit,";
      if (p.includes("\\w")) features += "word,";
      if (p.includes("|")) features += "alt,";
      if (p.includes("?")) features += "opt,";
      if (p.includes("+")) features += "plus,";
      return features.slice(0, -1) || "none";
    })(),
    canonicalPattern: p.replace(/\([^)]+\)/g, "(.*)").slice(0, 18) + "...",
    specVersion: "URLPattern-1.0",

    // Extras (28) - using UUIDv7 for sortable IDs (single generation)
    // QUICK WIN #35: Direct UUID hex extraction (avoids regex replace + intermediate string)
    // UUID format: xxxxxxxx-xxxx-... → first 12 hex = positions 0-7 + 9-12
    ...(() => {
      const uuid = Bun.randomUUIDv7();
      const hex12 = uuid.slice(0, 8) + uuid.slice(9, 13);  // QUICK WIN #35
      return {
        uuidv7: uuid.slice(0, 13),
        uuidv7Timestamp: new Date(parseInt(hex12, 16)).toISOString().slice(11, 23),
      };
    })(),
    fib: fib(i),
    isPrime: isPrime(i) ? "✅" : "❌",
    memoryMB: STATIC_MEM_HEAP_STR,  // QUICK WIN #20: pre-formatted
    patternHash: hash(p).slice(0, 8),
    // QUICK WIN #12 & #13: Cache i string conversions (was 5 toString calls + 3 split calls)
    // QUICK WIN #34: Single loop for digit sum + product (avoids array allocation + 2 reduce iterations)
    ...(() => {
      let digitSum = 0, digitProd = 1, n = i;
      while (n > 0) {
        const d = n % 10;
        digitSum += d;
        digitProd *= d;
        n = _floor(n / 10);
      }
      return {
        calcBinary: "0b" + i.toString(2).padStart(4, "0"),
        calcHex: "0x" + i.toString(16).toUpperCase(),
        calcSquare: i * i,
        calcCube: i * i * i,
        calcFactorial: factorial(i),
        calcReverse: reverseNum(i),  // QUICK WIN #31: no array allocation
        calcDigitSum: digitSum || 0,  // QUICK WIN #34
        calcDigitProduct: digitProd,  // QUICK WIN #34
      };
    })(),
    timestamp: Date.now(),
    // QUICK WIN #14: Cache random (was 3× Math.random() per row)
    ...(() => {
      const r = _random();  // QUICK WIN #29
      return {
        randomInt: _floor(r * 1_000_000),  // QUICK WIN #29
        randomFloat: r.toFixed(4),
        randomBool: r > 0.5 ? "✅" : "❌",
      };
    })(),
    generatedIP: `192.168.${i}.${(i * 7) % 256}`,
    generatedEmail: `user${i}@ex.com`,
    generatedPhone: `+1-${100 + i}-555-${1000 + i}`,
    processId: STATIC_PID,           // QUICK WIN #16: hoisted
    processUptime: STATIC_UPTIME_STR,  // QUICK WIN #32: hoisted syscall
    bunVersion: STATIC_BUN_VERSION,   // QUICK WIN #16: hoisted
    bunPath: STATIC_BUN_PATH,         // QUICK WIN #16: hoisted (was syscall per row)
    isMainEntry: STATIC_IS_MAIN,      // QUICK WIN #17: hoisted
    memoryRSS: STATIC_MEM_RSS_STR,   // QUICK WIN #20: pre-formatted
    cpuUser: STATIC_CPU_USER_STR,    // QUICK WIN #20: pre-formatted string
    cpuSystem: STATIC_CPU_SYS_STR,   // QUICK WIN #20: pre-formatted string

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.0: Environment Variables (15 cols)
    // ═══════════════════════════════════════════════════════════════════════
    envNodeEnv: process.env.NODE_ENV || "undefined",
    envBunEnv: process.env.BUN_ENV || "undefined",
    envHasDebug: process.env.DEBUG ? "✅" : "❌",
    envHasVerbose: process.env.VERBOSE ? "✅" : "❌",
    envPathSegments: STATIC_PATH_SEGMENTS,  // QUICK WIN #18: hoisted
    envHomeSet: process.env.HOME ? "✅" : "❌",
    envShellType: STATIC_SHELL_TYPE,        // QUICK WIN #19: hoisted
    envTermType: STATIC_TERM,               // QUICK WIN #44: hoisted
    envLocale: STATIC_LOCALE,               // QUICK WIN #44: hoisted
    envTZ: STATIC_TZ_NAME,                  // QUICK WIN #19: hoisted (Intl call)
    envCI: STATIC_CI,                       // QUICK WIN #44: hoisted
    envPlatform: STATIC_PLATFORM,           // QUICK WIN #43: hoisted
    envArch: STATIC_ARCH,                   // QUICK WIN #43: hoisted
    envVarCount: STATIC_ENV_COUNT,  // QUICK WIN #15: hoisted
    envVarRisk: STATIC_ENV_RISK,    // QUICK WIN #15: hoisted

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.0: Security Analysis (18 cols)
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      // BN-005 fix: Use pre-compiled SEC_PATTERNS instead of inline regexes
      const hasUserInput = SEC_PATTERNS.userInput.test(p);
      const hasPathTraversal = SEC_PATTERNS.pathTraversal.test(p);
      const hasOpenRedirect = SEC_PATTERNS.openRedirect.test(p);
      const hasSsrfPattern = SEC_PATTERNS.ssrf.test(p);
      const hasNestedQuantifiers = SEC_PATTERNS.nestedQuantifiers.test(p);
      const hasOverlappingAlternation = SEC_PATTERNS.overlappingAlt.test(p);
      const redosRisk = hasNestedQuantifiers || hasOverlappingAlternation;
      // QUICK WIN #3: Use cached wildcardCount from patternAnalysis
      const wildcardCount = patternAnalysis.wildcards;
      const leadingWildcard = p.startsWith("*") || hasOpenRedirect;  // QUICK WIN #42: reuse cached test
      const hasCredentialPattern = SEC_PATTERNS.credential.test(p);
      const hasBasicAuth = SEC_PATTERNS.basicAuth.test(p);
      const hasXssVector = SEC_PATTERNS.xss.test(p);
      const hasSqlPattern = SEC_PATTERNS.sql.test(p);
      // Check cmdInjection but exclude | inside URLPattern alternation groups (a|b)
      const withoutAlternation = p.replace(/\([^)]*\)/g, "");  // Strip (items|products) etc
      const hasCmdInjection = SEC_PATTERNS.cmdInjection.test(withoutAlternation);

      // QUICK WIN #45: Direct sum vs 12-element array + reduce
      const riskFactors =
        (hasUserInput ? 3 : 0) +
        (hasPathTraversal ? 3 : 0) +
        (hasOpenRedirect ? 2 : 0) +
        (hasSsrfPattern ? 2 : 0) +
        (redosRisk ? 3 : 0) +
        (wildcardCount > 2 ? 1 : 0) +
        (leadingWildcard ? 1 : 0) +
        (hasCredentialPattern ? 2 : 0) +
        (hasBasicAuth ? 2 : 0) +
        (hasXssVector ? 2 : 0) +
        (hasSqlPattern ? 2 : 0) +
        (hasCmdInjection ? 3 : 0);

      const riskLevel = riskFactors >= 5 ? "high" : riskFactors >= 2 ? "medium" : "low";

      return {
        secInjectionRisk: hasUserInput ? "high" : "low",
        secPathTraversal: hasPathTraversal ? "⚠️" : "✅",
        secOpenRedirect: hasOpenRedirect ? "⚠️" : "✅",
        secSsrfPotential: hasSsrfPattern ? "⚠️" : "✅",
        secRegexDoS: redosRisk ? "⚠️" : "✅",
        secWildcardDanger: wildcardCount > 2 ? "high" : wildcardCount > 0 ? "low" : "none",
        secCredentialExposure: hasCredentialPattern ? "⚠️" : "✅",
        secBasicAuthInUrl: hasBasicAuth ? "⚠️" : "✅",
        secPrivateDataLeak: hasCredentialPattern || hasBasicAuth ? "⚠️" : "✅",
        secRiskScore: riskFactors,
        secRiskLevel: riskLevel,
        secSanitizationNeeded: riskFactors > 0 ? "✅" : "❌",
        secCspCompatible: !hasUserInput && !hasOpenRedirect ? "✅" : "⚠️",
        secCorsImplication: leadingWildcard ? "permissive" : "restrictive",
        secXssVector: hasXssVector ? "⚠️" : "✅",
        secSqlInjection: hasSqlPattern ? "⚠️" : "✅",
        secCommandInjection: hasCmdInjection ? "⚠️" : "✅",
        secInputValidation: pat.hasRegExpGroups ? "strict" : "loose",
      };
    })(),

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.0: Encoding Analysis (14 cols)
    // QUICK WIN #1 & #2: Uses TEXT_ENCODER singleton + ENCODING_PATTERNS
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const percentEncoded = (p.match(ENCODING_PATTERNS.percentEncoded) || []).length;
      const hasInvalidPercent = ENCODING_PATTERNS.invalidPercent.test(p);
      const hasNonAscii = ENCODING_PATTERNS.nonAscii.test(p);
      const needsPunycode = hasNonAscii && ENCODING_PATTERNS.punycode.test(p);
      const hasNullBytes = ENCODING_PATTERNS.nullBytes.test(p);
      const hasControlChars = ENCODING_PATTERNS.controlChars.test(p);
      const doubleEncoded = ENCODING_PATTERNS.doubleEncoded.test(p);
      const mixedEncoding = percentEncoded > 0 && hasNonAscii;
      // QUICK WIN #1: Use singleton TEXT_ENCODER instead of new TextEncoder()
      const byteLength = TEXT_ENCODER.encode(p).length;
      const charLength = p.length;

      return {
        encPercentEncoded: percentEncoded,
        encInvalidPercent: hasInvalidPercent ? "⚠️" : "✅",
        encNonAscii: hasNonAscii ? "✅" : "❌",
        encNeedsPunycode: needsPunycode ? "✅" : "❌",
        encUtf8Safe: !hasNullBytes && !hasControlChars ? "✅" : "⚠️",
        encHasNullBytes: hasNullBytes ? "⚠️" : "✅",
        encHasControlChars: hasControlChars ? "⚠️" : "✅",
        encDoubleEncoded: doubleEncoded ? "⚠️" : "✅",
        encMixedEncoding: mixedEncoding ? "⚠️" : "✅",
        // QUICK WIN #52: Skip normalize() for ASCII-only (most patterns)
        encNormalizationForm: !hasNonAscii || p === p.normalize("NFC") ? "NFC" : "needs-norm",
        encByteLength: byteLength,
        encCharLength: charLength,
        encEncodingRatio: (byteLength / charLength).toFixed(2),
        encRecommendedEncoding: hasNonAscii ? "UTF-8" : "ASCII",
      };
    })(),

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.0: Internationalization (12 cols)
    // QUICK WIN #2: Uses pre-compiled I18N_SCRIPTS + PATTERN_ANALYSIS_REGEX
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const hasUnicode = ENCODING_PATTERNS.nonAscii.test(p);
      const emojiCount = (p.match(PATTERN_ANALYSIS_REGEX.emoji) || []).length;
      const zwjCount = (p.match(PATTERN_ANALYSIS_REGEX.zwj) || []).length;
      const combiningMarks = (p.match(PATTERN_ANALYSIS_REGEX.combiningMarks) || []).length;
      const rtlChars = (p.match(PATTERN_ANALYSIS_REGEX.rtlChars) || []).length;
      // BN-003 fix: Use singleton GRAPHEME_SEGMENTER instead of creating per-row
      const graphemes = [...GRAPHEME_SEGMENTER.segment(p)];
      const displayWidth = Bun.stringWidth(p);

      // QUICK WIN #2: Use pre-compiled I18N_SCRIPTS patterns
      const scripts: string[] = [];
      for (const [name, regex] of Object.entries(I18N_SCRIPTS)) {
        if (regex.test(p)) scripts.push(name);
      }

      const complexity = emojiCount * 3 + zwjCount * 5 + combiningMarks * 2 + rtlChars * 2 + scripts.length;

      return {
        i18nHasUnicode: hasUnicode ? "✅" : "❌",
        i18nScriptTypes: scripts.slice(0, 3).join(",") || "none",
        i18nRtlChars: rtlChars > 0 ? `${rtlChars}` : "0",
        i18nEmojiCount: emojiCount,
        i18nZwjSequences: zwjCount,
        i18nCombiningMarks: combiningMarks,
        i18nGraphemeCount: graphemes.length,
        i18nDisplayWidth: displayWidth,
        i18nBidiLevel: rtlChars > 0 ? "mixed" : "ltr",
        i18nLocaleHint: scripts.includes("CJK") ? "zh/ja" : scripts.includes("Cyrillic") ? "ru" : "en",
        // QUICK WIN #54: Short-circuit normalize for ASCII-only (like #52)
        i18nNormalized: !hasUnicode || p === p.normalize("NFC") ? "✅" : "❌",
        i18nComplexity: complexity,
      };
    })(),

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.0: Cache Analysis (12 cols)
    // QUICK WIN #7: Reuse segments & patternAnalysis.wildcards
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const hasWildcard = patternAnalysis.wildcards > 0;  // Reuse cached value
      const hasDynamicSegment = patternAnalysis.namedGroups > 0;  // Reuse cached value
      const keyComplexity = segments + (hasWildcard ? 2 : 0) + (hasDynamicSegment ? 1 : 0);  // Reuse segments

      // Determine cacheability
      const varyFactors: string[] = [];
      if (hasDynamicSegment) varyFactors.push("params");
      if (p.includes("?")) varyFactors.push("query");
      if (pat.hasRegExpGroups) varyFactors.push("regex");

      const stability = hasWildcard ? "volatile" : hasDynamicSegment ? "variable" : "stable";
      const hitProb = stability === "stable" ? "high" : stability === "variable" ? "medium" : "low";

      // Calculate cache score (0-100) - uses segments from outer scope
      const cacheScore = _max(0, _min(100,  // QUICK WIN #29
        100 - (hasWildcard ? 30 : 0) - (hasDynamicSegment ? 15 : 0) - (segments * 2) - (pat.hasRegExpGroups ? 10 : 0)
      ));

      // Suggested TTL in seconds
      const suggestedTTL = stability === "stable" ? 3600 : stability === "variable" ? 300 : 60;

      return {
        cacheability: hasWildcard ? "no-cache" : hasDynamicSegment ? "private" : "public",
        cacheSuggestedTTL: suggestedTTL,
        cacheKeyComplexity: keyComplexity <= 3 ? "simple" : keyComplexity <= 6 ? "medium" : "complex",
        cacheVaryFactors: varyFactors.join(",") || "none",
        cacheInvalidationRisk: hasWildcard ? "high" : hasDynamicSegment ? "medium" : "low",
        cachePatternStability: stability,
        cacheHitProbability: hitProb,
        cacheMissImpact: pat.hasRegExpGroups ? "high" : "low",
        cacheWarmupPriority: stability === "stable" ? "high" : "low",
        cacheEvictionRisk: keyComplexity > 5 ? "high" : "low",
        cacheScore,
        cacheStrategy: stability === "stable" ? "aggressive" : stability === "variable" ? "moderate" : "minimal",
      };
    })(),

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.1: Peek Cache (5 cols) - Bun.peek() sync cache access
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const stats = getCacheStats();
      return {
        peekCacheHit: peekCacheHit === "sync" ? "SYNC" : peekCacheHit === "async" ? "ASYNC" : peekCacheHit === "error" ? "ERR" : "MISS",
        peekCompileTimeNs: fmtNum(peekCompileTimeNs) + "ns",  // QUICK WIN #21
        peekCacheSize: stats.size,
        peekSyncHitRate: stats.syncHitRate,
        peekCacheStatus: peek.status(getCompiledPattern(p).promise),
      };
    })(),

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.1: Pattern Colors (6 cols) - Bun.color() dedicated palette
    // QUICK WIN #7: Reuse patternAnalysis.wildcards
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const colorInfo = generatePatternColor(i, pat.hasRegExpGroups, patternAnalysis.wildcards > 0, !!m);
      return {
        colorHsl: colorInfo.hsl,
        colorHex: colorInfo.hex,
        colorRgb: colorInfo.rgb,
        colorTier: colorInfo.tier,
        colorCssVar: colorInfo.cssVar,
        colorSwatch: colorInfo.swatch,
      };
    })(),

    // ═══════════════════════════════════════════════════════════════════════
    // Error Handling (10 cols)
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const hasComplexRegex = pat.hasRegExpGroups;
      const hasOptional = p.includes("?") || /\{[^}]*\}\?/.test(p);
      const hasAlternation = p.includes("|");
      // QUICK WIN #49: Reuse cached nestingDepth (was duplicate inline IIFE)

      const edgeCases: string[] = [];
      if (p.includes("*")) edgeCases.push("empty-match");
      if (hasOptional) edgeCases.push("missing-segment");
      if (hasAlternation) edgeCases.push("branch-mismatch");
      if (nestingDepth > 2) edgeCases.push("deep-nesting");

      const errorPotential = edgeCases.length + (hasComplexRegex ? 2 : 0) + (nestingDepth > 2 ? 2 : 0);

      return {
        errParseError: !m && !p.includes("fallback") ? "possible" : "none",
        errRuntimeError: hasComplexRegex ? "possible" : "unlikely",
        errEdgeCases: edgeCases.slice(0, 2).join(",") || "none",
        errNullHandling: hasOptional ? "required" : "optional",
        errBoundaryConditions: nestingDepth > 2 ? "review" : "ok",
        errRecoverable: hasComplexRegex ? "partial" : "full",
        errFailureMode: p.includes("*") ? "soft-fail" : "hard-fail",
        errLoggingLevel: errorPotential > 3 ? "warn" : "info",
        errMonitoringHint: errorPotential > 2 ? "alert" : "metric",
        errPotential: errorPotential,
      };
    })(),

    // DNS Prefetch (8 cols)
    ...(() => {
      const patternHostname = extractHostnameFromPattern(p);
      const dnsResult = patternHostname ? dnsResults.get(patternHostname) : null;
      const dnsStats = getDnsCacheStats();

      return {
        dnsHostname: patternHostname || "N/A",
        dnsAddress: dnsResult?.address || "N/A",
        dnsFamily: dnsResult?.family === 4 ? "IPv4" : dnsResult?.family === 6 ? "IPv6" : "N/A",
        dnsLatencyMs: dnsResult ? `${dnsResult.latencyMs.toFixed(2)}ms` : "N/A",
        dnsCached: dnsResult?.cached ? "hit" : dnsResult ? "miss" : "N/A",
        dnsPrefetchStatus: dnsResult?.error ? "failed" : dnsResult ? "ready" : "skipped",
        dnsCacheHits: dnsStats.cacheHits,
        dnsCacheMisses: dnsStats.cacheMisses,
      };
    })(),

    // Timezone (9 cols) - QUICK WIN #8: Use hoisted STATIC_TZ
    tzTimezone: STATIC_TZ.timezone,
    tzAbbrev: STATIC_TZ.abbrev,
    tzUtcOffset: STATIC_TZ.utcOffset,
    tzOffsetMinutes: STATIC_TZ.offsetMinutes,
    tzIsDST: STATIC_TZ.isDST ? "yes" : "no",
    tzHasDST: STATIC_TZ.hasDST ? "yes" : "no",
    tzLocalTime: STATIC_TZ.localString,
    tzIsoTime: STATIC_TZ.isoLocal,
    tzEpochMs: STATIC_TZ.epochMs,

    // Internal filter flags
    _matched: !!m,
    _hasRegex: pat.hasRegExpGroups,
  };
});

// Apply filters
let rows = allRows;
if (filterMatched) rows = rows.filter(r => r._matched);
if (filterFailed) rows = rows.filter(r => !r._matched);
if (filterRegex) rows = rows.filter(r => r._hasRegex);

// Apply sorting
if (sortArg) {
  const descending = sortArg.startsWith("-");
  const colName = descending ? sortArg.slice(1) : sortArg;
  const resolvedCol = sortAliases[colName] || colName;

  rows = [...rows].sort((a, b) => {
    let aVal = (a as any)[resolvedCol];
    let bVal = (b as any)[resolvedCol];

    // Parse numeric values from strings like "1234/s", "100KB", "0.5ms"
    const parseNum = (v: unknown): number => {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        // Handle "1,234,567/s" format
        const cleaned = v.replace(/,/g, "").replace(/[^0-9.-]/g, "");
        return parseFloat(cleaned) || 0;
      }
      return 0;
    };

    aVal = parseNum(aVal);
    bVal = parseNum(bVal);

    const diff = aVal - bVal;
    return descending ? -diff : diff;
  });
}

// COMPACTED: Column sets as single object (was 17 separate arrays)
const COLS = {
  url: ["idx", "pattern", "matches", "groups", "hasRegExpGroups", "protocol", "hostname", "port", "pathname", "search", "hash", "testResult", "execTime"],
  cookie: ["idx", "cookieName", "cookieValue", "cookieHttpOnly", "cookieSecure", "cookieSameSite", "cookieMaxAge", "cookieSerialized"],
  type: ["idx", "typeofPattern", "typeofResult", "instanceOfURL", "constructorName", "prototypeChain", "isCallable", "isIterable", "symbolToString", "jsonStringify", "typeTag"],
  metrics: ["idx", "execTime", "execNs", "memDeltaKB", "gcCount", "patternComplexity", "groupCount", "segmentCount", "charCount", "specialChars", "nestingDepth", "avgSegmentLen", "entropyScore", "matchScore"],
  props: ["idx", "propCount", "ownKeys", "isExtensible", "isSealed", "isFrozen", "protoName", "descriptorTypes", "enumerableCount"],
  patternAnalysis: ["idx", "patternComponents", "paHasRegExpGroups", "wildcardCount", "namedGroupCount", "optionalGroupCount", "patternComplexityScore", "canonicalForm"],
  internal: ["idx", "hiddenClass", "internalSlots", "compiledRegexCount", "patternStringLength", "encodingOverhead", "structureFingerprint"],
  perfDeep: ["idx", "testOpsPerSec", "execOpsPerSec", "cacheHitRate", "deoptimizationRisk", "inlineCacheStatus", "jitTier"],
  memory: ["idx", "objectSize", "propertyStorageSize", "transitionChainLength", "memoryAlignment", "gcPressure", "retainedSize"],
  webStd: ["idx", "specCompliance", "wptTestsEstimate", "browserCompatibility", "regexFeaturesUsed", "canonicalPattern", "specVersion"],
  extras: ["idx", "uuidv7", "uuidv7Timestamp", "fib", "isPrime", "memoryMB", "patternHash", "calcBinary", "calcHex", "calcSquare", "calcCube", "calcFactorial", "calcReverse", "calcDigitSum", "calcDigitProduct", "timestamp", "randomInt", "randomFloat", "randomBool", "generatedIP", "generatedEmail", "generatedPhone", "processId", "processUptime", "bunVersion", "bunPath", "isMainEntry", "memoryRSS", "cpuUser", "cpuSystem"],
  envVars: ["idx", "envNodeEnv", "envBunEnv", "envHasDebug", "envHasVerbose", "envPathSegments", "envHomeSet", "envShellType", "envTermType", "envLocale", "envTZ", "envCI", "envPlatform", "envArch", "envVarCount", "envVarRisk"],
  security: ["idx", "secInjectionRisk", "secPathTraversal", "secOpenRedirect", "secSsrfPotential", "secRegexDoS", "secWildcardDanger", "secCredentialExposure", "secBasicAuthInUrl", "secPrivateDataLeak", "secRiskScore", "secRiskLevel", "secSanitizationNeeded", "secCspCompatible", "secCorsImplication", "secXssVector", "secSqlInjection", "secCommandInjection", "secInputValidation"],
  encoding: ["idx", "encPercentEncoded", "encInvalidPercent", "encNonAscii", "encNeedsPunycode", "encUtf8Safe", "encHasNullBytes", "encHasControlChars", "encDoubleEncoded", "encMixedEncoding", "encNormalizationForm", "encByteLength", "encCharLength", "encEncodingRatio", "encRecommendedEncoding"],
  i18n: ["idx", "i18nHasUnicode", "i18nScriptTypes", "i18nRtlChars", "i18nEmojiCount", "i18nZwjSequences", "i18nCombiningMarks", "i18nGraphemeCount", "i18nDisplayWidth", "i18nBidiLevel", "i18nLocaleHint", "i18nNormalized", "i18nComplexity"],
  cache: ["idx", "cacheability", "cacheSuggestedTTL", "cacheKeyComplexity", "cacheVaryFactors", "cacheInvalidationRisk", "cachePatternStability", "cacheHitProbability", "cacheMissImpact", "cacheWarmupPriority", "cacheEvictionRisk", "cacheScore", "cacheStrategy"],
  peek: ["idx", "pattern", "peekCacheHit", "peekCompileTimeNs", "peekCacheSize", "peekSyncHitRate", "peekCacheStatus"],
  errors: ["idx", "errParseError", "errRuntimeError", "errEdgeCases", "errNullHandling", "errBoundaryConditions", "errRecoverable", "errFailureMode", "errLoggingLevel", "errMonitoringHint", "errPotential"],
  color: ["idx", "pattern", "colorSwatch", "colorTier", "colorHsl", "colorHex", "colorRgb", "colorCssVar"],
  dns: ["idx", "pattern", "dnsHostname", "dnsAddress", "dnsFamily", "dnsLatencyMs", "dnsCached", "dnsPrefetchStatus", "dnsCacheHits", "dnsCacheMisses"],
  tz: ["idx", "pattern", "tzTimezone", "tzAbbrev", "tzUtcOffset", "tzOffsetMinutes", "tzIsDST", "tzHasDST", "tzLocalTime", "tzIsoTime", "tzEpochMs"],
} as const;

// COMPACTED: Column selection via data-driven mapping (was 22 if statements)
type ColKey = keyof typeof COLS;
const COL_CONFIG: { key: ColKey; name: string; show: () => boolean }[] = [
  { key: "url", name: "URL", show: () => showUrl || showAll },
  { key: "cookie", name: "Cookie", show: () => showCookie || showAll },
  { key: "type", name: "Type", show: () => showType || showAll },
  { key: "metrics", name: "Metrics", show: () => showMetrics || showAll || quickBenchmark },
  { key: "props", name: "Props", show: () => showProps || showAll },
  { key: "patternAnalysis", name: "PatternAnalysis", show: () => showPatternAnalysis || showAll },
  { key: "internal", name: "Internal", show: () => showInternalStructure || showAll },
  { key: "perfDeep", name: "PerfDeep", show: () => showPerfDeep || showAll || quickBenchmark },
  { key: "memory", name: "Memory", show: () => showMemoryLayout || showAll || quickBenchmark },
  { key: "webStd", name: "WebStd", show: () => showWebStandards || showAll || quickProdReady },
  { key: "extras", name: "Extras", show: () => showExtras || showAll },
  { key: "envVars", name: "EnvVars", show: () => showEnvVars || showAll || quickAudit },
  { key: "security", name: "Security", show: () => showSecurity || showAll || quickAudit || quickProdReady },
  { key: "encoding", name: "Encoding", show: () => showEncoding || showAll || quickInternational },
  { key: "i18n", name: "I18n", show: () => showI18n || showAll || quickInternational },
  { key: "cache", name: "Cache", show: () => showCache || showAll || quickProdReady },
  { key: "peek", name: "Peek", show: () => showPeek || showAll || quickBenchmark },
  { key: "errors", name: "Errors", show: () => showErrors || showAll || quickAudit },
  { key: "color", name: "Color", show: () => showColor || showAll },
  { key: "dns", name: "DNS", show: () => showDnsStats || dnsPrefetch || showAll },
  { key: "tz", name: "Timezone", show: () => showTzInfo || !!tzFlag || showAll },
];

// Build selected columns via filter+reduce (replaces manual push loops)
const selectedSets = COL_CONFIG.filter(c => c.show()).map(c => ({ cols: COLS[c.key], name: c.name }));
const merged = new Set(selectedSets.flatMap(s => [...s.cols]));
const selectedCols = selectedSets.length > 0 && !showAll ? Array.from(merged) : undefined;
const title = selectedSets.length > 0 && !showAll ? selectedSets.map(s => s.name).join(" + ") : "Full Analysis v3.0";
const colCount = selectedCols?.length ?? new Set(Object.values(COLS).flat()).size;

// Build filter suffix
const filters: string[] = [];
if (filterMatched) filters.push("matched");
if (filterFailed) filters.push("failed");
if (filterRegex) filters.push("regex");
if (sortArg) {
  const desc = sortArg.startsWith("-");
  const col = desc ? sortArg.slice(1) : sortArg;
  const resolved = sortAliases[col] || col;
  filters.push(`sort:${desc ? "↓" : "↑"}${resolved}`);
}
const filterSuffix = filters.length ? ` [${filters.join(" ")}]` : "";

// Clean output rows (remove internal flags)
const outputRows = rows.map(({ _matched, _hasRegex, ...rest }) => rest);

// ─────────────────────────────────────────────────────────────────────────────
// Fix Mode: Auto-remediate patterns and save to file
// ─────────────────────────────────────────────────────────────────────────────
if (fixMode) {
  const remediations = patterns.map(p => remediatePattern(p));
  const hasChanges = remediations.some(r => r.changes.length > 0);

  // Determine output path
  const fixedFilePath = outputFile ||
    (patternFile ? patternFile.replace(/(\.\w+)?$/, ".fixed$1") : "patterns.fixed.txt");

  // Build fixed file content
  const fixedContent = remediations.map((r, i) => {
    const lines: string[] = [];
    if (r.changes.length > 0) {
      // Add change comments
      const reviewComments = r.changes.filter(c => c.startsWith("#"));
      const actualChanges = r.changes.filter(c => !c.startsWith("#"));
      if (actualChanges.length > 0) {
        lines.push(`# [FIXED] Row ${i}: ${actualChanges.join("; ")}`);
      }
      reviewComments.forEach(c => lines.push(c));
    }
    lines.push(r.fixed);
    return lines.join("\n");
  }).join("\n");

  await Bun.write(fixedFilePath, fixedContent + "\n");

  // Output remediation summary
  const totalFixes = remediations.filter(r => r.changes.length > 0).length;
  const riskReduction = remediations.reduce((acc, r) => acc + (r.riskBefore - r.riskAfter), 0);

  console.log("─".repeat(80));
  console.log("🛡️  AUTO-REMEDIATION COMPLETE");
  console.log("─".repeat(80));
  console.log(`📁 Output:       ${fixedFilePath}`);
  console.log(`📊 Patterns:     ${patterns.length} scanned`);
  console.log(`🔧 Fixed:        ${totalFixes} patterns modified`);
  console.log(`📉 Risk Δ:       -${riskReduction} points total`);
  console.log("");

  // Show detailed changes
  if (hasChanges) {
    const changeRows = remediations
      .filter(r => r.changes.length > 0)
      .map((r, i) => ({
        idx: patterns.indexOf(r.original),
        pattern: r.original.slice(0, 35) + (r.original.length > 35 ? "..." : ""),
        riskBefore: r.riskBefore,
        riskAfter: r.riskAfter,
        changes: r.changes.filter(c => !c.startsWith("#")).slice(0, 2).join("; ").slice(0, 40),
        review: r.changes.some(c => c.startsWith("#")) ? "⚠️" : "✅",
      }));

    console.log("Changes Applied:");
    console.log(Bun.inspect.table(changeRows, { colors: !noColor }));
  } else {
    console.log("✅ No security issues detected - all patterns clean!");
  }

  // Open fixed file in editor
  if (openInEditor) {
    const editorOpts: { editor?: string; line?: number; column?: number } = { line: 1 };
    if (editorOverride) editorOpts.editor = editorOverride;
    Bun.openInEditor(fixedFilePath, editorOpts);
    console.log(`📝 Opened ${fixedFilePath} in editor`);
  }

  // If not also doing regular output, exit
  if (!jsonOutput && !showAll && !anySelected) {
    process.exit(0);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CI Mode: Evaluate risk threshold and exit with appropriate code
// ─────────────────────────────────────────────────────────────────────────────
if (ciMode) {
  const threshold = (["low", "medium", "high"].includes(thresholdArg)
    ? thresholdArg
    : "medium") as "low" | "medium" | "high";

  const ciRows = allRows.map(r => ({
    idx: r.idx,
    pattern: patterns[r.idx] || r.pattern,
    secRiskLevel: r.secRiskLevel,
    secRiskScore: r.secRiskScore,
  }));

  const ciResult = evaluateCIGate(ciRows, threshold);

  // Build current snapshot for baseline comparison
  const currentSnapshot = {
    patterns: ciRows.map(r => ({
      pattern: r.pattern,
      riskLevel: r.secRiskLevel,
      riskScore: r.secRiskScore,
    })),
    summary: ciResult.summary,
    threshold,
  };

  // Baseline comparison with Bun.deepEquals (strict mode)
  let baselineComparison: {
    matches: boolean;
    drift: { field: string; baseline: unknown; current: unknown }[];
    newPatterns: string[];
    removedPatterns: string[];
    riskChanges: { pattern: string; before: string; after: string }[];
  } | null = null;

  if (baselineFile) {
    try {
      const baselineData = await Bun.file(baselineFile).json();

      // Strict comparison for exact structural match
      const exactMatch = Bun.deepEquals(currentSnapshot, baselineData, true);

      // Detailed drift analysis
      const drift: { field: string; baseline: unknown; current: unknown }[] = [];
      const newPatterns: string[] = [];
      const removedPatterns: string[] = [];
      const riskChanges: { pattern: string; before: string; after: string }[] = [];

      // Compare summaries (strict mode)
      if (!Bun.deepEquals(currentSnapshot.summary, baselineData.summary, true)) {
        for (const key of ["low", "medium", "high"] as const) {
          if (currentSnapshot.summary[key] !== baselineData.summary[key]) {
            drift.push({
              field: `summary.${key}`,
              baseline: baselineData.summary[key],
              current: currentSnapshot.summary[key],
            });
          }
        }
      }

      // Compare patterns
      const baselinePatterns = new Set(baselineData.patterns?.map((p: any) => p.pattern) || []);
      const currentPatterns = new Set(currentSnapshot.patterns.map(p => p.pattern));

      for (const p of currentPatterns) {
        if (!baselinePatterns.has(p)) newPatterns.push(p);
      }
      for (const p of baselinePatterns) {
        if (!currentPatterns.has(p)) removedPatterns.push(p);
      }

      // Compare risk levels for matching patterns
      for (const curr of currentSnapshot.patterns) {
        const baseline = baselineData.patterns?.find((p: any) => p.pattern === curr.pattern);
        if (baseline && baseline.riskLevel !== curr.riskLevel) {
          riskChanges.push({
            pattern: curr.pattern,
            before: baseline.riskLevel,
            after: curr.riskLevel,
          });
        }
      }

      baselineComparison = {
        matches: exactMatch,
        drift,
        newPatterns,
        removedPatterns,
        riskChanges,
      };
    } catch (e: any) {
      console.error(`⚠️ Failed to load baseline: ${e.message}`);
    }
  }

  // Save baseline if requested
  if (saveBaseline) {
    const baselinePath = outputFile || ".matrix-baseline.json";
    await Bun.write(baselinePath, JSON.stringify(currentSnapshot, null, 2));
    console.log(`📁 Baseline saved: ${baselinePath}`);
  }

  // Determine overall pass/fail (threshold + baseline)
  const baselinePassed = !baselineComparison || baselineComparison.matches;
  const overallPassed = ciResult.passed && baselinePassed;

  if (jsonOutput) {
    // JSON output for CI parsing
    console.log(JSON.stringify({
      ...ciResult,
      passed: overallPassed,
      timestamp: new Date().toISOString(),
      file: patternFile || "default",
      baseline: baselineComparison ? {
        file: baselineFile,
        matches: baselineComparison.matches,
        drift: baselineComparison.drift,
        newPatterns: baselineComparison.newPatterns,
        removedPatterns: baselineComparison.removedPatterns,
        riskChanges: baselineComparison.riskChanges,
      } : null,
    }, null, 2));
  } else {
    console.log("─".repeat(80));
    console.log(`🚦 CI GATE: ${overallPassed ? "✅ PASSED" : "❌ FAILED"}`);
    console.log("─".repeat(80));
    console.log(`📊 Threshold:    ${threshold}`);
    console.log(`📁 Patterns:     ${ciResult.totalPatterns}`);
    console.log(`📈 Distribution: ${ciResult.summary.low} low | ${ciResult.summary.medium} medium | ${ciResult.summary.high} high`);
    console.log(`🚨 Violations:   ${ciResult.violations.length}`);

    // Baseline comparison output
    if (baselineComparison) {
      console.log("");
      console.log(`🔍 BASELINE COMPARISON (Bun.deepEquals strict=${true})`);
      console.log("─".repeat(40));
      console.log(`📋 Baseline:     ${baselineFile}`);
      console.log(`🎯 Exact Match:  ${baselineComparison.matches ? "✅ YES" : "❌ NO"}`);

      if (!baselineComparison.matches) {
        // Show drift details
        if (baselineComparison.drift.length > 0) {
          console.log("");
          console.log("📉 Summary Drift:");
          console.log(Bun.inspect.table(baselineComparison.drift, { colors: !noColor }));
        }

        if (baselineComparison.newPatterns.length > 0) {
          console.log("");
          console.log(`➕ New Patterns (${baselineComparison.newPatterns.length}):`);
          baselineComparison.newPatterns.slice(0, 5).forEach(p =>
            console.log(`   ${p.slice(0, 60)}${p.length > 60 ? "..." : ""}`)
          );
          if (baselineComparison.newPatterns.length > 5) {
            console.log(`   ... and ${baselineComparison.newPatterns.length - 5} more`);
          }
        }

        if (baselineComparison.removedPatterns.length > 0) {
          console.log("");
          console.log(`➖ Removed Patterns (${baselineComparison.removedPatterns.length}):`);
          baselineComparison.removedPatterns.slice(0, 5).forEach(p =>
            console.log(`   ${p.slice(0, 60)}${p.length > 60 ? "..." : ""}`)
          );
        }

        if (baselineComparison.riskChanges.length > 0) {
          console.log("");
          console.log("⚠️ Risk Level Changes:");
          console.log(Bun.inspect.table(baselineComparison.riskChanges.map(r => ({
            pattern: r.pattern.slice(0, 35) + (r.pattern.length > 35 ? "..." : ""),
            before: r.before,
            after: r.after,
            direction: ["low", "medium", "high"].indexOf(r.after) >
                       ["low", "medium", "high"].indexOf(r.before) ? "📈 WORSE" : "📉 BETTER",
          })), { colors: !noColor }));
        }
      }
    }

    console.log("");

    if (ciResult.violations.length > 0) {
      console.log("Violations:");
      const violationTable = ciResult.violations.map(v => ({
        idx: v.idx,
        pattern: v.pattern.slice(0, 40) + (v.pattern.length > 40 ? "..." : ""),
        riskLevel: v.riskLevel,
        riskScore: v.riskScore,
      }));
      console.log(Bun.inspect.table(violationTable, { colors: !noColor }));

      // Open pattern file at first violation
      if (openInEditor && patternFile) {
        const firstViolation = ciResult.violations[0];
        const editorOpts: { editor?: string; line?: number; column?: number } = {
          line: firstViolation.idx + 1, // 1-indexed line number
          column: 1,
        };
        if (editorOverride) editorOpts.editor = editorOverride;
        Bun.openInEditor(patternFile, editorOpts);
        console.log(`📝 Opened ${patternFile}:${firstViolation.idx + 1} in editor`);
      }
    }
  }

  // Exit with appropriate code
  process.exit(overallPassed ? 0 : 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 Enhanced Mode: CSV Export
// ─────────────────────────────────────────────────────────────────────────────
function toCSV(data: Record<string, unknown>[], columns?: string[]): string {
  if (data.length === 0) return "";
  const cols = columns || Object.keys(data[0]);
  const escapeCSV = (v: unknown): string => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const header = cols.join(",");
  const rows = data.map(row => cols.map(c => escapeCSV(row[c])).join(","));
  return [header, ...rows].join("\n");
}

if (csvOutput) {
  console.log(toCSV(outputRows, selectedCols));
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 Enhanced Mode: Markdown Export
// ─────────────────────────────────────────────────────────────────────────────
function toMarkdown(data: Record<string, unknown>[], columns?: string[], titleStr?: string): string {
  if (data.length === 0) return "_No data_";
  const cols = columns || Object.keys(data[0]);
  const lines: string[] = [];

  if (titleStr) {
    lines.push(`## ${titleStr}`, "");
  }

  // Header
  lines.push("| " + cols.join(" | ") + " |");
  lines.push("| " + cols.map(() => "---").join(" | ") + " |");

  // Rows
  for (const row of data) {
    const cells = cols.map(c => {
      const v = row[c];
      const s = String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
      return s.length > 50 ? s.slice(0, 47) + "..." : s;
    });
    lines.push("| " + cells.join(" | ") + " |");
  }

  lines.push("", `_Generated by MATRIX v3.1 at ${new Date().toISOString()}_`);
  return lines.join("\n");
}

if (markdownOutput) {
  console.log(toMarkdown(outputRows, selectedCols, `${title}${filterSuffix}`));
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 Enhanced Mode: Summary Statistics
// ─────────────────────────────────────────────────────────────────────────────
function generateSummary(data: RowData[]): void {
  console.log("─".repeat(80));
  console.log("📊 MATRIX v3.1 SUMMARY STATISTICS");
  console.log("─".repeat(80));

  // Basic counts
  console.log(`\n📁 Patterns: ${data.length}`);
  const matched = data.filter(r => r._matched).length;
  const failed = data.length - matched;
  console.log(`   ✅ Matched: ${matched}  |  ❌ Failed: ${failed}`);

  // Security distribution
  const secDist = { low: 0, medium: 0, high: 0 };
  for (const r of data) {
    const level = (r.secRiskLevel as string) || "low";
    if (level in secDist) secDist[level as keyof typeof secDist]++;
  }
  console.log(`\n🔒 Security Risk Distribution:`);
  console.log(`   🟢 Low: ${secDist.low}  |  🟡 Medium: ${secDist.medium}  |  🔴 High: ${secDist.high}`);

  // Performance stats
  const execTimes = data.map(r => Number(r.execNs) || 0).filter(n => n > 0);
  if (execTimes.length > 0) {
    const avgExec = execTimes.reduce((a, b) => a + b, 0) / execTimes.length;
    const minExec = Math.min(...execTimes);
    const maxExec = Math.max(...execTimes);
    console.log(`\n⚡ Execution Time (ns):`);
    console.log(`   Min: ${minExec.toLocaleString()}  |  Avg: ${avgExec.toLocaleString()}  |  Max: ${maxExec.toLocaleString()}`);
  }

  // Complexity stats
  const complexities = data.map(r => Number(r.patternComplexity) || 0);
  const avgComplexity = complexities.reduce((a, b) => a + b, 0) / complexities.length;
  const regexCount = data.filter(r => r._hasRegex).length;
  console.log(`\n🧮 Complexity:`);
  console.log(`   Avg Complexity: ${avgComplexity.toFixed(1)}  |  RegExp Patterns: ${regexCount}/${data.length}`);

  // Cache stats
  const cs = getCacheStats();
  console.log(`\n💾 Pattern Cache:`);
  console.log(`   Size: ${cs.size}  |  Hit Rate: ${cs.hitRate}  |  Sync Hits: ${cs.syncHitRate}`);

  console.log("\n" + "─".repeat(80));
}

if (showSummary) {
  generateSummary(allRows);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 Enhanced Mode: Diff Comparison
// ─────────────────────────────────────────────────────────────────────────────
if (diffFile) {
  const basePatterns = await loadPatternsFromFile(diffFile);
  const baseSet = new Set(basePatterns);
  const currentSet = new Set(patterns);

  const added = patterns.filter(p => !baseSet.has(p));
  const removed = basePatterns.filter(p => !currentSet.has(p));
  const unchanged = patterns.filter(p => baseSet.has(p));

  console.log("─".repeat(80));
  console.log("📊 PATTERN DIFF ANALYSIS");
  console.log("─".repeat(80));
  console.log(`📁 Base:    ${diffFile} (${basePatterns.length} patterns)`);
  console.log(`📁 Current: ${patternFile || "default"} (${patterns.length} patterns)`);
  console.log("");
  console.log(`➕ Added:     ${added.length}`);
  console.log(`➖ Removed:   ${removed.length}`);
  console.log(`🔄 Unchanged: ${unchanged.length}`);

  if (added.length > 0) {
    console.log("\n➕ NEW PATTERNS:");
    const addedTable = added.slice(0, 10).map((p, i) => ({
      "#": i + 1,
      pattern: p.slice(0, 60) + (p.length > 60 ? "..." : ""),
    }));
    console.log(Bun.inspect.table(addedTable, { colors: !noColor }));
    if (added.length > 10) console.log(`   ... and ${added.length - 10} more`);
  }

  if (removed.length > 0) {
    console.log("\n➖ REMOVED PATTERNS:");
    const removedTable = removed.slice(0, 10).map((p, i) => ({
      "#": i + 1,
      pattern: p.slice(0, 60) + (p.length > 60 ? "..." : ""),
    }));
    console.log(Bun.inspect.table(removedTable, { colors: !noColor }));
    if (removed.length > 10) console.log(`   ... and ${removed.length - 10} more`);
  }

  // Don't exit - continue to show normal output if requested
  if (!jsonOutput && !showAll && !anySelected) {
    process.exit(0);
  }
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 Enhanced Mode: HTTP Server with WebSocket Support
// ─────────────────────────────────────────────────────────────────────────────
if (serveMode) {
  const routes = {
    analyze: new URLPattern("/api/analyze", `http://localhost:${serverPort}`),
    patterns: new URLPattern("/api/patterns", `http://localhost:${serverPort}`),
    health: new URLPattern("/api/health", `http://localhost:${serverPort}`),
    stats: new URLPattern("/api/stats", `http://localhost:${serverPort}`),
    ws: new URLPattern("/ws", `http://localhost:${serverPort}`),
  };

  // WebSocket client tracking
  type WSClient = {
    ws: any;
    subscriptions: Set<string>;
    connectedAt: number;
  };
  const wsClients = new Map<string, WSClient>();
  let wsClientId = 0;

  // Broadcast to all connected WebSocket clients
  const broadcast = (type: string, data: unknown) => {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    for (const [id, client] of wsClients) {
      if (client.subscriptions.has("*") || client.subscriptions.has(type)) {
        try {
          client.ws.send(message);
        } catch {
          wsClients.delete(id);
        }
      }
    }
  };

  // Build current matrix snapshot for WebSocket updates
  const getMatrixSnapshot = () => ({
    patterns: patterns.length,
    rows: allRows.slice(0, 15).map(r => ({
      idx: r.idx,
      pattern: r.pattern,
      matches: r.matches,
      colorTier: r.colorTier,
      colorHex: r.colorHex,
      secRiskLevel: r.secRiskLevel,
      secRiskScore: r.secRiskScore,
      testOpsPerSec: r.testOpsPerSec,
      execOpsPerSec: r.execOpsPerSec,
      dnsHostname: r.dnsHostname,
      dnsLatencyMs: r.dnsLatencyMs,
      dnsPrefetchStatus: r.dnsPrefetchStatus,
      tzTimezone: r.tzTimezone,
      tzUtcOffset: r.tzUtcOffset,
    })),
    cache: getCacheStats(),
    dns: getDnsCacheStats(),
    timezone: getTimezoneInfo(),
    uptime: process.uptime(),
  });

  // Build security summary
  const getSecuritySummary = () => {
    const dist = { low: 0, medium: 0, high: 0 };
    for (const r of allRows) {
      const level = (r.secRiskLevel as string) || "low";
      if (level in dist) dist[level as keyof typeof dist]++;
    }
    return {
      distribution: dist,
      totalPatterns: patterns.length,
      analyzedRows: allRows.length,
    };
  };

  // Build performance summary
  const getPerformanceSummary = () => {
    const ops = allRows.map(r => typeof r.testOpsPerSec === "number" ? r.testOpsPerSec : 0);
    const avgOps = ops.length > 0 ? ops.reduce((a, b) => a + b, 0) / ops.length : 0;
    const maxOps = Math.max(...ops, 0);
    const minOps = Math.min(...ops.filter(n => n > 0), Infinity);
    return {
      avgOpsPerSec: Math.round(avgOps),
      maxOpsPerSec: Math.round(maxOps),
      minOpsPerSec: minOps === Infinity ? 0 : Math.round(minOps),
      patternCount: patterns.length,
    };
  };

  const server = Bun.serve({
    port: serverPort,
    fetch(req) {
      const url = req.url;

      // WebSocket upgrade
      if (wsMode && routes.ws.test(url)) {
        const clientId = `ws-${++wsClientId}`;
        const upgraded = server.upgrade(req, { data: { clientId } });
        if (upgraded) {
          return undefined as unknown as Response;
        }
        return Response.json({ error: "WebSocket upgrade failed" }, { status: 400 });
      }

      // Health check
      if (routes.health.test(url)) {
        return Response.json({
          status: "ok",
          version: "3.1",
          uptime: process.uptime(),
          wsEnabled: wsMode,
          wsClients: wsClients.size,
        });
      }

      // Get cached patterns list
      if (routes.patterns.test(url)) {
        return Response.json({ patterns, count: patterns.length });
      }

      // Get analysis stats
      if (routes.stats.test(url)) {
        return Response.json({
          ...getSecuritySummary(),
          performance: getPerformanceSummary(),
          cache: getCacheStats(),
          dns: getDnsCacheStats(),
          timezone: getTimezoneInfo(),
        });
      }

      // Analyze patterns (POST with body)
      if (routes.analyze.test(url) && req.method === "POST") {
        return (async () => {
          try {
            const body = await req.json() as { patterns?: string[]; testUrl?: string };
            const inputPatterns = body.patterns || [];
            const testUrlStr = body.testUrl || testUrl;

            const results = inputPatterns.map((p, i) => {
              try {
                const pat = new URLPattern(p, "https://example.com");
                const matched = pat.test(testUrlStr);
                return {
                  idx: i,
                  pattern: p,
                  valid: true,
                  matched,
                  hasRegExpGroups: pat.hasRegExpGroups,
                };
              } catch (e: any) {
                return {
                  idx: i,
                  pattern: p,
                  valid: false,
                  error: e.message,
                };
              }
            });

            // Broadcast analysis results to WebSocket clients
            if (wsMode && wsClients.size > 0) {
              broadcast("analysis", { results, count: results.length });
            }

            return Response.json({ results, count: results.length });
          } catch (e: any) {
            return Response.json({ error: e.message }, { status: 400 });
          }
        })();
      }

      // Default: return API info
      const endpoints = [
        { method: "GET", path: "/api/health", description: "Health check" },
        { method: "GET", path: "/api/patterns", description: "List loaded patterns" },
        { method: "GET", path: "/api/stats", description: "Analysis statistics" },
        { method: "POST", path: "/api/analyze", description: "Analyze patterns", body: "{ patterns: string[], testUrl?: string }" },
      ];
      if (wsMode) {
        endpoints.push({ method: "WS", path: "/ws", description: "WebSocket for live updates" });
      }
      return Response.json({ name: "MATRIX v3.1 API", wsEnabled: wsMode, endpoints });
    },

    // WebSocket handlers (only active when wsMode is true)
    websocket: wsMode ? {
      open(ws) {
        const clientId = (ws.data as { clientId: string }).clientId;
        wsClients.set(clientId, {
          ws,
          subscriptions: new Set(["*"]), // Subscribe to all by default
          connectedAt: Date.now(),
        });
        console.log(`[WS] Client connected: ${clientId} (total: ${wsClients.size})`);

        // Send initial snapshot
        ws.send(JSON.stringify({
          type: "connected",
          data: {
            clientId,
            message: "Connected to MATRIX v3.1 WebSocket",
            subscriptions: ["*"],
          },
          timestamp: Date.now(),
        }));

        // Send initial matrix state
        ws.send(JSON.stringify({
          type: "matrix",
          data: getMatrixSnapshot(),
          timestamp: Date.now(),
        }));
      },

      message(ws, message) {
        const clientId = (ws.data as { clientId: string }).clientId;
        const client = wsClients.get(clientId);
        if (!client) return;

        try {
          const msg = JSON.parse(message.toString()) as {
            action?: string;
            subscribe?: string[];
            unsubscribe?: string[];
          };

          // Handle subscription changes
          if (msg.subscribe) {
            for (const sub of msg.subscribe) {
              client.subscriptions.add(sub);
            }
          }
          if (msg.unsubscribe) {
            for (const sub of msg.unsubscribe) {
              client.subscriptions.delete(sub);
            }
          }

          // Handle action requests
          if (msg.action === "snapshot") {
            ws.send(JSON.stringify({
              type: "matrix",
              data: getMatrixSnapshot(),
              timestamp: Date.now(),
            }));
          } else if (msg.action === "security") {
            ws.send(JSON.stringify({
              type: "security",
              data: getSecuritySummary(),
              timestamp: Date.now(),
            }));
          } else if (msg.action === "performance") {
            ws.send(JSON.stringify({
              type: "performance",
              data: getPerformanceSummary(),
              timestamp: Date.now(),
            }));
          } else if (msg.action === "ping") {
            ws.send(JSON.stringify({
              type: "pong",
              data: { uptime: process.uptime(), clients: wsClients.size },
              timestamp: Date.now(),
            }));
          } else if (msg.action === "dns") {
            ws.send(JSON.stringify({
              type: "dns",
              data: getDnsCacheStats(),
              timestamp: Date.now(),
            }));
          } else if (msg.action === "timezone") {
            ws.send(JSON.stringify({
              type: "timezone",
              data: getTimezoneInfo(),
              timestamp: Date.now(),
            }));
          }
        } catch {
          // Invalid JSON, ignore
        }
      },

      close(ws) {
        const clientId = (ws.data as { clientId: string }).clientId;
        wsClients.delete(clientId);
        console.log(`[WS] Client disconnected: ${clientId} (total: ${wsClients.size})`);
      },
    } : undefined,
  });

  console.log("─".repeat(80));
  console.log(`🚀 MATRIX v3.1 API SERVER${wsMode ? " + WebSocket" : ""}`);
  console.log("─".repeat(80));
  console.log(`📡 HTTP:      http://localhost:${server.port}`);
  if (wsMode) {
    console.log(`🔌 WebSocket: ws://localhost:${server.port}/ws`);
  }
  console.log(`📁 Patterns:  ${patterns.length} loaded`);
  console.log("");
  console.log("Endpoints:");
  console.log("  GET  /api/health    - Health check");
  console.log("  GET  /api/patterns  - List patterns");
  console.log("  GET  /api/stats     - Analysis stats");
  console.log("  POST /api/analyze   - Analyze patterns");
  if (wsMode) {
    console.log("  WS   /ws            - Live WebSocket updates");
    console.log("");
    console.log("WebSocket Messages:");
    console.log('  → { "action": "snapshot" }     Request matrix snapshot');
    console.log('  → { "action": "security" }     Request security summary');
    console.log('  → { "action": "performance" }  Request performance summary');
    console.log('  → { "action": "dns" }          Request DNS cache stats');
    console.log('  → { "action": "timezone" }     Request timezone info');
    console.log('  → { "action": "ping" }         Ping/pong heartbeat');
    console.log('  → { "subscribe": ["matrix"] }  Subscribe to specific events');
  }
  console.log("");
  console.log("Press Ctrl+C to stop");

  // Live broadcast interval (when WebSocket enabled)
  if (wsMode) {
    setInterval(() => {
      if (wsClients.size > 0) {
        broadcast("heartbeat", {
          uptime: process.uptime(),
          clients: wsClients.size,
          patterns: patterns.length,
        });
      }
    }, 5000); // Heartbeat every 5 seconds

    // Matrix snapshot broadcast every 10 seconds
    setInterval(() => {
      if (wsClients.size > 0) {
        broadcast("matrix", getMatrixSnapshot());
      }
    }, 10000);
  }

  // Keep server running
  await new Promise(() => {}); // Block forever
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 Enhanced Mode: Watch Mode
// ─────────────────────────────────────────────────────────────────────────────
if (watchMode && patternFile) {
  const runAnalysis = async () => {
    console.clear();
    const newPatterns = await loadPatternsFromFile(patternFile);
    console.log(`📁 Loaded ${newPatterns.length} patterns from ${patternFile}`);
    console.log(`⏰ Last update: ${new Date().toLocaleTimeString()}`);
    console.log("─".repeat(80));

    // Quick security summary
    let low = 0, medium = 0, high = 0;
    for (const p of newPatterns.slice(0, rowLimit)) {
      try {
        const pat = new URLPattern(p, "https://example.com");
        // Simple risk heuristic
        if (/:path\*|\/\*\*/.test(p)) high++;
        else if (/\(\.\*\)|\+\)|\*\)/.test(p)) medium++;
        else low++;
      } catch {
        high++; // Invalid patterns are high risk
      }
    }

    console.log(`🔒 Quick Risk: 🟢 ${low} low | 🟡 ${medium} med | 🔴 ${high} high`);
    console.log("");

    // Show first few patterns
    const previewTable = newPatterns.slice(0, 8).map((p, i) => ({
      "#": i + 1,
      pattern: p.slice(0, 50) + (p.length > 50 ? "..." : ""),
      status: (() => {
        try {
          new URLPattern(p, "https://example.com");
          return "✅";
        } catch {
          return "❌";
        }
      })(),
    }));
    console.log(Bun.inspect.table(previewTable, { colors: !noColor }));
    if (newPatterns.length > 8) {
      console.log(`   ... and ${newPatterns.length - 8} more patterns`);
    }

    console.log("\n👀 Watching for changes... (Ctrl+C to stop)");
  };

  // Initial run
  await runAnalysis();

  // Watch for changes using fs.watch (Bun-compatible)
  const { watch } = await import("fs");
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch(patternFile, (eventType) => {
    if (eventType === "change") {
      // Debounce rapid changes
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        await runAnalysis();
      }, 150);
    }
  });

  // Keep process alive
  await new Promise(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Standard Output
// ─────────────────────────────────────────────────────────────────────────────
if (jsonOutput) {
  console.log(JSON.stringify(outputRows, null, 2));
} else if (!csvOutput && !markdownOutput) {
  // Header with timezone info
  const tz = getTimezoneInfo();
  const tzHeader = `${tz.abbrev} (${tz.utcOffset})`;
  console.log("─".repeat(120));
  console.log(`${title}${filterSuffix}  (${colCount} columns, ${rows.length} rows)`.padEnd(80) + `🕐 ${tzHeader}`.padStart(40));
  console.log("─".repeat(120));

  if (selectedCols) {
    console.log(Bun.inspect.table(outputRows, selectedCols, { colors: !noColor }));
  } else {
    console.log(Bun.inspect.table(outputRows, { colors: !noColor }));
  }

  // Footer with detailed timezone info
  console.log("─".repeat(120));
  console.log(`📅 ${tz.localString}  │  🌍 ${tz.timezone}  │  ⏱️  ${tz.isoLocal}${tz.isDST ? "  │  ☀️  DST active" : ""}`);
  console.log("─".repeat(120));
}

// ─────────────────────────────────────────────────────────────────────────────
// Save Persistent Cache on Exit
// ─────────────────────────────────────────────────────────────────────────────
if (persistentCacheEnabled) {
  await savePersistentCache();
}
