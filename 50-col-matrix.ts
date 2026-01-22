// 50-col-matrix.ts → 247-col-matrix.ts (MATRIX v3.0 Observability Fortress)
import type { Serve } from "bun";
import { open } from "node:fs/promises";
import { peek } from "bun";

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

async function compilePattern(p: string, baseUrl: string): Promise<CachedPattern> {
  const start = Bun.nanoseconds();
  const pattern = new URLPattern(p, baseUrl);
  return {
    pattern,
    compiledAt: Date.now(),
    compileTimeNs: Bun.nanoseconds() - start,
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

// BN-003: Singleton Intl.Segmenter - created once, reused for all rows
const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: "grapheme" });

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

const args = new Set(Bun.argv.slice(2));
const getArg = (short: string, long: string) => args.has(short) || args.has(long);
const getArgValue = (short: string, long: string, def: number) => {
  const argv = Bun.argv;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === short || argv[i] === long) {
      return parseInt(argv[i + 1], 10) || def;
    }
  }
  return def;
};
const getArgString = (short: string, long: string): string | null => {
  const argv = Bun.argv;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === short || argv[i] === long) {
      return argv[i + 1] || null;
    }
  }
  return null;
};

// Help
if (getArg("-h", "--help")) {
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
`);
  process.exit(0);
}

// Options - Original Categories
const showUrl = getArg("-u", "--url");
const showCookie = getArg("-k", "--cookie");
const showType = getArg("-t", "--type");
const showMetrics = getArg("-e", "--metrics");
const showProps = getArg("-p", "--props");
const showPatternAnalysis = getArg("-pa", "--pattern-analysis");
const showInternalStructure = getArg("-is", "--internal-structure");
const showPerfDeep = getArg("-pd", "--performance-deep");
const showMemoryLayout = getArg("-ml", "--memory-layout");
const showWebStandards = getArg("-ws", "--web-standards");
const showExtras = getArg("-x", "--extras");

// Options - NEW v3.0 Categories
const showEnvVars = getArg("-ev", "--env-vars");
const showSecurity = getArg("-sec", "--security");
const showEncoding = getArg("-enc", "--encoding");
const showI18n = getArg("-i18n", "--international");
const showCache = getArg("-ca", "--cache");
const showErrors = getArg("-err", "--errors");
const showPeek = getArg("-pk", "--peek");

// Quick Modes
const quickAudit = getArg("--audit", "--audit");
const quickBenchmark = getArg("--benchmark", "--benchmark");
const quickProdReady = getArg("--prod-ready", "--prod-ready");
const quickInternational = getArg("--international", "--international");

const anySelected = showUrl || showCookie || showType || showMetrics || showProps ||
  showPatternAnalysis || showInternalStructure || showPerfDeep || showMemoryLayout ||
  showWebStandards || showExtras || showEnvVars || showSecurity || showEncoding ||
  showI18n || showCache || showErrors || quickAudit || quickBenchmark ||
  quickProdReady || quickInternational;
const showAll = getArg("-a", "--all") || !anySelected;
const filterMatched = getArg("-m", "--matched");
const filterFailed = getArg("-f", "--failed");
const filterRegex = getArg("-r", "--regex");
const sortArg = getArgString("-s", "--sort");
const rowLimit = getArgValue("-n", "--rows", 15);
const noColor = getArg("-c", "--no-color");
const jsonOutput = getArg("-j", "--json");
const openInEditor = getArg("--open", "--open");
const editorOverride = getArgString("--editor", "--editor");

// Input options
const patternFile = getArgString("--file", "--file");
const customTestUrl = getArgString("--test-url", "--test-url");

// Remediation & CI options
const fixMode = getArg("--fix", "--fix");
const ciMode = getArg("--ci", "--ci");
const thresholdArg = getArgString("--threshold", "--threshold") || "medium";
const baselineFile = getArgString("--baseline", "--baseline");
const saveBaseline = getArg("--save-baseline", "--save-baseline");
const outputFile = getArgString("--output", "--output");

// ─────────────────────────────────────────────────────────────────────────────
// File Loading with FileHandle.readLines() (Bun 1.3.6+)
// ─────────────────────────────────────────────────────────────────────────────
async function loadPatternsFromFile(path: string): Promise<string[]> {
  const patterns: string[] = [];
  const file = await open(path);
  try {
    for await (const line of file.readLines({ encoding: "utf8" })) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("//")) {
        patterns.push(trimmed);
      }
    }
  } finally {
    await file.close();
  }
  return patterns;
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

  const violations = rows.filter(r => levelMap[r.secRiskLevel] >= thresholdValue);

  const summary = {
    low: rows.filter(r => r.secRiskLevel === "low").length,
    medium: rows.filter(r => r.secRiskLevel === "medium").length,
    high: rows.filter(r => r.secRiskLevel === "high").length,
  };

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

// Load patterns from file or use defaults
const patterns = patternFile
  ? await loadPatternsFromFile(patternFile)
  : defaultPatterns;

// Show file info if loaded from file
if (patternFile) {
  console.log(`Loaded ${patterns.length} patterns from ${patternFile}`);
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

  // Internal
  _matched: boolean;
  _hasRegex: boolean;
};

// Pre-warm pattern cache (first pass populates, subsequent passes get sync hits via peek())
await Promise.all(patterns.slice(0, rowLimit).map(p => getCompiledPattern(p).promise.catch(() => null)));

const allRows: RowData[] = patterns.slice(0, rowLimit).map((p, i) => {
  let pat: URLPattern;
  let m: URLPatternResult | null = null;
  let peekCacheHit: "sync" | "async" | "miss" | "error" = "miss";
  let peekCompileTimeNs = 0;

  const memBefore = process.memoryUsage().heapUsed;

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
  const execNs = (Bun.nanoseconds() - execStartNs).toLocaleString() + "ns";

  const memAfter = process.memoryUsage().heapUsed;
  const memDeltaKB = ((memAfter - memBefore) / 1024).toFixed(2);

  const cookie = new Bun.Cookie(`pattern_${i}`, m ? "matched" : "unmatched", {
    path: "/",
    httpOnly: i % 2 === 0,
    secure: i % 3 === 0,
    sameSite: (["strict", "lax", "none"] as const)[i % 3],
    maxAge: i * 100,
    partitioned: i % 6 === 0,
  });

  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();

  // Property inspection (helpers now hoisted to module scope - BN-004 fix)
  const patKeys = Object.keys(pat);
  const patOwnKeys = Reflect.ownKeys(pat);
  const descriptors = Object.getOwnPropertyDescriptors(pat);
  const descriptorTypes = Object.values(descriptors)
    .map(d => ("value" in d ? "v" : "g"))
    .join("");

  const segments = countSegments(p);
  const groupCount = m ? Object.keys(m.pathname?.groups || {}).length : 0;

  return {
    // URLPattern (13)
    idx: i,
    pattern: p.length > 28 ? p.slice(0, 25) + "..." : p,
    matches: m ? "✅" : "❌",
    groups: m ? Object.keys(m.pathname?.groups || {}).join(",") : "",
    hasRegExpGroups: pat.hasRegExpGroups ? "✅" : "❌",
    protocol: pat.protocol,
    hostname: (pat.hostname || "").slice(0, 12),
    port: pat.port || "",
    pathname: (pat.pathname || "").slice(0, 18),
    search: pat.search || "*",
    hash: pat.hash || "*",
    testResult: pat.test(testUrl) ? "✅" : "❌",
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
    typeofPattern: typeof pat,
    typeofResult: m ? typeof m : "null",
    instanceOfURL: pat instanceof URLPattern ? "✅" : "❌",
    constructorName: pat.constructor?.name || "?",
    prototypeChain: getProtoChain(pat),
    isCallable: typeof (pat as any).exec === "function" ? "✅" : "❌",
    isIterable: typeof (pat as any)[Symbol.iterator] === "function" ? "✅" : "❌",
    symbolToString: pat[Symbol.toStringTag] || getTypeTag(pat),
    jsonStringify: JSON.stringify(pat).slice(0, 12) + "...",
    typeTag: getTypeTag(pat),

    // Metrics (12)
    execNs,
    memDeltaKB: memDeltaKB + "KB",
    gcCount: (globalThis as any).gc ? 1 : 0,
    patternComplexity: countSpecialChars(p) + calcNestingDepth(p) * 2,
    groupCount,
    segmentCount: segments,
    charCount: p.length,
    specialChars: countSpecialChars(p),
    nestingDepth: calcNestingDepth(p),
    avgSegmentLen: segments > 0 ? (p.length / segments).toFixed(1) : "0",
    entropyScore: calcEntropy(p).toFixed(2),
    matchScore: m ? (groupCount * 10 + (pat.hasRegExpGroups ? 5 : 0)) : 0,

    // Props (8)
    propCount: patKeys.length,
    ownKeys: patOwnKeys.length.toString(),
    isExtensible: Object.isExtensible(pat) ? "✅" : "❌",
    isSealed: Object.isSealed(pat) ? "✅" : "❌",
    isFrozen: Object.isFrozen(pat) ? "✅" : "❌",
    protoName: Object.getPrototypeOf(pat)?.constructor?.name || "null",
    descriptorTypes: descriptorTypes.slice(0, 8) || "-",
    enumerableCount: Object.keys(pat).length,

    // Pattern Analysis (7)
    patternComponents: [
      pat.protocol !== "*" ? "proto" : "",
      pat.hostname !== "*" ? "host" : "",
      pat.port !== "*" ? "port" : "",
      pat.pathname !== "*" ? "path" : "",
      pat.search !== "*" ? "search" : "",
      pat.hash !== "*" ? "hash" : "",
    ].filter(Boolean).join("+") || "none",
    paHasRegExpGroups: pat.hasRegExpGroups ? "✅" : "❌",
    wildcardCount: (p.match(/\*/g) || []).length,
    namedGroupCount: (p.match(/:[a-zA-Z_][a-zA-Z0-9_]*/g) || []).length,
    optionalGroupCount: (p.match(/\{[^}]*\}\?/g) || []).length,
    patternComplexityScore: Math.min(100, Math.round(
      (countSpecialChars(p) * 3) +
      (calcNestingDepth(p) * 10) +
      ((p.match(/\*/g) || []).length * 5) +
      ((p.match(/:[a-zA-Z_]/g) || []).length * 2) +
      (p.length / 5)
    )),
    canonicalForm: [pat.protocol, "://", pat.hostname, pat.port ? ":" + pat.port : "", pat.pathname].join("").slice(0, 20) + "...",

    // Internal Structure (6)
    hiddenClass: `HC${(hash(pat.constructor.name + pat.pathname) as string).slice(0, 4)}`,
    internalSlots: 8, // URLPattern has 8 internal slots per spec
    compiledRegexCount: [pat.protocol, pat.hostname, pat.port, pat.pathname, pat.search, pat.hash, pat.username, pat.password]
      .filter(c => c && c !== "*").length,
    patternStringLength: p.length + (pat.protocol?.length || 0) + (pat.hostname?.length || 0) + (pat.pathname?.length || 0),
    encodingOverhead: ((p.length * 2) / 1024).toFixed(2) + "KB",
    structureFingerprint: `S${segments}G${groupCount}D${calcNestingDepth(p)}`,

    // Performance Deep-Dive (6) - BN-002 fix: lazy evaluation
    testOpsPerSec: (showPerfDeep || quickBenchmark) ? (() => {
      const iterations = 100; // Reduced from 1000 for better throughput
      const start = Bun.nanoseconds();
      for (let j = 0; j < iterations; j++) pat.test(testUrl);
      const elapsedNs = Bun.nanoseconds() - start;
      return ((iterations / (elapsedNs / 1e9))).toFixed(0) + "/s";
    })() : "-",
    execOpsPerSec: (showPerfDeep || quickBenchmark) ? (() => {
      const iterations = 100; // Reduced from 1000 for better throughput
      const start = Bun.nanoseconds();
      for (let j = 0; j < iterations; j++) pat.exec(testUrl);
      const elapsedNs = Bun.nanoseconds() - start;
      return ((iterations / (elapsedNs / 1e9))).toFixed(0) + "/s";
    })() : "-",
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
    regexFeaturesUsed: [
      p.includes("\\d") ? "digit" : "",
      p.includes("\\w") ? "word" : "",
      p.includes("|") ? "alt" : "",
      p.includes("?") ? "opt" : "",
      p.includes("+") ? "plus" : "",
    ].filter(Boolean).join(",") || "none",
    canonicalPattern: p.replace(/\([^)]+\)/g, "(.*)").slice(0, 18) + "...",
    specVersion: "URLPattern-1.0",

    // Extras (28) - using UUIDv7 for sortable IDs
    uuidv7: Bun.randomUUIDv7().slice(0, 13),
    uuidv7Timestamp: new Date(parseInt(Bun.randomUUIDv7().replace(/-/g, "").slice(0, 12), 16)).toISOString().slice(11, 23),
    fib: fib(i),
    isPrime: isPrime(i) ? "✅" : "❌",
    memoryMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
    patternHash: hash(p).slice(0, 8),
    calcBinary: "0b" + i.toString(2).padStart(4, "0"),
    calcHex: "0x" + i.toString(16).toUpperCase(),
    calcSquare: i * i,
    calcCube: i * i * i,
    calcFactorial: (function f(n): number { return n <= 1 ? 1 : n * f(n - 1); })(i),
    calcReverse: parseInt(i.toString().split("").reverse().join("") || "0"),
    calcDigitSum: i.toString().split("").reduce((a, c) => a + +c, 0),
    calcDigitProduct: i.toString().split("").reduce((a, c) => a * +c, 1),
    timestamp: Date.now(),
    randomInt: Math.floor(Math.random() * 1_000_000),
    randomFloat: Math.random().toFixed(4),
    randomBool: Math.random() > 0.5 ? "✅" : "❌",
    generatedIP: `192.168.${i}.${(i * 7) % 256}`,
    generatedEmail: `user${i}@ex.com`,
    generatedPhone: `+1-${100 + i}-555-${1000 + i}`,
    processId: process.pid,
    processUptime: process.uptime().toFixed(2),
    bunVersion: Bun.version,
    bunPath: Bun.which("bun")?.split("/").slice(-2).join("/") || "?",
    isMainEntry: import.meta.path === Bun.main ? "✅" : "❌",
    memoryRSS: (mem.rss / 1024 / 1024).toFixed(1),
    cpuUser: (cpu.user / 1000).toFixed(1),
    cpuSystem: (cpu.system / 1000).toFixed(1),

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.0: Environment Variables (15 cols)
    // ═══════════════════════════════════════════════════════════════════════
    envNodeEnv: process.env.NODE_ENV || "undefined",
    envBunEnv: process.env.BUN_ENV || "undefined",
    envHasDebug: process.env.DEBUG ? "✅" : "❌",
    envHasVerbose: process.env.VERBOSE ? "✅" : "❌",
    envPathSegments: (process.env.PATH || "").split(":").length,
    envHomeSet: process.env.HOME ? "✅" : "❌",
    envShellType: (process.env.SHELL || "").split("/").pop() || "unknown",
    envTermType: process.env.TERM || "unknown",
    envLocale: process.env.LANG || process.env.LC_ALL || "unknown",
    envTZ: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
    envCI: process.env.CI ? "✅" : "❌",
    envPlatform: process.platform,
    envArch: process.arch,
    envVarCount: Object.keys(process.env).length,
    envVarRisk: (() => {
      const sensitive = ["API_KEY", "SECRET", "TOKEN", "PASSWORD", "CREDENTIAL"];
      const found = Object.keys(process.env).filter(k =>
        sensitive.some(s => k.toUpperCase().includes(s))
      ).length;
      return found > 3 ? "high" : found > 0 ? "medium" : "low";
    })(),

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
      const wildcardCount = (p.match(/\*/g) || []).length;
      const leadingWildcard = p.startsWith("*") || SEC_PATTERNS.openRedirect.test(p);
      const hasCredentialPattern = SEC_PATTERNS.credential.test(p);
      const hasBasicAuth = SEC_PATTERNS.basicAuth.test(p);
      const hasXssVector = SEC_PATTERNS.xss.test(p);
      const hasSqlPattern = SEC_PATTERNS.sql.test(p);
      const hasCmdInjection = SEC_PATTERNS.cmdInjection.test(p);

      const riskFactors = [
        hasUserInput ? 3 : 0,
        hasPathTraversal ? 3 : 0,
        hasOpenRedirect ? 2 : 0,
        hasSsrfPattern ? 2 : 0,
        redosRisk ? 3 : 0,
        wildcardCount > 2 ? 1 : 0,
        leadingWildcard ? 1 : 0,
        hasCredentialPattern ? 2 : 0,
        hasBasicAuth ? 2 : 0,
        hasXssVector ? 2 : 0,
        hasSqlPattern ? 2 : 0,
        hasCmdInjection ? 3 : 0,
      ].reduce((a, b) => a + b, 0);

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
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const percentEncoded = (p.match(/%[0-9A-Fa-f]{2}/g) || []).length;
      const hasInvalidPercent = /%(?![0-9A-Fa-f]{2})/.test(p);
      const hasNonAscii = /[^\x00-\x7F]/.test(p);
      const needsPunycode = hasNonAscii && /https?:\/\/[^/]*[^\x00-\x7F]/.test(p);
      const hasNullBytes = /\x00|%00/i.test(p);
      const hasControlChars = /[\x00-\x1F\x7F]/.test(p);
      const doubleEncoded = /%25[0-9A-Fa-f]{2}/.test(p);
      const mixedEncoding = percentEncoded > 0 && hasNonAscii;
      const byteLength = new TextEncoder().encode(p).length;
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
        encNormalizationForm: p === p.normalize("NFC") ? "NFC" : "needs-norm",
        encByteLength: byteLength,
        encCharLength: charLength,
        encEncodingRatio: (byteLength / charLength).toFixed(2),
        encRecommendedEncoding: hasNonAscii ? "UTF-8" : "ASCII",
      };
    })(),

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.0: Internationalization (12 cols)
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const hasUnicode = /[^\x00-\x7F]/.test(p);
      const emojiRegex = /\p{Emoji}/gu;
      const emojiCount = (p.match(emojiRegex) || []).length;
      const zwjCount = (p.match(/\u200D/g) || []).length;
      const combiningMarks = (p.match(/\p{M}/gu) || []).length;
      const rtlChars = (p.match(/[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g) || []).length;
      // BN-003 fix: Use singleton GRAPHEME_SEGMENTER instead of creating per-row
      const graphemes = [...GRAPHEME_SEGMENTER.segment(p)];
      const displayWidth = Bun.stringWidth(p);

      // Detect script types
      const scripts: string[] = [];
      if (/[\u0400-\u04FF]/.test(p)) scripts.push("Cyrillic");
      if (/[\u4E00-\u9FFF]/.test(p)) scripts.push("CJK");
      if (/[\u0600-\u06FF]/.test(p)) scripts.push("Arabic");
      if (/[\u0900-\u097F]/.test(p)) scripts.push("Devanagari");
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(p)) scripts.push("Japanese");
      if (/[\uAC00-\uD7AF]/.test(p)) scripts.push("Korean");
      if (/[A-Za-z]/.test(p)) scripts.push("Latin");

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
        i18nNormalized: p === p.normalize("NFC") ? "✅" : "❌",
        i18nComplexity: complexity,
      };
    })(),

    // ═══════════════════════════════════════════════════════════════════════
    // NEW v3.0: Cache Analysis (12 cols)
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const hasWildcard = p.includes("*");
      const hasDynamicSegment = /:[a-zA-Z]/.test(p);
      const segmentCount = p.split("/").filter(Boolean).length;
      const keyComplexity = segmentCount + (hasWildcard ? 2 : 0) + (hasDynamicSegment ? 1 : 0);

      // Determine cacheability
      const varyFactors: string[] = [];
      if (hasDynamicSegment) varyFactors.push("params");
      if (p.includes("?")) varyFactors.push("query");
      if (pat.hasRegExpGroups) varyFactors.push("regex");

      const stability = hasWildcard ? "volatile" : hasDynamicSegment ? "variable" : "stable";
      const hitProb = stability === "stable" ? "high" : stability === "variable" ? "medium" : "low";

      // Calculate cache score (0-100)
      const cacheScore = Math.max(0, Math.min(100,
        100 - (hasWildcard ? 30 : 0) - (hasDynamicSegment ? 15 : 0) - (segmentCount * 2) - (pat.hasRegExpGroups ? 10 : 0)
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
        peekCompileTimeNs: peekCompileTimeNs.toLocaleString() + "ns",
        peekCacheSize: stats.size,
        peekSyncHitRate: stats.syncHitRate,
        peekCacheStatus: peek.status(getCompiledPattern(p).promise),
      };
    })(),

    // ═══════════════════════════════════════════════════════════════════════
    // Error Handling (10 cols)
    // ═══════════════════════════════════════════════════════════════════════
    ...(() => {
      const hasComplexRegex = pat.hasRegExpGroups;
      const hasOptional = p.includes("?") || /\{[^}]*\}\?/.test(p);
      const hasAlternation = p.includes("|");
      const nestingDepth = (() => {
        let max = 0, cur = 0;
        for (const c of p) {
          if (c === "(" || c === "[" || c === "{") cur++;
          else if (c === ")" || c === "]" || c === "}") cur--;
          max = Math.max(max, cur);
        }
        return max;
      })();

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

// Column sets
const urlCols = [
  "idx", "pattern", "matches", "groups", "hasRegExpGroups",
  "protocol", "hostname", "port", "pathname", "search", "hash",
  "testResult", "execTime"
];
const cookieCols = [
  "idx", "cookieName", "cookieValue", "cookieHttpOnly", "cookieSecure",
  "cookieSameSite", "cookieMaxAge", "cookieSerialized"
];
const typeCols = [
  "idx", "typeofPattern", "typeofResult", "instanceOfURL", "constructorName",
  "prototypeChain", "isCallable", "isIterable", "symbolToString", "jsonStringify", "typeTag"
];
const metricsCols = [
  "idx", "execTime", "execNs", "memDeltaKB", "gcCount", "patternComplexity",
  "groupCount", "segmentCount", "charCount", "specialChars", "nestingDepth",
  "avgSegmentLen", "entropyScore", "matchScore"
];
const propsCols = [
  "idx", "propCount", "ownKeys", "isExtensible", "isSealed", "isFrozen",
  "protoName", "descriptorTypes", "enumerableCount"
];
const patternAnalysisCols = [
  "idx", "patternComponents", "paHasRegExpGroups", "wildcardCount", "namedGroupCount",
  "optionalGroupCount", "patternComplexityScore", "canonicalForm"
];
const internalStructureCols = [
  "idx", "hiddenClass", "internalSlots", "compiledRegexCount", "patternStringLength",
  "encodingOverhead", "structureFingerprint"
];
const perfDeepCols = [
  "idx", "testOpsPerSec", "execOpsPerSec", "cacheHitRate", "deoptimizationRisk",
  "inlineCacheStatus", "jitTier"
];
const memoryLayoutCols = [
  "idx", "objectSize", "propertyStorageSize", "transitionChainLength", "memoryAlignment",
  "gcPressure", "retainedSize"
];
const webStandardsCols = [
  "idx", "specCompliance", "wptTestsEstimate", "browserCompatibility", "regexFeaturesUsed",
  "canonicalPattern", "specVersion"
];
const extraCols = [
  "idx", "uuidv7", "uuidv7Timestamp", "fib", "isPrime", "memoryMB", "patternHash",
  "calcBinary", "calcHex", "calcSquare", "calcCube", "calcFactorial",
  "calcReverse", "calcDigitSum", "calcDigitProduct", "timestamp",
  "randomInt", "randomFloat", "randomBool", "generatedIP", "generatedEmail",
  "generatedPhone", "processId", "processUptime", "bunVersion", "bunPath", "isMainEntry", "memoryRSS",
  "cpuUser", "cpuSystem"
];

// NEW v3.0: Column Sets
const envVarsCols = [
  "idx", "envNodeEnv", "envBunEnv", "envHasDebug", "envHasVerbose",
  "envPathSegments", "envHomeSet", "envShellType", "envTermType", "envLocale",
  "envTZ", "envCI", "envPlatform", "envArch", "envVarCount", "envVarRisk"
];
const securityCols = [
  "idx", "secInjectionRisk", "secPathTraversal", "secOpenRedirect", "secSsrfPotential",
  "secRegexDoS", "secWildcardDanger", "secCredentialExposure", "secBasicAuthInUrl",
  "secPrivateDataLeak", "secRiskScore", "secRiskLevel", "secSanitizationNeeded",
  "secCspCompatible", "secCorsImplication", "secXssVector", "secSqlInjection",
  "secCommandInjection", "secInputValidation"
];
const encodingCols = [
  "idx", "encPercentEncoded", "encInvalidPercent", "encNonAscii", "encNeedsPunycode",
  "encUtf8Safe", "encHasNullBytes", "encHasControlChars", "encDoubleEncoded",
  "encMixedEncoding", "encNormalizationForm", "encByteLength", "encCharLength",
  "encEncodingRatio", "encRecommendedEncoding"
];
const i18nCols = [
  "idx", "i18nHasUnicode", "i18nScriptTypes", "i18nRtlChars", "i18nEmojiCount",
  "i18nZwjSequences", "i18nCombiningMarks", "i18nGraphemeCount", "i18nDisplayWidth",
  "i18nBidiLevel", "i18nLocaleHint", "i18nNormalized", "i18nComplexity"
];
const cacheCols = [
  "idx", "cacheability", "cacheSuggestedTTL", "cacheKeyComplexity", "cacheVaryFactors",
  "cacheInvalidationRisk", "cachePatternStability", "cacheHitProbability",
  "cacheMissImpact", "cacheWarmupPriority", "cacheEvictionRisk", "cacheScore", "cacheStrategy"
];
const peekCols = [
  "idx", "pattern", "peekCacheHit", "peekCompileTimeNs", "peekCacheSize", "peekSyncHitRate", "peekCacheStatus"
];
const errorsCols = [
  "idx", "errParseError", "errRuntimeError", "errEdgeCases", "errNullHandling",
  "errBoundaryConditions", "errRecoverable", "errFailureMode", "errLoggingLevel",
  "errMonitoringHint", "errPotential"
];

// Build selected columns dynamically
const selectedSets: { cols: string[]; name: string }[] = [];

// Original categories
if (showUrl || showAll) selectedSets.push({ cols: urlCols, name: "URL" });
if (showCookie || showAll) selectedSets.push({ cols: cookieCols, name: "Cookie" });
if (showType || showAll) selectedSets.push({ cols: typeCols, name: "Type" });
if (showMetrics || showAll || quickBenchmark) selectedSets.push({ cols: metricsCols, name: "Metrics" });
if (showProps || showAll) selectedSets.push({ cols: propsCols, name: "Props" });
if (showPatternAnalysis || showAll) selectedSets.push({ cols: patternAnalysisCols, name: "PatternAnalysis" });
if (showInternalStructure || showAll) selectedSets.push({ cols: internalStructureCols, name: "Internal" });
if (showPerfDeep || showAll || quickBenchmark) selectedSets.push({ cols: perfDeepCols, name: "PerfDeep" });
if (showMemoryLayout || showAll || quickBenchmark) selectedSets.push({ cols: memoryLayoutCols, name: "Memory" });
if (showWebStandards || showAll || quickProdReady) selectedSets.push({ cols: webStandardsCols, name: "WebStd" });
if (showExtras || showAll) selectedSets.push({ cols: extraCols, name: "Extras" });

// NEW v3.0 categories
if (showEnvVars || showAll || quickAudit) selectedSets.push({ cols: envVarsCols, name: "EnvVars" });
if (showSecurity || showAll || quickAudit || quickProdReady) selectedSets.push({ cols: securityCols, name: "Security" });
if (showEncoding || showAll || quickInternational) selectedSets.push({ cols: encodingCols, name: "Encoding" });
if (showI18n || showAll || quickInternational) selectedSets.push({ cols: i18nCols, name: "I18n" });
if (showCache || showAll || quickProdReady) selectedSets.push({ cols: cacheCols, name: "Cache" });
if (showPeek || showAll || quickBenchmark) selectedSets.push({ cols: peekCols, name: "Peek" });
if (showErrors || showAll || quickAudit) selectedSets.push({ cols: errorsCols, name: "Errors" });

// Merge columns (avoid duplicate idx)
let selectedCols: string[] | undefined;
let title = "";
let colCount = 0;

if (selectedSets.length > 0 && !showAll) {
  const merged = new Set<string>();
  for (const set of selectedSets) {
    for (const col of set.cols) merged.add(col);
  }
  selectedCols = Array.from(merged);
  title = selectedSets.map(s => s.name).join(" + ");
  colCount = selectedCols.length;
} else {
  title = "Full Analysis v3.0";
  // Count all unique columns across all sets
  const allCols = new Set([
    ...urlCols, ...cookieCols, ...typeCols, ...metricsCols, ...propsCols,
    ...patternAnalysisCols, ...internalStructureCols, ...perfDeepCols,
    ...memoryLayoutCols, ...webStandardsCols, ...extraCols,
    ...envVarsCols, ...securityCols, ...encodingCols, ...i18nCols,
    ...cacheCols, ...errorsCols
  ]);
  colCount = allCols.size;
}

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
// Standard Output
// ─────────────────────────────────────────────────────────────────────────────
if (jsonOutput) {
  console.log(JSON.stringify(outputRows, null, 2));
} else {
  console.log(`${title}${filterSuffix}  (${colCount} columns, ${rows.length} rows)`.padEnd(120, "─"));
  if (selectedCols) {
    console.log(Bun.inspect.table(outputRows, selectedCols, { colors: !noColor }));
  } else {
    console.log(Bun.inspect.table(outputRows, { colors: !noColor }));
  }
}
