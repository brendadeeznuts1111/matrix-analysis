#!/usr/bin/env bun
/**
 * Simple CRC32 Performance Test
 */

function runSimpleTest() {
  console.log("Testing Bun.hash.crc32 performance...");

  // Create 1MB test data
  const testData = Buffer.alloc(1024 * 1024);
  for (let i = 0; i < testData.length; i++) {
    testData[i] = i % 256;
  }

  // Benchmark
  const testIterations = 100;
  console.time("CRC32 Benchmark");

  for (let i = 0; i < testIterations; i++) {
    Bun.hash.crc32(testData);
  }

  console.timeEnd("CRC32 Benchmark");

  // Single hash test
  console.time("Single CRC32");
  const testHash = Bun.hash.crc32(testData);
  console.timeEnd("Single CRC32");

  console.log(`Hash result: 0x${testHash.toString(16).padStart(8, '0').toUpperCase()}`);
  console.log(`Data size: ${testData.length} bytes`);
  console.log(`Iterations: ${testIterations}`);
}

runSimpleTest();
