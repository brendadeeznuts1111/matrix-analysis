#!/usr/bin/env bun
/**
 * Bun.spawnSync perf benchmark — Linux close_range() fix (30x).
 * Before: ~13ms per 100 spawns (65K FD iteration fallback)
 * After:  ~0.4ms per 100 spawns (close_range syscall)
 * @col_93 balanced_braces
 */

const N = 100;
const start = performance.now();
for (let i = 0; i < N; i++) Bun.spawnSync(["true"]);
const ms = performance.now() - start;
console.log(
	`Bun.spawnSync(["true"]) × ${N}: ${ms.toFixed(2)}ms (${(ms / N).toFixed(3)}ms/spawn)`,
);
console.log(
	ms < 1 ? "✓ close_range() path (Linux fixed)" : "~ legacy FD iteration (or non-Linux)",
);
