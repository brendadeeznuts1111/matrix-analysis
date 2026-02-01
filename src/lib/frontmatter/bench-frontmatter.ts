#!/usr/bin/env bun
/**
 * Frontmatter Extraction Benchmark
 *
 * Exercises: single-file extract, normalize, validate, batch scan, HTML inject
 * Produces timing table via Bun.inspect.table.
 */

import { extractFrontmatter } from "./extractor";
import { normalizeFrontmatter } from "./normalizer";
import { validateFrontmatter, type FrontmatterSchema } from "./validator";
import { batchExtractFrontmatter, generateIndex } from "./batch";
import { injectIntoHtml } from "./inject";

const QUIET = process.argv.includes("--quiet") || !!process.env.CLAUDECODE;

// ─── Fixtures ───────────────────────────────────────────────────────────────

const YAML_MD = `---
title: "Benchmark Post: YAML Edition"
description: Performance testing the YAML frontmatter parser
date: 2026-02-01
tags:
  - benchmark
  - bun
  - frontmatter
  - performance
draft: false
author: Nola Rose
slug: bench-yaml
image: https://example.com/images/bench.png
---
# Benchmark Post

This is a **benchmark** post with various inline elements.

- List item 1
- List item 2
- List item 3

\`\`\`typescript
const result = extractFrontmatter(md);
\`\`\`

> A blockquote for testing.

| Col A | Col B |
|-------|-------|
| 1     | 2     |
`;

const TOML_MD = `+++
title = "Benchmark Post: TOML Edition"
description = "Performance testing the TOML frontmatter parser"
date = "2026-02-01"
tags = ["benchmark", "bun", "toml"]
draft = false
author = "Nola Rose"
slug = "bench-toml"
+++
# TOML Benchmark

Content after TOML frontmatter.
`;

const JSON_MD = `{
  "title": "Benchmark Post: JSON Edition",
  "description": "Performance testing JSON frontmatter",
  "date": "2026-02-01",
  "tags": ["benchmark", "bun", "json"],
  "draft": false,
  "author": "Nola Rose",
  "slug": "bench-json"
}

# JSON Benchmark

Content after JSON frontmatter.
`;

const PLAIN_MD = "# No Frontmatter\n\nJust plain markdown content.\n";

const SCHEMA: FrontmatterSchema = {
	title: { type: "string", required: true, min: 5, max: 200 },
	date: { type: "string", required: true },
	tags: { type: "array", min: 1 },
	draft: "boolean",
	slug: { type: "string", pattern: /^[a-z0-9-]+$/ },
};

// ─── Timing utility ─────────────────────────────────────────────────────────

function bench(label: string, fn: () => void, iterations = 1000): number {
	// Warmup
	for (let i = 0; i < 50; i++) fn();

	const t0 = Bun.nanoseconds();
	for (let i = 0; i < iterations; i++) fn();
	const elapsed = (Bun.nanoseconds() - t0) / 1e6;
	return elapsed / iterations; // ms per op
}

// ─── Benchmarks ─────────────────────────────────────────────────────────────

const results: { benchmark: string; opsPerSec: string; msPerOp: string }[] = [];

function record(name: string, msPerOp: number): void {
	const ops = 1000 / msPerOp;
	results.push({
		benchmark: name,
		opsPerSec: ops >= 1000 ? `${(ops / 1000).toFixed(1)}k` : ops.toFixed(0),
		msPerOp: msPerOp < 0.01 ? `${(msPerOp * 1000).toFixed(1)}us` : `${msPerOp.toFixed(3)}ms`,
	});
}

// 1. Extract YAML
record("extract(YAML)", bench("yaml", () => extractFrontmatter(YAML_MD)));

// 2. Extract TOML
record("extract(TOML)", bench("toml", () => extractFrontmatter(TOML_MD)));

// 3. Extract JSON
record("extract(JSON)", bench("json", () => extractFrontmatter(JSON_MD)));

// 4. Extract none
record("extract(none)", bench("none", () => extractFrontmatter(PLAIN_MD)));

// 5. Normalize
const yamlData = extractFrontmatter(YAML_MD).data;
record("normalize", bench("norm", () => normalizeFrontmatter(yamlData, { seoMapping: true })));

// 6. Validate
const normalized = normalizeFrontmatter(yamlData, { seoMapping: true });
record("validate", bench("valid", () => validateFrontmatter(normalized, SCHEMA)));

// 7. Full pipeline: extract + normalize + validate
record("full pipeline", bench("pipe", () => {
	const ex = extractFrontmatter(YAML_MD);
	const n = normalizeFrontmatter(ex.data, { seoMapping: true });
	validateFrontmatter(n, SCHEMA);
}));

// 8. HTML injection
record("injectIntoHtml", bench("inject", () => {
	injectIntoHtml(
		"<html><head><title>T</title></head><body><p>B</p></body></html>",
		normalized,
		{ modes: ["meta", "opengraph", "jsonld"], siteUrl: "https://example.com" },
	);
}));

// 9. Full render pipeline: extract + normalize + markdown.html + inject
record("render pipeline", bench("render", () => {
	const ex = extractFrontmatter(YAML_MD);
	const n = normalizeFrontmatter(ex.data, { seoMapping: true });
	const html = Bun.markdown.html(ex.content);
	injectIntoHtml(`<html><head></head><body>${html}</body></html>`, n, {
		modes: ["meta", "opengraph", "jsonld"],
	});
}, 500));

// ─── Batch benchmark (file I/O) ────────────────────────────────────────────

const BATCH_DIR = "/tmp/frontmatter-bench";
const BATCH_SIZE = 100;

async function setupBatchDir(): Promise<void> {
	await Bun.$`rm -rf ${BATCH_DIR} && mkdir -p ${BATCH_DIR}`.quiet();
	const templates = [YAML_MD, TOML_MD, JSON_MD, PLAIN_MD];
	const writes: Promise<number>[] = [];
	for (let i = 0; i < BATCH_SIZE; i++) {
		const md = templates[i % templates.length];
		writes.push(Bun.write(`${BATCH_DIR}/post-${String(i).padStart(4, "0")}.md`, md));
	}
	await Promise.all(writes);
}

async function runBatchBench(): Promise<void> {
	await setupBatchDir();

	// Warmup
	await batchExtractFrontmatter(BATCH_DIR);

	const iterations = 5;
	const times: number[] = [];
	for (let i = 0; i < iterations; i++) {
		const t0 = Bun.nanoseconds();
		const result = await batchExtractFrontmatter(BATCH_DIR, { schema: SCHEMA });
		const elapsed = (Bun.nanoseconds() - t0) / 1e6;
		times.push(elapsed);
		if (i === 0) {
			record(`batch(${BATCH_SIZE} files)`, elapsed);
			record("batch per-file", elapsed / result.totalFiles);
			record("index generation", (() => {
				const t = Bun.nanoseconds();
				generateIndex(result);
				return (Bun.nanoseconds() - t) / 1e6;
			})());
		}
	}

	const sorted = [...times].sort((a, b) => a - b);
	const median = sorted[Math.floor(sorted.length / 2)];

	results.push({
		benchmark: `batch median(${iterations}x)`,
		opsPerSec: "-",
		msPerOp: `${median.toFixed(2)}ms`,
	});

	// Cleanup
	await Bun.$`rm -rf ${BATCH_DIR}`.quiet();
}

async function main(): Promise<void> {
	await runBatchBench();

	if (!QUIET) {
		console.log("\n📊 Frontmatter Benchmark Results\n");
	}
	console.log(Bun.inspect.table(results, ["benchmark", "opsPerSec", "msPerOp"]));

	if (!QUIET) {
		console.log(`\nBun ${Bun.version} | ${process.platform}/${process.arch}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
