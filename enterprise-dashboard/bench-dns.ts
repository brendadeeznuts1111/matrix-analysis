#!/usr/bin/env bun
/**
 * DNS Cache Performance Benchmark
 * Uses dns.getCacheStats() to measure cache efficiency
 */

import { dns } from "bun";
import { nanoseconds, inspect } from "bun";

interface BenchResult {
  host: string;
  cold: number;
  warm: number;
  speedup: string;
}

const HOSTS = [
  "registry.npmjs.org",
  "api.github.com",
  "bun.sh",
  "unpkg.com",
  "cdn.jsdelivr.net",
];

async function benchDNS(host: string, port = 443): Promise<BenchResult> {
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

  const speedup = coldNs > 0 ? ((coldNs - warmNs) / coldNs * 100).toFixed(1) : "0";

  return {
    host,
    cold: Math.round(coldNs / 1000), // µs
    warm: Math.round(warmNs / 1000), // µs
    speedup: `${speedup}%`,
  };
}

async function main() {
  console.log("\n🔍 DNS Cache Benchmark");
  console.log("=".repeat(50));

  // Initial stats
  const before = dns.getCacheStats();
  console.log("\n📊 Cache Stats (before):");
  console.log(inspect.table([before], undefined, { colors: true }));

  // Run benchmarks
  console.log("\n⏱️  Running DNS benchmarks...\n");
  const results: BenchResult[] = [];

  for (const host of HOSTS) {
    const result = await benchDNS(host);
    results.push(result);
  }

  // Results table
  const formatted = results.map((r) => ({
    "Host": r.host,
    "Cold (µs)": r.cold.toLocaleString(),
    "Warm (µs)": r.warm.toLocaleString(),
    "Speedup": r.speedup,
  }));
  console.log(inspect.table(formatted, undefined, { colors: true }));

  // Final stats
  const after = dns.getCacheStats();
  console.log("\n📊 Cache Stats (after):");
  const statsTable = [
    { metric: "cacheHitsCompleted", before: before.cacheHitsCompleted, after: after.cacheHitsCompleted, delta: after.cacheHitsCompleted - before.cacheHitsCompleted },
    { metric: "cacheHitsInflight", before: before.cacheHitsInflight, after: after.cacheHitsInflight, delta: after.cacheHitsInflight - before.cacheHitsInflight },
    { metric: "cacheMisses", before: before.cacheMisses, after: after.cacheMisses, delta: after.cacheMisses - before.cacheMisses },
    { metric: "size", before: before.size, after: after.size, delta: after.size - before.size },
    { metric: "errors", before: before.errors, after: after.errors, delta: after.errors - before.errors },
    { metric: "totalCount", before: before.totalCount, after: after.totalCount, delta: after.totalCount - before.totalCount },
  ];
  console.log(inspect.table(statsTable, undefined, { colors: true }));

  // Hit rate
  const hitRate = after.totalCount > 0
    ? ((after.cacheHitsCompleted + after.cacheHitsInflight) / after.totalCount * 100).toFixed(1)
    : "0";
  console.log(`\n✅ Cache Hit Rate: ${hitRate}%`);
  console.log(`📦 Cache Size: ${after.size} entries\n`);
}

main().catch(console.error);
