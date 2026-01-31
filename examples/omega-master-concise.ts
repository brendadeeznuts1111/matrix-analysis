#!/usr/bin/env bun
/**
 * ωmega Master - Concise API Demo
 * 
 * Demonstrates the core Bun APIs in a minimal, powerful example
 */

import { which, inspect, nanoseconds, zstdCompressSync, version } from 'bun';
import { serialize, estimateShallowMemoryUsageOf } from 'bun:jsc';

// Mock pools data for demonstration
const pools = [
  { id: 'pool-1', size: 10, active: true },
  { id: 'pool-2', size: 5, active: false }
];

// which() table w/ inspect.table()
const whichData = [
  { tool: 'sqlite3', path: which('sqlite3'), cwd: Bun.main!, mem: estimateShallowMemoryUsageOf(pools) },
];
console.log(inspect.table(whichData, ['tool', 'path'], { colors: true }));

// Perf + compress pool snapshot
const startNs = nanoseconds();
// Fix: Convert SharedArrayBuffer to ArrayBuffer for compression
const serialized = serialize(pools);
const arrayBuffer = new ArrayBuffer(serialized.byteLength);
new Uint8Array(arrayBuffer).set(new Uint8Array(serialized));
const snapshot = zstdCompressSync(arrayBuffer);  // Zstd + JSC
console.log(`Snapshot: ${(nanoseconds() - startNs)} ns, size: ${snapshot.byteLength}, Bun: ${version}`);

// Sleep + env fallback
await Bun.sleep(100);  // Rate limit
const poolSize = parseInt(Bun.env.POOL_SIZE || '5');  // define fallback
console.log(`Pool size configured: ${poolSize}`);

console.log('✨ Omega Master demo complete!');
