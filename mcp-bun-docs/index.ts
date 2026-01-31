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
	getDocEntry,
	buildDocUrl,
	getCrossReferences,
	suggestDocTerms,
	BUN_GLOBALS,
	BUN_GLOBALS_API_URL,
	BUN_REFERENCE_LINKS,
	BUN_REFERENCE_KEYS,
	BUN_FEEDBACK_URL,
	BUN_FEEDBACK_UPGRADE_FIRST,
	BUN_TYPES_REPO_URL,
	BUN_TYPES_README_URL,
	BUN_TYPES_AUTHORING_URL,
	BUN_TYPES_KEY_FILES,
	BUN_DOC_ENTRIES,
	BUN_DOC_MAP,
	BUN_DOCS_BASE,
	BUN_DOCS_VERSION,
	BUN_DOCS_MIN_VERSION,
	BUN_CHANGELOG_RSS,
	BUN_SHOP_URL,
	BUN_BLOG_URL,
	BUN_BLOG_RSS_URL,
	BUN_GUIDES_URL,
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

server.tool(
	"GetBunDocEntry",
	"Resolve a curated Bun doc entry by term (e.g. spawn, Bun.serve). Returns path, version, stability, platforms, security. Use urlOnly to get just the doc URL.",
	{
		term: z.string().describe("Curated term (e.g. spawn, Bun.serve, S3File.presign)"),
		urlOnly: z.boolean().optional().describe("If true, return only the doc URL"),
	},
	async (args) => {
		const entry = getDocEntry(args.term);
		if (!entry) {
			return {
				content: [{ type: "text" as const, text: `No curated entry for term: ${args.term}` }],
				isError: true,
			};
		}
		if (args.urlOnly) {
			return { content: [{ type: "text" as const, text: buildDocUrl(entry.path) }] };
		}
		return {
			content: [{ type: "text" as const, text: JSON.stringify({ ...entry, url: buildDocUrl(entry.path) }, null, 2) }],
		};
	},
);

server.tool(
	"ListBunGlobals",
	"List Bun top-level globals (Bun, $, fetch, Buffer, process, Bun.file, Bun.serve, …) with doc paths and the Bun.* API doc URL.",
	{},
	async () => {
		const lines = BUN_GLOBALS.map((g) => `${g.name}\t${buildDocUrl(g.path)}\t${g.description}`);
		const text = `Bun globals:\n${lines.map((l) => `  ${l}`).join("\n")}\n\nBun.* API: ${BUN_GLOBALS_API_URL}`;
		return { content: [{ type: "text" as const, text }] };
	},
);

server.tool(
	"GetBunDocCrossReferences",
	"Get cross-references for a Bun doc term: related doc entries with URLs (from relatedTerms on the curated entry).",
	{ term: z.string().describe("Curated term (e.g. spawn, Bun.serve, buffer)") },
	async (args) => {
		const xrefs = getCrossReferences(args.term);
		const entry = getDocEntry(args.term);
		const out: { term: string; url?: string; crossReferences: { term: string; url: string }[] } = {
			term: args.term,
			crossReferences: xrefs.map((x) => ({ term: x.term, url: x.url })),
		};
		if (entry) out.url = buildDocUrl(entry.path);
		return { content: [{ type: "text" as const, text: JSON.stringify(out, null, 2) }] };
	},
);

server.tool(
	"ListBunReferenceLinks",
	"List all deep-dive reference link keys and URLs (fileAPI, httpServer, shell, test, bunTest, bunTypes, bunApis, webApis, nodeApi, etc.).",
	{},
	async () => {
		const links = Object.fromEntries(BUN_REFERENCE_KEYS.map((k) => [k, BUN_REFERENCE_LINKS[k]]));
		return { content: [{ type: "text" as const, text: JSON.stringify(links, null, 2) }] };
	},
);

server.tool(
	"GetBunFeedback",
	"Return Bun feedback/reporting guidance: upgrade first (bun upgrade / bun upgrade --canary), then search issues. Includes docs URL.",
	{},
	async () => {
		const text = `${BUN_FEEDBACK_UPGRADE_FIRST}\n\nDocs: ${BUN_FEEDBACK_URL}`;
		return { content: [{ type: "text" as const, text }] };
	},
);

server.tool(
	"GetBunTypesInfo",
	"Return oven-sh/bun-types package info: repo URL, README, authoring guide, and key .d.ts files with raw GitHub blob URLs.",
	{},
	async () => {
		const base = "https://github.com/oven-sh/bun/blob/main/packages/bun-types";
		const keyFileUrls = Object.fromEntries(
			BUN_TYPES_KEY_FILES.map((f) => [f, `${base}/${f}`]),
		);
		const out = {
			repo: BUN_TYPES_REPO_URL,
			readme: BUN_TYPES_README_URL,
			authoring: BUN_TYPES_AUTHORING_URL,
			keyFiles: keyFileUrls,
		};
		return { content: [{ type: "text" as const, text: JSON.stringify(out, null, 2) }] };
	},
);

server.tool(
	"SuggestBunDocTerms",
	"Suggest curated doc terms by partial match (case-insensitive). Returns term, path, url, stability; sorted by weight. Use for typeahead or discovery.",
	{
		query: z.string().describe("Partial term (e.g. spawn, buffer, serve)"),
		limit: z.number().optional().describe("Max results (default 10)"),
	},
	async (args) => {
		const results = suggestDocTerms(args.query, args.limit ?? 10);
		return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
	},
);

// ─── Resources: reference-links, feedback, bun-types ───────────────────────
server.resource(
	"bun-docs-reference-links",
	"bun://docs/reference-links",
	{ description: "All Bun reference link keys and URLs (fileAPI, bunTest, bunTypes, bunApis, etc.)" },
	async () => ({
		contents: [{
			uri: "bun://docs/reference-links",
			mimeType: "application/json",
			text: JSON.stringify(Object.fromEntries(BUN_REFERENCE_KEYS.map((k) => [k, BUN_REFERENCE_LINKS[k]])), null, 2),
		}],
	}),
);

server.resource(
	"bun-docs-feedback",
	"bun://docs/feedback",
	{ description: "Bun feedback/upgrade-first guidance and docs URL" },
	async () => ({
		contents: [{
			uri: "bun://docs/feedback",
			mimeType: "text/plain",
			text: `${BUN_FEEDBACK_UPGRADE_FIRST}\n\nDocs: ${BUN_FEEDBACK_URL}`,
		}],
	}),
);

server.resource(
	"bun-docs-bun-types",
	"bun://docs/bun-types",
	{ description: "oven-sh/bun-types: repo, README, authoring, key .d.ts file URLs" },
	async () => {
		const base = "https://github.com/oven-sh/bun/blob/main/packages/bun-types";
		const keyFileUrls = Object.fromEntries(BUN_TYPES_KEY_FILES.map((f) => [f, `${base}/${f}`]));
		const text = JSON.stringify({
			repo: BUN_TYPES_REPO_URL,
			readme: BUN_TYPES_README_URL,
			authoring: BUN_TYPES_AUTHORING_URL,
			keyFiles: keyFileUrls,
		}, null, 2);
		return {
			contents: [{ uri: "bun://docs/bun-types", mimeType: "application/json", text }],
		};
	},
);

// ─── GetBunLinks: shop, blog, guides, RSS ───────────────────────────────────
server.tool(
	"GetBunLinks",
	"Return official Bun links: shop (merchandise), blog, guides index, and RSS feeds (changelog + blog, blog supports #tag= filter).",
	{},
	async () => {
		const out = {
			shop: BUN_SHOP_URL,
			blog: BUN_BLOG_URL,
			guides: BUN_GUIDES_URL,
			rss: { changelog: BUN_CHANGELOG_RSS, blog: BUN_BLOG_RSS_URL },
		};
		return { content: [{ type: "text" as const, text: JSON.stringify(out, null, 2) }] };
	},
);

server.resource(
	"bun-docs-links",
	"bun://docs/links",
	{ description: "Bun shop, blog, guides, and RSS feeds (changelog + blog)" },
	async () => ({
		contents: [{
			uri: "bun://docs/links",
			mimeType: "application/json",
			text: JSON.stringify({
				shop: BUN_SHOP_URL,
				blog: BUN_BLOG_URL,
				guides: BUN_GUIDES_URL,
				rss: { changelog: BUN_CHANGELOG_RSS, blog: BUN_BLOG_RSS_URL },
			}, null, 2),
		}],
	}),
);

async function main(): Promise<void> {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
