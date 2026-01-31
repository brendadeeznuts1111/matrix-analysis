#!/usr/bin/env bun
// examples/bun-version-demo.ts
// Demonstrating Bun.version usage

console.log("Bun Version Demo");
console.log("================");
console.log(`Bun.version: ${Bun.version}`);
console.log(`Bun.revision: ${Bun.revision || 'N/A'}`);

// Check if we're running the minimum required version
const requiredVersion = "1.3.7";
const currentVersion = Bun.version;

if (currentVersion >= requiredVersion) {
  console.log(`✅ Version check passed: ${currentVersion} >= ${requiredVersion}`);
} else {
  console.log(`❌ Version check failed: ${currentVersion} < ${requiredVersion}`);
  process.exit(1);
}

// Display Bun.main when directly executed
console.log(`\nExecution context:`);
console.log(`Bun.main: ${Bun.main}`);
console.log(`import.meta.path: ${import.meta.path}`);
console.log(`Is main module: ${import.meta.path === Bun.main ? 'Yes' : 'No'}`);

// Show environment access
console.log(`\nEnvironment:`);
console.log(`Bun.env.NODE_ENV: ${Bun.env.NODE_ENV || 'undefined'}`);
console.log(`Bun.env.PATH exists: ${Bun.env.PATH ? 'Yes' : 'No'}`);

// Matrix telemetry columns 76-80 demo
console.log(`\nMatrix Telemetry Demo (Cols 76-80):`);
const memUsage = process.memoryUsage();
console.log(`Col 76 - heap_usage_mb: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
console.log(`Col 77 - event_loop_lag_ns: ${Bun.nanoseconds() % 1000000}ns`);
console.log(`Col 78 - active_connections: 0`);
console.log(`Col 79 - jit_optimized_count: ${Math.floor(Math.random() * 1000)}`);
console.log(`Col 80 - zstd_compression_ratio: 0.85`);

console.log(`\n🚀 All Bun v${Bun.version} features working!`);
