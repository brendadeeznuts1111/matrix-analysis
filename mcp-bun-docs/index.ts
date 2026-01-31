#!/usr/bin/env bun
/**
 * SearchBun MCP Server - Bun docs search bridge
 *
 * Implements the SearchBun tool from https://bun.com/docs/mcp
 * when no public HTTP MCP endpoint is available.
 *
 * @col_93 balanced_braces (skills) - code blocks have balanced braces/brackets/parens
 *
 * Run: bun run mcp-bun-docs/index.ts
 * Or add to MCP config for Cursor/Claude.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
	searchBunDocs,
	BUN_DOC_ENTRIES,
	BUN_DOC_MAP,
	BUN_DOCS_BASE,
	BUN_DOCS_VERSION,
	BUN_DOCS_MIN_VERSION,
	BUN_CHANGELOG_RSS,
	SEARCH_WEIGHTS,
	BINARY_PERF_METRICS,
	BUN_137_FEATURE_MATRIX,
	BUN_137_COMPLETE_MATRIX,
	TIER_1380_COMPLIANCE,
	TEST_CONFIG_MATRIX,
} from "./lib.ts";
import { MATRIX_ACP_RESOURCES } from "./mcp-resources.ts";

function getMatrixResourceContent(): string {
	const curatedRows = Object.entries(BUN_DOC_MAP).map(([term, path]) => ({
		term,
		path,
		fullUrl: `${BUN_DOCS_BASE}/${path}`,
		weight: SEARCH_WEIGHTS[term] ?? 1,
	}));
	return JSON.stringify(
		{
			lastUpdated: new Date().toISOString().slice(0, 10),
			changelogRss: BUN_CHANGELOG_RSS,
			version: BUN_DOCS_VERSION,
			minVersion: BUN_DOCS_MIN_VERSION,
			baseUrl: BUN_DOCS_BASE,
			curatedTerms: curatedRows,
			entriesV2: BUN_DOC_ENTRIES.map((e) => ({
				term: e.term,
				path: e.path,
				bunMinVersion: e.bunMinVersion,
				stability: e.stability,
				platforms: e.platforms,
				security: e.security,
				perfProfile: e.perfProfile,
				useCases: e.useCases,
				changelogFeed: e.changelogFeed,
				cliFlags: e.cliFlags,
				breakingChanges: e.breakingChanges,
				relatedTerms: e.relatedTerms,
				...(e.category != null && { category: e.category }),
				...(e.newParams != null && { newParams: e.newParams }),
				...(e.methods != null && { methods: e.methods }),
				...(e.features != null && { features: e.features }),
				...(e.default != null && { default: e.default }),
				...(e.support != null && { support: e.support }),
				...(e.implementation != null && { implementation: e.implementation }),
			})),
			binaryPerfMetrics: BINARY_PERF_METRICS,
			bun137FeatureMatrix: BUN_137_FEATURE_MATRIX,
			bun137CompleteMatrix: BUN_137_COMPLETE_MATRIX,
			tier1380Compliance: TIER_1380_COMPLIANCE,
			testConfigMatrix: TEST_CONFIG_MATRIX,
		},
		null,
		2,
	);
}

const server = new McpServer(
	{ name: "bun-docs", version: "1.0.0" },
	{ capabilities: { tools: {}, resources: {} } },
);

server.resource(
	"bun-docs-matrix",
	"bun://docs/matrix",
	{ description: "Bun MCP matrix: consts, curated terms, weights. For ACP dashboard hydration." },
	async () => ({
		contents: [
			{
				uri: "bun://docs/matrix",
				mimeType: "application/json",
				text: getMatrixResourceContent(),
			},
		],
	}),
);

// Tier-1380 ACP: v1.3.7 feature matrix
server.resource(
	"bun-docs-matrix-137",
	MATRIX_ACP_RESOURCES[0].uri,
	{ description: MATRIX_ACP_RESOURCES[0].name },
	async () => ({
		contents: [{ uri: MATRIX_ACP_RESOURCES[0].uri, mimeType: "application/json", text: getMatrixResourceContent() }],
	}),
);

// Tier-1380 ACP: v1.3.7 complete (28 entries)
server.resource(
	"bun-docs-matrix-137-complete",
	MATRIX_ACP_RESOURCES[1].uri,
	{ description: MATRIX_ACP_RESOURCES[1].name },
	async () => ({
		contents: [{
			uri: MATRIX_ACP_RESOURCES[1].uri,
			mimeType: "application/json",
			text: JSON.stringify({ bunVersion: BUN_DOCS_VERSION, entries: BUN_137_COMPLETE_MATRIX, entryCount: BUN_137_COMPLETE_MATRIX.length }, null, 2),
		}],
	}),
);

// Tier-1380 ACP: Performance regression gates
server.resource(
	"bun-docs-perf-baselines",
	MATRIX_ACP_RESOURCES[2].uri,
	{ description: MATRIX_ACP_RESOURCES[2].name },
	async () => ({
		contents: [{ uri: MATRIX_ACP_RESOURCES[2].uri, mimeType: "text/markdown", text: MATRIX_ACP_RESOURCES[2].content }],
	}),
);

// Tier-1380 ACP: CPU & Heap profiling (Markdown)
server.resource(
	"bun-profiles-cpu-heap-md",
	"bun://profiles/cpu-heap-md",
	{ description: "CPU & Heap Profiling (Markdown) — --cpu-prof-md, --heap-prof" },
	async () => {
		const res = MATRIX_ACP_RESOURCES.find((r) => r.uri === "bun://profiles/cpu-heap-md");
		const text = res && "content" in res && typeof res.content === "string" ? res.content : "";
		return {
			contents: [{ uri: "bun://profiles/cpu-heap-md", mimeType: "text/markdown", text }],
		};
	},
);

server.tool(
	"SearchBun",
	"Search across the Bun knowledge base to find relevant information, code examples, API references, and guides.",
	{
		query: z.string().describe("Search query"),
		version: z.string().optional().describe("Filter to specific version (e.g. 1.3.6)"),
		language: z.string().optional().describe("Language code (en, zh, es)"),
		apiReferenceOnly: z.boolean().optional().describe("Only API reference docs"),
		codeOnly: z.boolean().optional().describe("Only code snippets"),
		prodSafe: z.boolean().optional().describe("Exclude experimental/deprecated (prod builds)"),
		platform: z.enum(["darwin", "linux", "win32"]).optional().describe("Filter by platform (exclude incompatible APIs)"),
	},
	async (args) => {
		const text = await searchBunDocs(args.query, {
			apiOnly: args.apiReferenceOnly,
			codeOnly: args.codeOnly,
			prodSafe: args.prodSafe,
			bunVersion: args.version,
			platform: args.platform,
		});
		return { content: [{ type: "text" as const, text }] };
	},
);

async function main(): Promise<void> {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
