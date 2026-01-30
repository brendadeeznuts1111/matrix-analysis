#!/usr/bin/env bun
/**
 * Bun MCP matrix view - consts, types, patterns
 * @col_93 balanced_braces (skills) - code blocks have balanced braces/brackets/parens
 * Run: bun mcp-bun-docs/matrix-view.ts
 */

import {
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
	filterEntriesByVersion,
	filterEntriesByStability,
} from "./lib.ts";
import { MCP_MANIFEST_URL } from "../bun-mcp-manifest.ts";

const lastUpdated = new Date().toISOString().slice(0, 10);

// Const variables (Version in own column)
const consts = [
	{ Const: "BUN_DOCS_BASE", Value: BUN_DOCS_BASE, Version: "-", Module: "lib.ts", Purpose: "Base URL for doc links" },
	{ Const: "MCP_MANIFEST_URL", Value: MCP_MANIFEST_URL, Version: "-", Module: "bun-mcp-manifest.ts", Purpose: "Manifest fetch endpoint" },
	{ Const: "BUN_DOCS_VERSION", Value: BUN_DOCS_VERSION, Version: BUN_DOCS_VERSION, Module: "lib.ts", Purpose: "Version pinning" },
	{ Const: "BUN_DOCS_MIN_VERSION", Value: BUN_DOCS_MIN_VERSION, Version: BUN_DOCS_MIN_VERSION, Module: "lib.ts", Purpose: "Minimum supported version" },
	{ Const: "BUN_CHANGELOG_RSS", Value: BUN_CHANGELOG_RSS, Version: "-", Module: "lib.ts", Purpose: "Tier-1380 auto-sync RSS" },
	{ Const: "LastUpdated", Value: lastUpdated, Version: "-", Module: "matrix-view", Purpose: "Matrix snapshot date" },
];

// BUN_DOC_MAP entries (curated term → path)
const docMapRows = Object.entries(BUN_DOC_MAP).map(([Term, Path]) => ({
	Term,
	Path,
	FullURL: `${BUN_DOCS_BASE}/${Path}`,
}));

// Types
const types = [
	{ Type: "SearchResult", Fields: "title, url, snippet?", Module: "lib.ts" },
	{ Type: "BunDocEntry", Fields: "term, path, bunMinVersion, stability, platforms, security, relatedTerms?", Module: "lib.ts" },
	{ Type: "SearchBunSchema", Fields: "type, properties, required", Module: "bun-mcp-manifest.ts" },
	{ Type: "SearchBunTool", Fields: "name, description, inputSchema, operationId", Module: "bun-mcp-manifest.ts" },
	{ Type: "MCPManifest", Fields: "server, capabilities.tools, resources, prompts", Module: "bun-mcp-manifest.ts" },
];

// Tier-1380 Matrix v2: traceability sample (stability + version filter demo)
const prodSafe = filterEntriesByStability(filterEntriesByVersion(BUN_DOC_ENTRIES, BUN_DOCS_VERSION), ["stable"]);
const experimentalOnly = BUN_DOC_ENTRIES.filter((e) => e.stability === "experimental");
const v2Sample = [
	...BUN_DOC_ENTRIES.slice(0, 4).map((e) => ({
		Term: e.term,
		bunMinVersion: e.bunMinVersion,
		Stability: e.stability,
		Platforms: e.platforms.join(","),
		Security: e.security.classification,
		Related: (e.relatedTerms ?? []).slice(0, 2).join(", ") || "-",
	})),
	{ Term: "...", bunMinVersion: "-", Stability: "-", Platforms: "-", Security: "-", Related: `${BUN_DOC_ENTRIES.length} total` },
];

// Search URL patterns
const patterns = [
	{ Pattern: "Mintlify search", URL: "https://bun.com/api/search?q=...", Purpose: "Primary search attempt" },
	{ Pattern: "Alt search", URL: "https://bun.com/search?q=...", Purpose: "Fallback search" },
	{ Pattern: "Doc path", URL: "BUN_DOCS_BASE + path", Purpose: "Curated map resolution" },
	{ Pattern: "Default fallback", URL: "BUN_DOCS_BASE, BUN_DOCS_BASE/mcp", Purpose: "Unknown query fallback" },
];

// Search weights (HTTP bias)
const weightRows = Object.entries(SEARCH_WEIGHTS).map(([Term, Weight]) => ({
	Term,
	Weight,
	Purpose: Weight >= 2 ? "High (80% query hit)" : "Normal",
}));

// SearchBun input params
const searchParams = [
	{ Param: "query", Type: "string", Required: "yes", Purpose: "Search terms" },
	{ Param: "version", Type: "string", Required: "no", Purpose: "Filter by Bun version" },
	{ Param: "language", Type: "string", Required: "no", Purpose: "Language code (en, zh, es)" },
	{ Param: "apiReferenceOnly", Type: "boolean", Required: "no", Purpose: "Only API reference docs" },
	{ Param: "codeOnly", Type: "boolean", Required: "no", Purpose: "Only code snippets" },
];

console.log("\n🔷 Bun MCP Matrix View\n");
console.log("═══ Const Variables ═══\n");
console.log(Bun.inspect.table(consts, ["Const", "Value", "Version", "Module", "Purpose"]));
console.log("\n═══ BUN_DOC_MAP (Curated Terms) ═══\n");
console.log(Bun.inspect.table(docMapRows, ["Term", "Path", "FullURL"]));
console.log("\n═══ Types ═══\n");
console.log(Bun.inspect.table(types));
console.log("\n═══ Tier-1380 Matrix v2 (Traceability Sample) ═══\n");
console.log(Bun.inspect.table(v2Sample, ["Term", "bunMinVersion", "Stability", "Platforms", "Security", "Related"]));
console.log(`\n  Prod-safe (stable + version≤${BUN_DOCS_VERSION}): ${prodSafe.length} | Experimental: ${experimentalOnly.length}\n`);

// Tier-1380 Binary Ops — Col 93 alignment
const binaryRows = BINARY_PERF_METRICS.map((r) => ({
	Term: r.op,
	MinVer: "1.3.8",
	"Perf Gain": r.imp,
	"Use Case": r.use,
	Security: r.op === "Buffer.swap16" ? "Side-channel safe" : "Constant-time intrinsics",
}));
console.log("\n═══ Tier-1380 Binary Ops (Col 93) ═══\n");
console.log(Bun.inspect.table(binaryRows, ["Term", "MinVer", "Perf Gain", "Use Case", "Security"]));

console.log("\n═══ Bun v1.3.7 Feature Matrix (Tier-1380) ═══\n");
console.log(Bun.inspect.table(BUN_137_FEATURE_MATRIX, ["Term", "Ver", "PerfGain", "Security", "Platforms", "Status"]));

console.log("\n═══ Bun v1.3.7 Complete Matrix (28 entries) ═══\n");
console.log(Bun.inspect.table(BUN_137_COMPLETE_MATRIX, ["Category", "Term", "PerfFeature", "SecurityPlatform"]));

console.log("\n═══ Tier-1380 Compliance (Col 93 / GB9c) ═══\n");
console.log(Bun.inspect.table(TIER_1380_COMPLIANCE, ["Item", "Note", "Scope"]));

console.log("\n═══ Tier-1380 Test Config Inheritance ═══\n");
console.log(Bun.inspect.table(TEST_CONFIG_MATRIX, ["Section", "InheritsFrom", "KeyValues", "SecurityScope"]));

console.log("\n═══ URL Patterns ═══\n");
console.log(Bun.inspect.table(patterns));
console.log("\n═══ Search Weights (HTTP Bias) ═══\n");
console.log(Bun.inspect.table(weightRows));
console.log("\n═══ SearchBun Parameters ═══\n");
console.log(Bun.inspect.table(searchParams));
