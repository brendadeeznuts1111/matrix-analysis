/**
 * matrix-analysis v3.1 - Type Definitions
 * URLPattern Analysis Matrix with 219+ columns
 *
 * @example
 * ```typescript
 * import type { RowData, CachedPattern, ColKey } from "matrix-analysis/types";
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Cache Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Cached compiled URLPattern with timing metadata */
export type CachedPattern = {
  pattern: URLPattern;
  compiledAt: number;
  compileTimeNs: number;
};

/** Cache statistics for pattern compilation */
export type CacheStats = {
  hits: number;
  misses: number;
  syncHits: number;
  errors: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Benchmark Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Result of benchmarking a URLPattern's test/exec performance */
export type BenchmarkResult = {
  testOpsPerSec: string;
  execOpsPerSec: string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Color Palette Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Performance tier classification */
export type PatternTier = "elite" | "strong" | "medium" | "caution";

/** Color information generated for a pattern based on performance */
export type PatternColorInfo = {
  hsl: string;
  hex: string;
  rgb: string;
  tier: PatternTier;
  cssVar: string;
  swatch: string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// DNS Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Result of a DNS lookup/prefetch operation */
export type DnsLookupResult = {
  hostname: string;
  address: string | null;
  family: number | null;
  latencyMs: number;
  cached: boolean;
  error?: string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Remediation Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Result of pattern security remediation */
export type RemediationResult = {
  original: string;
  fixed: string;
  changes: string[];
  riskBefore: number;
  riskAfter: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CI/CD Types
// ═══════════════════════════════════════════════════════════════════════════════

/** CI gate threshold levels */
export type CIThreshold = "low" | "medium" | "high";

/** Violation entry in CI result */
export type CIViolation = {
  idx: number;
  pattern: string;
  riskLevel: string;
  riskScore: number;
};

/** Result of CI gate evaluation */
export type CIResult = {
  passed: boolean;
  threshold: string;
  totalPatterns: number;
  violations: CIViolation[];
  summary: { low: number; medium: number; high: number };
};

// ═══════════════════════════════════════════════════════════════════════════════
// Column Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Available column set keys */
export type ColKey =
  | "url"
  | "cookie"
  | "type"
  | "metrics"
  | "props"
  | "patternAnalysis"
  | "internal"
  | "perfDeep"
  | "memory"
  | "webStd"
  | "extras"
  | "envVars"
  | "security"
  | "encoding"
  | "i18n"
  | "cache"
  | "peek"
  | "errors"
  | "color"
  | "dns"
  | "tz";

// ═══════════════════════════════════════════════════════════════════════════════
// Row Data Type (219 columns)
// ═══════════════════════════════════════════════════════════════════════════════

/** Full row data structure with all 219+ analysis columns */
export type RowData = {
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

  // Environment Variables (15)
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

  // Security Analysis (18)
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

  // Encoding Analysis (14)
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

  // Internationalization (12)
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

  // Cache Analysis (12)
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

  // Peek Cache (5)
  peekCacheHit: string;
  peekCompileTimeNs: string;
  peekCacheSize: number;
  peekSyncHitRate: string;
  peekCacheStatus: string;

  // Pattern Colors (6)
  colorHsl: string;
  colorHex: string;
  colorRgb: string;
  colorTier: string;
  colorCssVar: string;
  colorSwatch: string;

  // Error Handling (10)
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

  // DNS Prefetch (8)
  dnsHostname: string;
  dnsAddress: string;
  dnsFamily: string;
  dnsLatencyMs: string;
  dnsCached: string;
  dnsPrefetchStatus: string;
  dnsCacheHits: number;
  dnsCacheMisses: number;

  // Timezone (9)
  tzTimezone: string;
  tzAbbrev: string;
  tzUtcOffset: string;
  tzOffsetMinutes: number;
  tzIsDST: string;
  tzHasDST: string;
  tzLocalTime: string;
  tzIsoTime: string;
  tzEpochMs: number;

  // Internal (not typically exposed)
  _matched: boolean;
  _hasRegex: boolean;
};

/** Row data without internal fields */
export type PublicRowData = Omit<RowData, "_matched" | "_hasRegex">;

// ═══════════════════════════════════════════════════════════════════════════════
// API Response Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Response from /api/analyze endpoint */
export type AnalyzeResponse = {
  results: Array<{
    pattern: string;
    matched: boolean;
    execTimeNs: number;
    groups: Record<string, string> | null;
    error?: string;
  }>;
  summary: {
    total: number;
    matched: number;
    failed: number;
    avgExecNs: number;
  };
};

/** WebSocket message types */
export type WSMessageType = "snapshot" | "metrics" | "cache" | "dns" | "security" | "benchmark";

/** WebSocket message envelope */
export type WSMessage<T = unknown> = {
  type: WSMessageType;
  data: T;
  timestamp: number;
};
