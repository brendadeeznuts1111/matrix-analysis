#!/usr/bin/env bun
/**
 * DNS Prefetch Performance Tracker
 * Measures cold vs warm DNS lookup times and cache efficiency
 */

import { dns } from "bun";
import { nanoseconds, inspect } from "bun";

// ============================================================================
// Types
// ============================================================================

export interface DNSMetrics {
  host: string;
  port: number;
  coldNs: number;
  warmNs: number;
  coldMs: number;
  warmMs: number;
  improvementNs: number;
  improvementPercent: number;
  timestamp: number;
}

export interface CacheStats {
  cacheHitsCompleted: number;
  cacheHitsInflight: number;
  cacheMisses: number;
  size: number;
  errors: number;
  totalCount: number;
}

// ============================================================================
// Metrics Storage (Bounded to prevent memory leaks)
// ============================================================================

const MAX_METRICS_SIZE = 10_000; // Maximum entries before eviction
export const metrics: DNSMetrics[] = [];

/**
 * Add a metric entry, evicting oldest entries if at capacity.
 * Uses FIFO eviction to maintain bounded memory usage.
 */
function addMetric(metric: DNSMetrics): void {
  if (metrics.length >= MAX_METRICS_SIZE) {
    // Evict oldest 10% to amortize eviction cost
    const evictCount = Math.ceil(MAX_METRICS_SIZE * 0.1);
    metrics.splice(0, evictCount);
  }
  metrics.push(metric);
}

// ============================================================================
// Core API
// ============================================================================

/**
 * Track DNS prefetch performance for a host
 */
export async function trackDNSPerformance(
  host: string,
  port: number = 443
): Promise<DNSMetrics> {
  // Cold lookup (cache miss)
  const coldStart = nanoseconds();
  dns.prefetch(host, port);
  await Bun.sleep(1); // Allow prefetch to complete
  const coldEnd = nanoseconds();
  const coldNs = coldEnd - coldStart;

  // Warm lookup (cache hit)
  const warmStart = nanoseconds();
  dns.prefetch(host, port);
  const warmEnd = nanoseconds();
  const warmNs = warmEnd - warmStart;

  const improvementNs = coldNs - warmNs;
  const improvementPercent = coldNs > 0
    ? Math.round((improvementNs / coldNs) * 1000) / 10
    : 0;

  const result: DNSMetrics = {
    host,
    port,
    coldNs,
    warmNs,
    coldMs: coldNs / 1_000_000,
    warmMs: warmNs / 1_000_000,
    improvementNs,
    improvementPercent,
    timestamp: Date.now(),
  };

  addMetric(result);
  return result;
}

/**
 * Get current DNS cache statistics
 */
export function getCacheStats(): CacheStats {
  return dns.getCacheStats();
}

/**
 * Calculate cache hit rate from stats
 */
export function getHitRate(stats?: CacheStats): number {
  const s = stats ?? dns.getCacheStats();
  if (s.totalCount === 0) return 0;
  return Math.round(((s.cacheHitsCompleted + s.cacheHitsInflight) / s.totalCount) * 1000) / 10;
}

/**
 * Track multiple hosts in parallel
 */
export async function trackMultiple(
  hosts: Array<{ host: string; port?: number }>
): Promise<DNSMetrics[]> {
  const results = await Promise.all(
    hosts.map(({ host, port }) => trackDNSPerformance(host, port ?? 443))
  );
  return results;
}

/**
 * Get metrics summary
 */
export function getSummary(): {
  totalHosts: number;
  avgImprovementPercent: number;
  avgColdMs: number;
  avgWarmMs: number;
  cacheStats: CacheStats;
  hitRate: number;
} {
  const stats = getCacheStats();

  if (metrics.length === 0) {
    return {
      totalHosts: 0,
      avgImprovementPercent: 0,
      avgColdMs: 0,
      avgWarmMs: 0,
      cacheStats: stats,
      hitRate: getHitRate(stats),
    };
  }

  const avgImprovementPercent =
    metrics.reduce((sum, m) => sum + m.improvementPercent, 0) / metrics.length;
  const avgColdMs =
    metrics.reduce((sum, m) => sum + m.coldMs, 0) / metrics.length;
  const avgWarmMs =
    metrics.reduce((sum, m) => sum + m.warmMs, 0) / metrics.length;

  return {
    totalHosts: metrics.length,
    avgImprovementPercent: Math.round(avgImprovementPercent * 10) / 10,
    avgColdMs: Math.round(avgColdMs * 1000) / 1000,
    avgWarmMs: Math.round(avgWarmMs * 1000) / 1000,
    cacheStats: stats,
    hitRate: getHitRate(stats),
  };
}

/**
 * Clear stored metrics
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

// ============================================================================
// CLI
// ============================================================================

if (import.meta.main) {
  const DEFAULT_HOSTS = [
    { host: "registry.npmjs.org", port: 443 },
    { host: "api.github.com", port: 443 },
    { host: "bun.sh", port: 443 },
    { host: "unpkg.com", port: 443 },
    { host: "cdn.jsdelivr.net", port: 443 },
  ];

  // Parse CLI args for custom hosts
  const args = process.argv.slice(2);
  const hosts = args.length > 0
    ? args.map((h) => {
        const [host, portStr] = h.split(":");
        return { host, port: portStr ? parseInt(portStr) : 443 };
      })
    : DEFAULT_HOSTS;

  console.log("\n🔍 DNS Prefetch Performance Tracker");
  console.log("=".repeat(50));

  // Initial cache stats
  const before = getCacheStats();
  console.log("\n📊 Cache Stats (before):");
  console.log(inspect.table([before], undefined, { colors: true }));

  // Run benchmarks
  console.log("\n⏱️  Tracking DNS performance...\n");
  await trackMultiple(hosts);

  // Results table
  const formatted = metrics.map((m) => ({
    "Host": m.host,
    "Port": m.port,
    "Cold (µs)": Math.round(m.coldNs / 1000).toLocaleString(),
    "Warm (µs)": Math.round(m.warmNs / 1000).toLocaleString(),
    "Improvement": `${m.improvementPercent}%`,
  }));
  console.log(inspect.table(formatted, undefined, { colors: true }));

  // Summary
  const summary = getSummary();
  console.log("\n📈 Summary:");
  console.log(inspect.table([{
    "Hosts Tracked": summary.totalHosts,
    "Avg Cold (ms)": summary.avgColdMs.toFixed(3),
    "Avg Warm (ms)": summary.avgWarmMs.toFixed(3),
    "Avg Improvement": `${summary.avgImprovementPercent}%`,
    "Cache Size": summary.cacheStats.size,
    "Hit Rate": `${summary.hitRate}%`,
  }], undefined, { colors: true }));

  // Final cache stats
  console.log("\n📊 Cache Stats (after):");
  const after = getCacheStats();
  const statsTable = [
    { metric: "cacheHitsCompleted", before: before.cacheHitsCompleted, after: after.cacheHitsCompleted, delta: `+${after.cacheHitsCompleted - before.cacheHitsCompleted}` },
    { metric: "cacheHitsInflight", before: before.cacheHitsInflight, after: after.cacheHitsInflight, delta: `+${after.cacheHitsInflight - before.cacheHitsInflight}` },
    { metric: "cacheMisses", before: before.cacheMisses, after: after.cacheMisses, delta: `+${after.cacheMisses - before.cacheMisses}` },
    { metric: "size", before: before.size, after: after.size, delta: `+${after.size - before.size}` },
    { metric: "errors", before: before.errors, after: after.errors, delta: `+${after.errors - before.errors}` },
    { metric: "totalCount", before: before.totalCount, after: after.totalCount, delta: `+${after.totalCount - before.totalCount}` },
  ];
  console.log(inspect.table(statsTable, undefined, { colors: true }));

  console.log("\n✅ DNS prefetch reduces latency by ~" + summary.avgImprovementPercent + "% on average\n");
}
