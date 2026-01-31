#!/usr/bin/env bun
/**
 * Quick CRC32 Speed Verification
 */

console.log("🚀 Bun.hash.crc32 Hardware Acceleration Test");
console.log("==========================================\n");

// Test data
const sizes = [
  { name: "1KB", bytes: 1024 },
  { name: "100KB", bytes: 1024 * 100 },
  { name: "1MB", bytes: 1024 * 1024 }
];

for (const size of sizes) {
  const quickData = new Uint8Array(size.bytes);
  // Fill with pattern
  for (let i = 0; i < quickData.length; i++) {
    quickData[i] = i % 256;
  }

  // Warm up
  for (let i = 0; i < 10; i++) {
    Bun.hash.crc32(quickData);
  }

  // Measure
  const quickIterations = 1000;
  const start = performance.now();

  for (let i = 0; i < quickIterations; i++) {
    Bun.hash.crc32(quickData);
  }

  const end = performance.now();
  const totalTime = end - start;
  const avgTime = (totalTime / quickIterations) * 1000; // microseconds
  const throughput = (size.bytes / 1024 / 1024) / (avgTime / 1000000); // MB/s

  console.log(`${size.name}:`);
  console.log(`  Average time: ${avgTime.toFixed(1)} µs`);
  console.log(`  Throughput: ${throughput.toFixed(1)} MB/s`);
  console.log(`  Expected: ~${size.name === "1MB" ? "124 µs" : size.name === "100KB" ? "12 µs" : "0.1 µs"} (20x faster than before)`);
  console.log();
}

// Show hash result verification
const quickTestData = new TextEncoder().encode("Hello, Bun CRC32!");
const quickTestHash = Bun.hash.crc32(quickTestData);
console.log(`Test hash: 0x${quickTestHash.toString(16).padStart(8, '0').toUpperCase()}`);
console.log("✅ Hardware acceleration is active if times match expected values!");
