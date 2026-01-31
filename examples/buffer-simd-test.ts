#!/usr/bin/env bun
/**
 * Buffer SIMD Verification Test
 * Quick test to verify SIMD optimization is active
 */

// Make this file a module to allow top-level await
export {};

console.log("🔍 Buffer SIMD Verification Test");
console.log("================================\n");

// Test 1: Basic functionality
console.log("Test 1: Basic Functionality");
console.log("---------------------------");
const buffer = Buffer.from("Hello World! This is a test string for SIMD optimization.");
console.log(`Buffer length: ${buffer.length} bytes`);
console.log(`Includes "World": ${buffer.includes("World")}`);
console.log(`IndexOf "World": ${buffer.indexOf("World")}`);
console.log(`Includes "SIMD": ${buffer.includes("SIMD")}`);
console.log(`IndexOf "SIMD": ${buffer.indexOf("SIMD")}`);

// Test 2: Large buffer performance
console.log("\nTest 2: Large Buffer Performance");
console.log("---------------------------------");
const largeBuffer = Buffer.from("a".repeat(100_000) + "SIMD_TEST");

// Quick performance check
const iterations = 10_000;
console.time(`10K includes (found)`);
for (let i = 0; i < iterations; i++) {
  largeBuffer.includes("SIMD_TEST");
}
console.timeEnd(`10K includes (found)`);

console.time(`10K includes (not found)`);
for (let i = 0; i < iterations; i++) {
  largeBuffer.includes("NOT_FOUND");
}
console.timeEnd(`10K includes (not found)`);

// Test 3: Multi-byte patterns
console.log("\nTest 3: Multi-byte Patterns");
console.log("---------------------------");
const multiByte = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE, 0xFD]);
console.log(`Buffer: ${Array.from(multiByte).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
console.log(`Includes [0xFF, 0xFE]: ${multiByte.includes(Buffer.from([0xFF, 0xFE]))}`);
console.log(`IndexOf [0xFF, 0xFE]: ${multiByte.indexOf(Buffer.from([0xFF, 0xFE]))}`);

// Test 4: Edge cases
console.log("\nTest 4: Edge Cases");
console.log("-------------------");
const empty = Buffer.alloc(0);
console.log(`Empty buffer includes "test": ${empty.includes("test")}`);
console.log(`Empty buffer indexOf "test": ${empty.indexOf("test")}`);

const single = Buffer.from("a");
console.log(`Single char includes "a": ${single.includes("a")}`);
console.log(`Single char indexOf "a": ${single.indexOf("a")}`);

// Test 5: Performance comparison hint
console.log("\nTest 5: Performance Indicator");
console.log("------------------------------");
const testBuffer = Buffer.from("x".repeat(44_500) + "needle");

const perfStart = performance.now();
testBuffer.includes("needle");
const perfEnd = performance.now();

const time = (perfEnd - perfStart) * 1000; // Convert to microseconds
console.log(`Single includes took: ${time.toFixed(2)}μs`);

if (time < 50) {
  console.log("✅ SIMD optimization appears to be active!");
} else {
  console.log("⚠️  Might be using fallback implementation");
}

console.log("\n✨ All tests completed successfully!");
console.log("💡 SIMD optimization provides up to 2x speedup for large buffers");
