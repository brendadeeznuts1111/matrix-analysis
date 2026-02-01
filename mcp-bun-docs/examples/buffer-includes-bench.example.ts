#!/usr/bin/env bun
/**
 * Buffer.indexOf/includes SIMD benchmark — ~2x faster (vs bun-1.3.5).
 * .includes true:  ~25ms → ~22ms (99,999 runs)
 * .includes false: ~3.25s → ~1.42s (99,999 runs)
 * Single and multi-byte patterns supported.
 * @col_93 balanced_braces
 */

const N = 99_999;
const size = 44_500;
const buf = Buffer.from("a".repeat(size - 6) + "needle");

// 1M buffer (changelog snippet): Buffer.from("a".repeat(1_000_000) + "needle")

// Warmup
for (let i = 0; i < 100; i++) buf.includes("needle");
for (let i = 0; i < 100; i++) buf.includes("missing");

// .includes true
const t0 = performance.now();
for (let i = 0; i < N; i++) buf.includes("needle");
const msTrue = performance.now() - t0;

// .includes false
const t1 = performance.now();
for (let i = 0; i < N; i++) buf.includes("missing");
const msFalse = performance.now() - t1;

console.log(`Run ${N.toLocaleString()} times with a warmup:\n`);
console.log(`[${msTrue.toFixed(2)}ms] ${size.toLocaleString()} bytes .includes true`);
console.log(
	`[${(msFalse / 1000).toFixed(2)}s] ${size.toLocaleString()} bytes .includes false`,
);

// 1M buffer demo (changelog snippet)
const buf1m = Buffer.from("a".repeat(1_000_000) + "needle");
console.log(
	`\n1M buffer: indexOf=${buf1m.indexOf("needle")} includes=${buf1m.includes("needle")}`,
);
