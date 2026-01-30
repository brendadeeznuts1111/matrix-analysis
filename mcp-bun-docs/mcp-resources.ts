/**
 * Tier-1380 ACP Integration — Expose matrix to Agent Communication Protocol
 * @col_93 balanced_braces
 */
import {
	BUN_DOCS_BASE,
	BUN_DOCS_VERSION,
	BUN_137_FEATURE_MATRIX,
	BUN_137_COMPLETE_MATRIX,
	BINARY_PERF_METRICS,
} from "./lib.ts";

export const MATRIX_ACP_RESOURCES = [
	{
		uri: "bun://docs/matrix/v1.3.7",
		mimeType: "application/json",
		name: "Tier-1380 Feature Matrix",
		metadata: {
			bunVersion: BUN_DOCS_VERSION,
			baseUrl: BUN_DOCS_BASE,
			checksum: "sha256:...",
		},
	},
	{
		uri: "bun://docs/matrix/v1.3.7-complete",
		mimeType: "application/json",
		name: "Tier-1380 Complete Matrix (28 entries)",
		metadata: { bunVersion: BUN_DOCS_VERSION, entryCount: 28 },
	},
	{
		uri: "bun://docs/matrix/perf-baselines",
		mimeType: "text/markdown",
		name: "Performance Regression Gates",
		content: [
			"# Tier-1380 Performance Baselines",
			"",
			"| Op | Before | After | Use Case |",
			"|----|--------|-------|----------|",
			...BINARY_PERF_METRICS.map((m) => `| ${m.op} | ${m.before} | ${m.after} | ${m.use} |`),
			"",
			"**Buffer.swap64 baseline:** 0.56µs/64KB",
		].join("\n"),
	},
];
