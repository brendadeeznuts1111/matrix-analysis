#!/usr/bin/env bun
/**
 * bunmark-markdown — Bun.markdown Benchmark Harness
 *
 * Benchmarks the native Zig CommonMark parser against npm alternatives.
 * Measures: throughput (MB/s), latency (ops/sec), and memory delta.
 *
 * Run:
 *   bun run src/benchmarks/bunmark-markdown.ts run
 *   bun run src/benchmarks/bunmark-markdown.ts demo
 *   bun run src/benchmarks/bunmark-markdown.ts compare
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface BenchResult {
	name: string;
	opsPerSec: number;
	avgMs: number;
	minMs: number;
	maxMs: number;
	throughputMBs: number;
	memoryDeltaKB: number;
}

interface BenchConfig {
	warmup: number;
	iterations: number;
	inputSizeKB: number;
}

// ─── Test Payloads ───────────────────────────────────────────────────────────

const PAYLOADS = {
	tiny: "# Hello\n\nWorld\n",

	small: `# Bun v1.3.8 Release

Bun v1.3.8 introduces **Bun.markdown**, a builtin CommonMark-compliant
Markdown parser written in Zig.

## Features

- Native performance
- Zero dependencies
- CommonMark compliant
- GFM extensions

\`\`\`typescript
const html = Bun.markdown("# Hello");
\`\`\`

> This is a blockquote with **bold** and *italic* text.

| Feature | Status |
|---------|--------|
| Headings | Done |
| Links | Done |
| Tables | Done |
`,

	medium: "", // generated below
	large: "", // generated below
};

function generatePayload(sizeKB: number): string {
	const section = `## Section {N}

This is paragraph content with **bold**, *italic*, and \`code\` formatting.
It includes [links](https://example.com) and ![images](https://example.com/img.png).

- List item alpha
- List item beta with **nested bold**
- List item gamma

\`\`\`typescript
function example{N}(): string {
  const value = {N} * 42;
  return \`Result: \${value}\`;
}
\`\`\`

> Blockquote section {N} with *emphasis*.

| Col A | Col B | Col C |
|-------|-------|-------|
| row{N}a | row{N}b | row{N}c |

---

`;
	const sectionBytes = new TextEncoder().encode(section).length;
	const count = Math.ceil((sizeKB * 1024) / sectionBytes);
	const parts: string[] = ["# Benchmark Document\n\n"];
	for (let i = 0; i < count; i++) {
		parts.push(section.replaceAll("{N}", String(i)));
	}
	return parts.join("");
}

PAYLOADS.medium = generatePayload(64);
PAYLOADS.large = generatePayload(512);

// ─── Benchmark Runner ────────────────────────────────────────────────────────

function benchmarkRun(
	name: string,
	fn: (input: string) => string,
	input: string,
	config: BenchConfig,
): BenchResult {
	const inputBytes = new TextEncoder().encode(input).length;
	const inputMB = inputBytes / (1024 * 1024);

	// Warmup
	for (let i = 0; i < config.warmup; i++) {
		fn(input);
	}

	// Collect GC before measuring
	Bun.gc(true);
	const heapBefore = process.memoryUsage().heapUsed;

	const times: number[] = [];
	for (let i = 0; i < config.iterations; i++) {
		const start = Bun.nanoseconds();
		fn(input);
		const end = Bun.nanoseconds();
		times.push((end - start) / 1e6); // ms
	}

	const heapAfter = process.memoryUsage().heapUsed;

	const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
	const minMs = Math.min(...times);
	const maxMs = Math.max(...times);
	const opsPerSec = 1000 / avgMs;
	const throughputMBs = inputMB * opsPerSec;
	const memoryDeltaKB = (heapAfter - heapBefore) / 1024;

	return { name, opsPerSec, avgMs, minMs, maxMs, throughputMBs, memoryDeltaKB };
}

function formatResult(r: BenchResult): string {
	return [
		`  ${r.name}`,
		`    ops/sec:     ${r.opsPerSec.toFixed(1).padStart(10)}`,
		`    avg:         ${r.avgMs.toFixed(3).padStart(10)} ms`,
		`    min/max:     ${r.minMs.toFixed(3)} / ${r.maxMs.toFixed(3)} ms`,
		`    throughput:  ${r.throughputMBs.toFixed(2).padStart(10)} MB/s`,
		`    mem delta:   ${r.memoryDeltaKB.toFixed(1).padStart(10)} KB`,
	].join("\n");
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function runBenchmarks() {
	console.log("bunmark-markdown  |  Bun.markdown Benchmark Harness");
	console.log("=".repeat(60));
	console.log(`Runtime: Bun ${Bun.version}`);
	console.log(`Date:    ${new Date().toISOString()}`);
	console.log();

	const config: BenchConfig = { warmup: 50, iterations: 1000, inputSizeKB: 0 };

	const suites = [
		{ label: "tiny (~20B)", input: PAYLOADS.tiny },
		{ label: "small (~500B)", input: PAYLOADS.small },
		{ label: "medium (~64KB)", input: PAYLOADS.medium },
		{ label: "large (~512KB)", input: PAYLOADS.large },
	];

	const results: BenchResult[] = [];

	for (const suite of suites) {
		const sizeKB = new TextEncoder().encode(suite.input).length / 1024;
		console.log(`--- ${suite.label} (${sizeKB.toFixed(1)} KB) ---`);

		const result = benchmarkRun(
			suite.label,
			(input) => Bun.markdown(input),
			suite.input,
			{ ...config, inputSizeKB: sizeKB },
		);
		results.push(result);
		console.log(formatResult(result));
		console.log();
	}

	// Summary table
	console.log("=".repeat(60));
	console.log("Summary");
	console.log();
	if (typeof Bun !== "undefined") {
		Bun.inspect.table(
			results.map((r) => ({
				Suite: r.name,
				"ops/sec": Math.round(r.opsPerSec),
				"avg (ms)": Number(r.avgMs.toFixed(3)),
				"MB/s": Number(r.throughputMBs.toFixed(2)),
				"mem (KB)": Number(r.memoryDeltaKB.toFixed(1)),
			})),
		);
	}
}

async function runComparison() {
	console.log("bunmark-markdown compare  |  Bun.markdown vs npm parsers");
	console.log("=".repeat(60));
	console.log();

	const input = PAYLOADS.medium;
	const config: BenchConfig = { warmup: 20, iterations: 500, inputSizeKB: 64 };

	// Always benchmark Bun.markdown
	const bunResult = benchmarkRun(
		"Bun.markdown (native)",
		(md) => Bun.markdown(md),
		input,
		config,
	);

	const results: BenchResult[] = [bunResult];

	// Try marked (npm)
	try {
		const { marked } = await import("marked");
		const markedResult = benchmarkRun(
			"marked (npm)",
			(md) => marked(md) as string,
			input,
			config,
		);
		results.push(markedResult);
	} catch {
		console.log("  [skip] marked not installed (bun add marked)");
	}

	// Try markdown-it (npm)
	try {
		const MarkdownIt = (await import("markdown-it")).default;
		const mdi = new MarkdownIt();
		const mdiResult = benchmarkRun(
			"markdown-it (npm)",
			(md) => mdi.render(md),
			input,
			config,
		);
		results.push(mdiResult);
	} catch {
		console.log("  [skip] markdown-it not installed (bun add markdown-it)");
	}

	console.log();
	for (const r of results) {
		console.log(formatResult(r));
		console.log();
	}

	// Speedup comparison
	if (results.length > 1) {
		console.log("--- Speedup vs Bun.markdown ---");
		for (let i = 1; i < results.length; i++) {
			const speedup = results[i].avgMs / bunResult.avgMs;
			console.log(`  ${results[i].name}: ${speedup.toFixed(1)}x slower`);
		}
	}
}

function showDemo() {
	console.log("bunmark-markdown demo  |  Bun.markdown Quick Demo");
	console.log("=".repeat(60));
	console.log();

	const md = `# Hello from Bun.markdown

This is a **demo** of the native CommonMark parser.

## Features

- Headings (h1-h6)
- **Bold** and *italic*
- \`Inline code\` and fenced blocks
- [Links](https://bun.com)
- Lists (ordered + unordered)
- Blockquotes
- Tables (GFM)
- ~~Strikethrough~~ (GFM)
- Task lists (GFM)

\`\`\`typescript
const html = Bun.markdown("# Hello");
console.log(html);
\`\`\`

> Built into Bun v1.3.8. Zero dependencies. Zig-powered.

| Parser | Type | Speed |
|--------|------|-------|
| Bun.markdown | Native (Zig) | Fastest |
| marked | npm | Fast |
| markdown-it | npm | Moderate |
`;

	console.log("Input:");
	console.log(md);
	console.log("-".repeat(60));
	console.log("Output (HTML):");
	console.log();

	const start = Bun.nanoseconds();
	const html = Bun.markdown(md);
	const elapsed = (Bun.nanoseconds() - start) / 1e6;

	console.log(html);
	console.log("-".repeat(60));
	console.log(`Rendered in ${elapsed.toFixed(3)} ms`);
	console.log(`Input:  ${new TextEncoder().encode(md).length} bytes`);
	console.log(`Output: ${new TextEncoder().encode(html).length} bytes`);
}

function showHelp() {
	console.log(`bunmark-markdown — Bun.markdown Benchmark Harness

Usage:
  bun run src/benchmarks/bunmark-markdown.ts <command>

Commands:
  run       Run full benchmark suite (tiny → large payloads)
  compare   Compare Bun.markdown vs npm parsers (marked, markdown-it)
  demo      Quick demo with sample markdown
  help      Show this help message
`);
}

// ─── CLI Entry ───────────────────────────────────────────────────────────────

async function main() {
	const command = Bun.argv[2] || "demo";

	switch (command) {
		case "run":
			await runBenchmarks();
			break;
		case "compare":
			await runComparison();
			break;
		case "demo":
			showDemo();
			break;
		case "help":
		case "--help":
		case "-h":
			showHelp();
			break;
		default:
			console.error(`Unknown command: ${command}`);
			showHelp();
			process.exit(1);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
