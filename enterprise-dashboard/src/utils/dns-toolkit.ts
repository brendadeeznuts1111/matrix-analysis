/**
 * DNS Toolkit - Enterprise DNS optimization utilities for Bun 1.3.6+
 *
 * Patterns:
 * - dns.prefetch(): Fire-and-forget DNS resolution (void, not async)
 * - fetch.preconnect(): Async DNS + TCP + TLS warmup for HTTPS
 * - Bun.nanoseconds(): High-precision timing
 */

import { dns } from "bun";

// ============================================================================
// Version
// ============================================================================

/** DNS Toolkit version */
export const DNS_TOOLKIT_VERSION = "1.1.0";

// ============================================================================
// Types
// ============================================================================

export interface DNSTarget {
  host: string;
  port?: number;
}

export interface HTTPSTarget {
  url: string;
  /** Optional label for logging */
  label?: string;
}

export interface InfrastructureConfig {
  /** Internal services (DNS-only prefetch) */
  databases?: DNSTarget[];
  caches?: DNSTarget[];
  internalServices?: DNSTarget[];
  /** External HTTPS APIs (full preconnect) */
  externalAPIs?: HTTPSTarget[];
}

export interface PreconnectResult {
  url: string;
  label?: string;
  success: boolean;
  elapsedMs: number;
  error?: string;
}

export interface WarmupReport {
  dnsPrefetches: number;
  preconnects: PreconnectResult[];
  totalElapsedMs: number;
}

export interface TimingStats {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  samples: number;
}

// ============================================================================
// DNS Prefetch (Fire-and-Forget)
// ============================================================================

/**
 * Prefetch DNS for a host. Fire-and-forget, returns immediately.
 * Use for internal services where TLS warmup isn't beneficial.
 */
export function prefetchDNS(host: string, port = 443): void {
  dns.prefetch(host, port);
}

/**
 * Prefetch DNS for multiple targets. All fire-and-forget.
 * @returns Number of prefetches initiated
 */
export function prefetchDNSBatch(targets: DNSTarget[]): number {
  for (const target of targets) {
    dns.prefetch(target.host, target.port ?? 443);
  }
  return targets.length;
}

// ============================================================================
// HTTPS Preconnect (Async - DNS + TCP + TLS)
// ============================================================================

/** Check if fetch.preconnect is available and working */
let _preconnectAvailable: boolean | null = null;

function isPreconnectAvailable(): boolean {
  if (_preconnectAvailable !== null) return _preconnectAvailable;

  if (typeof fetch.preconnect !== "function") {
    _preconnectAvailable = false;
    return false;
  }

  // Test if it actually works (some Bun versions have bugs)
  try {
    fetch.preconnect("https://localhost");
    _preconnectAvailable = true;
  } catch {
    _preconnectAvailable = false;
  }

  return _preconnectAvailable;
}

/**
 * Preconnect to an HTTPS endpoint (DNS + TCP + TLS handshake).
 * Falls back to DNS prefetch if fetch.preconnect is unavailable.
 */
export async function preconnect(url: string): Promise<PreconnectResult> {
  const start = Bun.nanoseconds();
  let success = true;
  let error: string | undefined;

  try {
    if (isPreconnectAvailable()) {
      await fetch.preconnect(url);
    } else {
      // Fallback: DNS prefetch only
      const parsed = new URL(url);
      const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === "https:" ? 443 : 80;
      dns.prefetch(parsed.hostname, port);
    }
  } catch (e) {
    success = false;
    error = e instanceof Error ? e.message : String(e);
  }

  return {
    url,
    success,
    elapsedMs: (Bun.nanoseconds() - start) / 1_000_000,
    error,
  };
}

/**
 * Preconnect to multiple HTTPS endpoints in parallel.
 * @param timeoutMs Maximum time to wait for all preconnects
 */
export async function preconnectBatch(
  targets: HTTPSTarget[],
  timeoutMs = 5000
): Promise<PreconnectResult[]> {
  if (targets.length === 0) return [];

  const preconnects = targets.map(async (target): Promise<PreconnectResult> => {
    const result = await preconnect(target.url);
    return {
      ...result,
      label: target.label,
    };
  });

  // Race against timeout
  const results = await Promise.race([
    Promise.all(preconnects),
    Bun.sleep(timeoutMs).then(() => {
      // Return partial results on timeout
      return targets.map((t) => ({
        url: t.url,
        label: t.label,
        success: false,
        elapsedMs: timeoutMs,
        error: "timeout",
      }));
    }),
  ]);

  return results;
}

// ============================================================================
// Infrastructure Warmup
// ============================================================================

/**
 * Warm up all infrastructure connections at application startup.
 * - DNS prefetch for internal services (fire-and-forget)
 * - Full preconnect for external HTTPS APIs (async)
 */
export async function warmupInfrastructure(
  config: InfrastructureConfig,
  options: { timeoutMs?: number; verbose?: boolean } = {}
): Promise<WarmupReport> {
  const { timeoutMs = 5000, verbose = false } = options;
  const start = Bun.nanoseconds();

  // DNS prefetch for internal services (synchronous, fire-and-forget)
  let dnsPrefetches = 0;

  if (config.databases) {
    for (const db of config.databases) {
      dns.prefetch(db.host, db.port ?? 5432);
      dnsPrefetches++;
      if (verbose) console.log(`[DNS] Prefetched: ${db.host}:${db.port ?? 5432}`);
    }
  }

  if (config.caches) {
    for (const cache of config.caches) {
      dns.prefetch(cache.host, cache.port ?? 6379);
      dnsPrefetches++;
      if (verbose) console.log(`[DNS] Prefetched: ${cache.host}:${cache.port ?? 6379}`);
    }
  }

  if (config.internalServices) {
    for (const svc of config.internalServices) {
      dns.prefetch(svc.host, svc.port ?? 443);
      dnsPrefetches++;
      if (verbose) console.log(`[DNS] Prefetched: ${svc.host}:${svc.port ?? 443}`);
    }
  }

  // Full preconnect for external HTTPS APIs (async)
  let preconnects: PreconnectResult[] = [];

  if (config.externalAPIs && config.externalAPIs.length > 0) {
    preconnects = await preconnectBatch(config.externalAPIs, timeoutMs);

    if (verbose) {
      for (const result of preconnects) {
        const status = result.success ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
        const label = result.label ? ` (${result.label})` : "";
        console.log(
          `[Preconnect] ${status} ${result.url}${label} - ${result.elapsedMs.toFixed(2)}ms`
        );
      }
    }
  }

  const totalElapsedMs = (Bun.nanoseconds() - start) / 1_000_000;

  return {
    dnsPrefetches,
    preconnects,
    totalElapsedMs,
  };
}

// ============================================================================
// Performance Measurement
// ============================================================================

/**
 * Measure preconnect performance for a single URL.
 * Useful for benchmarking and monitoring.
 */
export async function measurePreconnect(url: string): Promise<{
  url: string;
  elapsedMs: number;
  success: boolean;
}> {
  const start = Bun.nanoseconds();
  let success = true;

  try {
    await fetch.preconnect(url);
  } catch {
    success = false;
  }

  return {
    url,
    elapsedMs: (Bun.nanoseconds() - start) / 1_000_000,
    success,
  };
}

/**
 * Benchmark preconnect performance over multiple iterations.
 * Note: After first preconnect, connection may be pooled.
 */
export async function benchmarkPreconnect(
  url: string,
  iterations = 10,
  delayBetweenMs = 100
): Promise<TimingStats> {
  const timings: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = await measurePreconnect(url);
    if (result.success) {
      timings.push(result.elapsedMs);
    }

    if (i < iterations - 1) {
      await Bun.sleep(delayBetweenMs);
    }
  }

  if (timings.length === 0) {
    return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, samples: 0 };
  }

  timings.sort((a, b) => a - b);

  const sum = timings.reduce((a, b) => a + b, 0);
  const percentile = (p: number) => {
    const idx = Math.ceil((p / 100) * timings.length) - 1;
    return timings[Math.max(0, idx)];
  };

  return {
    min: timings[0],
    max: timings[timings.length - 1],
    avg: sum / timings.length,
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
    samples: timings.length,
  };
}

// ============================================================================
// Structured Logging Helpers
// ============================================================================

/**
 * Format warmup report as structured log entry (Google Cloud Logging compatible).
 */
export function formatWarmupLog(report: WarmupReport): object {
  const failedPreconnects = report.preconnects.filter((p) => !p.success);

  return {
    severity: failedPreconnects.length > 0 ? "WARNING" : "INFO",
    message: "infrastructure_warmup_complete",
    timestamp: new Date().toISOString(),
    "warmup.dns_prefetches": report.dnsPrefetches,
    "warmup.preconnects_total": report.preconnects.length,
    "warmup.preconnects_success": report.preconnects.length - failedPreconnects.length,
    "warmup.preconnects_failed": failedPreconnects.length,
    "warmup.total_elapsed_ms": report.totalElapsedMs,
    "warmup.failed_urls": failedPreconnects.map((p) => p.url),
  };
}

/**
 * Format timing stats as structured log entry.
 */
export function formatTimingLog(url: string, stats: TimingStats): object {
  return {
    severity: "INFO",
    message: "preconnect_benchmark",
    timestamp: new Date().toISOString(),
    url,
    "timing.min_ms": stats.min,
    "timing.max_ms": stats.max,
    "timing.avg_ms": stats.avg,
    "timing.p50_ms": stats.p50,
    "timing.p95_ms": stats.p95,
    "timing.p99_ms": stats.p99,
    "timing.samples": stats.samples,
  };
}

// ============================================================================
// DNS Cache TTL Configuration
// ============================================================================

/**
 * Default DNS cache TTL in Bun (30 seconds).
 * Configurable via BUN_CONFIG_DNS_TIME_TO_LIVE_SECONDS environment variable.
 *
 * Note: getaddrinfo doesn't expose actual DNS TTL, so Bun uses a fixed value.
 * - Bun default: 30s (balance between caching benefit and freshness)
 * - AWS recommends: 5s (for JVM)
 * - JVM default: indefinite
 */
export const DNS_TTL_DEFAULT = 30;

/**
 * Get the current DNS TTL setting.
 * Returns the value from BUN_CONFIG_DNS_TIME_TO_LIVE_SECONDS or default (30s).
 */
export function getDnsTtl(): number {
  const envTtl = process.env.BUN_CONFIG_DNS_TIME_TO_LIVE_SECONDS;
  if (envTtl) {
    const parsed = parseInt(envTtl, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return DNS_TTL_DEFAULT;
}

/**
 * Recommended TTL values for different environments.
 */
export const DNS_TTL_RECOMMENDATIONS = {
  /** AWS recommendation for dynamic infrastructure */
  aws: 5,
  /** Bun default - good balance for most apps */
  default: 30,
  /** Stable infrastructure with infrequent DNS changes */
  stable: 300,
  /** Development/testing with frequent changes */
  development: 1,
} as const;

/**
 * Generate shell command to run with a specific DNS TTL.
 */
export function withDnsTtl(ttlSeconds: number, command: string): string {
  return `BUN_CONFIG_DNS_TIME_TO_LIVE_SECONDS=${ttlSeconds} ${command}`;
}

// ============================================================================
// Capability Detection
// ============================================================================

/**
 * Check if full fetch.preconnect (DNS + TCP + TLS) is available.
 * Returns false if only DNS prefetch fallback is used.
 */
export function isFullPreconnectAvailable(): boolean {
  return isPreconnectAvailable();
}

/**
 * Get DNS toolkit capabilities for the current Bun version.
 */
export function getCapabilities(): {
  version: string;
  dnsPrefetch: boolean;
  fetchPreconnect: boolean;
  dnsTtlSeconds: number;
  bunVersion: string;
} {
  return {
    version: DNS_TOOLKIT_VERSION,
    dnsPrefetch: true, // Always available
    fetchPreconnect: isPreconnectAvailable(),
    dnsTtlSeconds: getDnsTtl(),
    bunVersion: typeof Bun !== "undefined" ? Bun.version : "unknown",
  };
}

// ============================================================================
// URL Helpers
// ============================================================================

/**
 * Extract host and port from a URL string.
 */
export function parseURLTarget(url: string): DNSTarget {
  const parsed = new URL(url);
  const defaultPort = parsed.protocol === "https:" ? 443 : 80;
  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : defaultPort,
  };
}

/**
 * Build HTTPS URL from host and optional port.
 */
export function buildHTTPSUrl(host: string, port = 443): string {
  return port === 443 ? `https://${host}` : `https://${host}:${port}`;
}

// ============================================================================
// Convenience Class
// ============================================================================

/**
 * DNSToolkit - Stateful DNS optimization manager.
 */
export class DNSToolkit {
  private prefetchedHosts = new Set<string>();
  private preconnectedUrls = new Set<string>();
  private timings = new Map<string, number[]>();

  /**
   * Prefetch DNS for a host (idempotent).
   */
  prefetch(host: string, port = 443): boolean {
    const key = `${host}:${port}`;
    if (this.prefetchedHosts.has(key)) {
      return false; // Already prefetched
    }

    dns.prefetch(host, port);
    this.prefetchedHosts.add(key);
    return true;
  }

  /**
   * Preconnect to HTTPS URL (idempotent).
   */
  async preconnect(url: string): Promise<PreconnectResult> {
    if (this.preconnectedUrls.has(url)) {
      return { url, success: true, elapsedMs: 0 }; // Already connected
    }

    const result = await preconnect(url);

    if (result.success) {
      this.preconnectedUrls.add(url);

      // Track timing
      const timings = this.timings.get(url) ?? [];
      timings.push(result.elapsedMs);
      this.timings.set(url, timings);
    }

    return result;
  }

  /**
   * Warm up infrastructure from config.
   */
  async warmup(config: InfrastructureConfig, verbose = false): Promise<WarmupReport> {
    return warmupInfrastructure(config, { verbose });
  }

  /**
   * Get timing history for a URL.
   */
  getTimings(url: string): number[] {
    return this.timings.get(url) ?? [];
  }

  /**
   * Get all prefetched hosts.
   */
  getPrefetchedHosts(): string[] {
    return Array.from(this.prefetchedHosts);
  }

  /**
   * Get all preconnected URLs.
   */
  getPreconnectedUrls(): string[] {
    return Array.from(this.preconnectedUrls);
  }

  /**
   * Clear tracking state (does not clear actual DNS/connection caches).
   */
  reset(): void {
    this.prefetchedHosts.clear();
    this.preconnectedUrls.clear();
    this.timings.clear();
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default DNSToolkit;
