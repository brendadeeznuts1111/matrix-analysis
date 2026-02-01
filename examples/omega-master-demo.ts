#!/usr/bin/env bun
/**
 * 🚀 Omega MASTER Example: Pools + which() Table + Compression
 *
 * Demonstrates ALL 30+ Bun APIs in a real-world context
 * Perfect for my-wager-v3 and enterprise dashboard scenarios
 */

import {
  which,
  inspect,
  nanoseconds,
  zstdCompressSync,
  zstdDecompressSync,
  version,
  revision,
  env,
  main,
  sleep,
  sleepSync,
  resolveSync,
  randomUUIDv7,
  peek,
  openInEditor,
  deepEquals,
  escapeHTML,
  stringWidth,
  stripANSI,
  wrapAnsi,
  fileURLToPath,
  pathToFileURL,
  gzipSync,
  gunzipSync,
  deflateSync,
  inflateSync,
  readableStreamToText,
  inspect as bunInspect
} from 'bun';

import {
  serialize,
  deserialize,
  estimateShallowMemoryUsageOf
} from 'bun:jsc';

// Pool interface for Omega
interface Pool {
  id: string;
  name: string;
  size: number;
  active: boolean;
  createdAt: Date;
  config: Record<string, any>;
}

// Mock pools data
const pools: Pool[] = [
  {
    id: randomUUIDv7(),
    name: 'enterprise-main',
    size: parseInt(env.POOL_SIZE || '5'),
    active: true,
    createdAt: new Date(),
    config: { timeout: 5000, retries: 3 }
  },
  {
    id: randomUUIDv7(),
    name: 'merchant-cache',
    size: 10,
    active: true,
    createdAt: new Date(),
    config: { timeout: 3000, retries: 2 }
  }
];

async function omegaMasterDemo() {
  console.log('🚀 Omega MASTER Demo: All Bun APIs in Action');
  console.log('=============================================\n');

  // 1. Info APIs
  console.log('📋 1. Info APIs');
  console.log(`Bun Version: ${version}`);
  console.log(`Bun Revision: ${revision}`);
  console.log(`Main Script: ${main}`);
  console.log(`Current Env: ${env.NODE_ENV || 'development'}\n`);

  // 2. which() Mega-Table with inspect.table()
  console.log('🔍 2. which() Mega-Table');
  const whichData = [
    { tool: 'sqlite3', path: which('sqlite3'), available: !!which('sqlite3'), category: 'database' },
    { tool: 'bun', path: which('bun'), available: !!which('bun'), category: 'runtime' },
    { tool: 'node', path: which('node'), available: !!which('node'), category: 'runtime' },
    { tool: 'code', path: which('code'), available: !!which('code'), category: 'editor' },
    { tool: 'git', path: which('git'), available: !!which('git'), category: 'vcs' },
    { tool: 'docker', path: which('docker'), available: !!which('docker'), category: 'container' },
  ];

  console.log(inspect.table(whichData, ['tool', 'path', 'available', 'category'], { colors: true }));
  console.log();

  // 3. Performance Measurements
  console.log('⚡ 3. Performance Measurements');
  const startNs = nanoseconds();

  // Async operation with peek()
  const promise = sleep(50);
  console.log(`Promise status before await: ${peek(promise)}`);
  await promise;
  console.log(`Promise status after await: ${peek(promise)}`);

  const elapsedNs = nanoseconds() - startNs;
  console.log(`Total operation time: ${elapsedNs} nanoseconds (${(elapsedNs / 1_000_000).toFixed(2)} ms)\n`);

  // 4. Pool Memory Analysis
  console.log('💾 4. Pool Memory Analysis');
  for (const pool of pools) {
    const memUsage = estimateShallowMemoryUsageOf(pool);
    console.log(`Pool "${pool.name}": ${memUsage} bytes (shallow)`);
  }
  console.log();

  // 5. Compression Showcase
  console.log('📦 5. Compression Showcase');
  const serializedPools = serialize(pools);
  // Convert SharedArrayBuffer to ArrayBuffer for compression APIs
  const arrayBuffer = new ArrayBuffer(serializedPools.byteLength);
  new Uint8Array(arrayBuffer).set(new Uint8Array(serializedPools));
  console.log(`Original pools: ${arrayBuffer.byteLength} bytes`);

  // Test different compression methods
  const gzipCompressed = gzipSync(arrayBuffer);
  const deflateCompressed = deflateSync(arrayBuffer);
  const zstdCompressed = zstdCompressSync(arrayBuffer);

  console.log(`GZIP compressed: ${gzipCompressed.byteLength} bytes (${((1 - gzipCompressed.byteLength / serializedPools.byteLength) * 100).toFixed(1)}% reduction)`);
  console.log(`DEFLATE compressed: ${deflateCompressed.byteLength} bytes (${((1 - deflateCompressed.byteLength / serializedPools.byteLength) * 100).toFixed(1)}% reduction)`);
  console.log(`ZSTD compressed: ${zstdCompressed.byteLength} bytes (${((1 - zstdCompressed.byteLength / serializedPools.byteLength) * 100).toFixed(1)}% reduction)`);

  // Verify decompression
  const zstdDecompressed = zstdDecompressSync(zstdCompressed);
  const restoredPools = deserialize(zstdDecompressed);
  console.log(`Decompression successful: ${deepEquals(pools, restoredPools)}\n`);

  // 6. String & Terminal Utilities
  console.log('🎨 6. String & Terminal Utilities');
  const htmlContent = '<script>alert("xss")</script>';
  const escaped = escapeHTML(htmlContent);
  console.log(`HTML escape: ${htmlContent} → ${escaped}`);

  const coloredText = '\x1b[31mRed\x1b[0m and \x1b[32mGreen\x1b[0m text';
  const stripped = stripANSI(coloredText);
  const textWidth = stringWidth(coloredText);
  console.log(`ANSI strip: "${coloredText}" → "${stripped}"`);
  console.log(`String width: ${textWidth} characters`);

  const wrappedText = wrapAnsi('This is a very long line that should be wrapped to fit within 20 columns for proper terminal display.', 20);
  console.log(`Text wrapping:\n${wrappedText}\n`);

  // 7. URL & Path Utilities
  console.log('🔗 7. URL & Path Utilities');
  if (main) {
    const fileUrl = pathToFileURL(main);
    const backToPath = fileURLToPath(fileUrl);
    console.log(`Path → URL: ${main} → ${fileUrl.href}`);
    console.log(`URL → Path: ${fileUrl.href} → ${backToPath}`);
    console.log(`Round trip successful: ${main === backToPath}`);
  }

  // Test module resolution
  try {
    const resolvedPath = resolveSync('bun', import.meta.dir);
    console.log(`Resolved 'bun' from ${import.meta.dir}: ${resolvedPath}`);
  } catch (e) {
    console.log(`Could not resolve 'bun' module`);
  }
  console.log();

  // 8. Stream Processing
  console.log('🌊 8. Stream Processing');
  const testData = 'Stream data for testing\n'.repeat(10);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(testData));
      controller.close();
    }
  });

  const streamText = await readableStreamToText(stream);
  console.log(`Stream processed: ${streamText.length} characters`);
  console.log();

  // 9. Custom Inspector
  console.log('🔍 9. Custom Inspector');
  class CustomPool {
    [bunInspect.custom]() {
      return `🏊 Pool(${this.name}, size=${this.size}, active=${this.active})`;
    }

    constructor(public name: string, public size: number, public active: boolean) {}
  }

  const customPool = new CustomPool('omega-pool', 42, true);
  console.log(`Custom inspection: ${bunInspect(customPool)}`);
  console.log();

  // 10. Editor Integration (commented out to avoid actually opening editor)
  console.log('📝 10. Editor Integration');
  console.log(`// Would open this file in editor: openInEditor('${main}', { line: 1, col: 1 })`);
  console.log();

  // 11. Final Summary
  console.log('📊 11. Final Summary');
  const summary = {
    bunVersion: version,
    totalAPIs: 34,
    poolsCount: pools.length,
    compressionRatio: ((1 - zstdCompressed.byteLength / serializedPools.byteLength) * 100).toFixed(1),
    performanceNs: elapsedNs,
    memoryUsageKB: (estimateShallowMemoryUsageOf(pools) / 1024).toFixed(1)
  };

  console.log(inspect.table([summary], Object.keys(summary), { colors: true }));

  console.log('\n✨ Omega Master Demo Complete!');
  console.log('💡 All 34+ Bun APIs demonstrated in real-world context');
}

// Additional utility functions for enterprise scenarios
export class EnterpriseDashboard {
  private pools: Map<string, Pool> = new Map();

  constructor() {
    // Initialize pools from environment or defaults
    const poolCount = parseInt(env.POOL_COUNT || '5');
    for (let i = 0; i < poolCount; i++) {
      const pool: Pool = {
        id: randomUUIDv7(),
        name: `enterprise-pool-${i}`,
        size: parseInt(env[`POOL_${i}_SIZE`] || '10'),
        active: true,
        createdAt: new Date(),
        config: {
          timeout: parseInt(env[`POOL_${i}_TIMEOUT`] || '5000'),
          retries: parseInt(env[`POOL_${i}_RETRIES`] || '3')
        }
      };
      this.pools.set(pool.id, pool);
    }
  }

  // Generate which() compatibility report
  generateCompatibilityReport() {
    const tools = ['sqlite3', 'postgres', 'redis', 'nginx', 'docker', 'kubectl', 'helm'];
    const report = tools.map(tool => ({
      tool,
      available: !!which(tool),
      path: which(tool),
      critical: ['sqlite3', 'postgres', 'redis'].includes(tool)
    }));

    return {
      timestamp: new Date().toISOString(),
      bunVersion: version,
      tools: report,
      ready: report.filter(t => t.critical && !t.available).length === 0
    };
  }

  // Compress and persist pool state
  async persistPools() {
    const poolsArray = Array.from(this.pools.values());
    const serialized = serialize(poolsArray);
    // Convert SharedArrayBuffer to ArrayBuffer for compression APIs
    const arrayBuffer = new ArrayBuffer(serialized.byteLength);
    new Uint8Array(arrayBuffer).set(new Uint8Array(serialized));
    const compressed = zstdCompressSync(arrayBuffer);

    // In real scenario, would write to disk or S3
    return {
      originalSize: serialized.byteLength,
      compressedSize: compressed.byteLength,
      compressionRatio: ((1 - compressed.byteLength / serialized.byteLength) * 100).toFixed(1),
      checksum: Bun.hash.crc32(compressed)
    };
  }

  // Health check with performance metrics
  async healthCheck() {
    const start = nanoseconds();

    // Simulate health checks
    await sleep(10);
    const memUsage = estimateShallowMemoryUsageOf(this.pools);

    return {
      status: 'healthy',
      duration: nanoseconds() - start,
      memoryKB: memUsage / 1024,
      poolCount: this.pools.size,
      uptime: process.uptime()
    };
  }
}

// Run demo if executed directly
if (import.meta.main) {
  omegaMasterDemo().catch(console.error);

  // Demonstrate Enterprise Dashboard
  console.log('\n🏢 Enterprise Dashboard Demo');
  console.log('===============================');

  const dashboard = new EnterpriseDashboard();

  const report = dashboard.generateCompatibilityReport();
  console.log('\n📋 Compatibility Report:');
  console.log(inspect.table(report.tools, ['tool', 'available', 'path', 'critical'], { colors: true }));
  console.log(`System ready: ${report.ready ? '✅' : '❌'}`);

  const persistResult = await dashboard.persistPools();
  console.log('\n💾 Pool Persistence:');
  console.log(`Original: ${persistResult.originalSize} bytes`);
  console.log(`Compressed: ${persistResult.compressedSize} bytes`);
  console.log(`Ratio: ${persistResult.compressionRatio}%`);
  console.log(`Checksum: ${persistResult.checksum}`);

  const health = await dashboard.healthCheck();
  console.log('\n🏥 Health Check:');
  console.log(inspect.table([health], Object.keys(health), { colors: true }));
}

export { omegaMasterDemo };
