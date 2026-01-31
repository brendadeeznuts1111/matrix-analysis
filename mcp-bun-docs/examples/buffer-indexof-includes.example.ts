#!/usr/bin/env bun
/**
 * Buffer.indexOf / Buffer.includes — SIMD-optimized (single + multi-byte patterns)
 */

const buffer = Buffer.from("a".repeat(1_000_000) + "needle");

// Both methods are now faster with SIMD acceleration
buffer.indexOf("needle"); // single and multi-byte patterns
buffer.includes("needle");

console.log("indexOf:", buffer.indexOf("needle"));
console.log("includes:", buffer.includes("needle"));
