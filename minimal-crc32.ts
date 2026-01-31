#!/usr/bin/env bun
/**
 * Minimal CRC32 Performance Test
 * Exact example from the documentation
 */

// Create 1MB buffer
const minimalData = Buffer.alloc(1024 * 1024); // 1MB buffer

// Hash it - now ~20x faster with hardware acceleration
console.time("Bun.hash.crc32");
const minimalHash = Bun.hash.crc32(minimalData); // ~20x faster
console.timeEnd("Bun.hash.crc32");

console.log(`Hash: 0x${minimalHash.toString(16).padStart(8, '0').toUpperCase()}`);
console.log("✅ Hardware acceleration via zlib (PCLMULQDQ on x86, native CRC32 on ARM)");
