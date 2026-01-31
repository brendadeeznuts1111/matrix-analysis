#!/usr/bin/env bun
/**
 * SearchBun tests — follows Bun best practices
 * @see https://bun.com/docs/test/writing-tests
 *
 * Run: bun test mcp-bun-docs/search-bun.test.ts
 */

import { describe, expect, test, spyOn, beforeEach, afterEach } from "bun:test";
import {
	searchBunDocs,
	buildDocUrl,
	getDocEntry,
	getReferenceUrl,
	getCrossReferences,
	suggestDocTerms,
	BUN_GLOBALS,
	BUN_GLOBALS_API_URL,
	BUN_REFERENCE_LINKS,
	BUN_REFERENCE_KEYS,
	BUN_DOC_MAP,
	BUN_DOC_ENTRIES,
	BUN_DOCS_BASE,
	BUN_FEEDBACK_URL,
	BUN_FEEDBACK_UPGRADE_FIRST,
	BUN_TEST_REFERENCE_URL,
	BUN_REPO_URL,
	BUN_SHOP_URL,
	BUN_BLOG_URL,
	BUN_BLOG_RSS_URL,
	BUN_GUIDES_URL,
	BUN_CHANGELOG_RSS,
	BUN_TYPES_REPO_URL,
	BUN_TYPES_README_URL,
	BUN_TYPES_AUTHORING_URL,
	BUN_TYPES_KEY_FILES,
	BUN_DOCS_MIN_VERSION,
	BINARY_PERF_METRICS,
	TEST_CONFIG_MATRIX,
	TIER_1380_COMPLIANCE,
	BUN_137_FEATURE_MATRIX,
	BUN_137_COMPLETE_MATRIX,
	filterEntriesByVersion,
	filterEntriesByStability,
	filterEntriesByPlatform,
} from "./lib.ts";

let fetchSpy: ReturnType<typeof spyOn> | null = null;

describe("SearchBun / lib", () => {
	beforeEach(() => {
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("", { status: 404 }),
		) as ReturnType<typeof spyOn>;
	});

	afterEach(() => {
		if (fetchSpy) fetchSpy.mockRestore();
	});

	describe("constants", () => {
		test("should point BUN_DOCS_BASE to bun.com", () => {
			expect(BUN_DOCS_BASE).toBe("https://bun.com/docs");
		});

		test("should set BUN_DOCS_MIN_VERSION to 1.3.6", () => {
			expect(BUN_DOCS_MIN_VERSION).toBe("1.3.6");
		});
		test("should point BUN_FEEDBACK_URL to bun.sh/docs/feedback", () => {
			expect(BUN_FEEDBACK_URL).toBe("https://bun.sh/docs/feedback");
		});
		test("should include upgrade-first guidance in BUN_FEEDBACK_UPGRADE_FIRST", () => {
			expect(BUN_FEEDBACK_UPGRADE_FIRST).toContain("bun upgrade");
			expect(BUN_FEEDBACK_UPGRADE_FIRST).toContain("search/check issues");
		});
		test("should point BUN_TEST_REFERENCE_URL to bun.com/reference/bun/test", () => {
			expect(BUN_TEST_REFERENCE_URL).toBe("https://bun.com/reference/bun/test");
		});
		test("should point BUN_REPO_URL to oven-sh/bun", () => {
			expect(BUN_REPO_URL).toBe("https://github.com/oven-sh/bun");
		});
		test("should point BUN_TYPES_REPO_URL to bun-types package", () => {
			expect(BUN_TYPES_REPO_URL).toBe("https://github.com/oven-sh/bun/tree/main/packages/bun-types");
		});
		test("should point BUN_TYPES_README_URL and BUN_TYPES_AUTHORING_URL to blob paths", () => {
			expect(BUN_TYPES_README_URL).toContain("bun-types/README.md");
			expect(BUN_TYPES_AUTHORING_URL).toContain("bun-types/authoring.md");
		});
		test("should list key bun-types .d.ts files", () => {
			expect(BUN_TYPES_KEY_FILES).toContain("index.d.ts");
			expect(BUN_TYPES_KEY_FILES).toContain("test.d.ts");
			expect(BUN_TYPES_KEY_FILES).toContain("serve.d.ts");
		});
		test("should point BUN_SHOP_URL to shop.bun.com", () => {
			expect(BUN_SHOP_URL).toBe("https://shop.bun.com/");
		});
		test("should point BUN_BLOG_URL to bun.sh/blog", () => {
			expect(BUN_BLOG_URL).toBe("https://bun.sh/blog");
		});
		test("should point BUN_BLOG_RSS_URL to bun.sh/blog/rss.xml", () => {
			expect(BUN_BLOG_RSS_URL).toBe("https://bun.sh/blog/rss.xml");
		});
		test("should point BUN_GUIDES_URL to bun.sh/guides", () => {
			expect(BUN_GUIDES_URL).toBe("https://bun.sh/guides");
		});
		test("should point BUN_CHANGELOG_RSS to bun.com/rss.xml", () => {
			expect(BUN_CHANGELOG_RSS).toBe("https://bun.com/rss.xml");
		});

		test.each([
			["fetch", "guides/http/fetch"],
			["serve", "api/http"],
			["sqlite", "api/sqlite"],
			["mcp", "mcp"],
	] as [string, string][])("should map BUN_DOC_MAP %s to %s", (term, path) => {
			expect(BUN_DOC_MAP[term]).toBe(path);
		});
	});

	describe("buildDocUrl", () => {
		test.each([
			["api/http", "https://bun.com/docs/api/http"],
			["guides/http/fetch", "https://bun.com/docs/guides/http/fetch"],
		] as [string, string][])("should append path for relative %s", (path, expected) => {
			expect(buildDocUrl(path)).toBe(expected);
		});

		test("should return absolute URL as-is", () => {
			const url = "https://example.com/x";
			expect(buildDocUrl(url)).toBe(url);
		});
	});

	describe("searchBunDocs", () => {
		// test.serial: fetch mock on globalThis — avoid concurrent interference (bun.com/docs/test/lifecycle)
		test.serial("should return markdown for known term fetch", async () => {
			expect.hasAssertions();
			const result = await searchBunDocs("fetch");
			expect(result).toContain("## Bun docs for");
			expect(result).toContain("fetch");
			expect(result).toContain("bun.com/docs");
			expect(result).toContain("guides/http/fetch");
		});

		test.serial("should return markdown for known term serve", async () => {
			expect.hasAssertions();
			const result = await searchBunDocs("serve");
			expect(result).toContain("api/http");
		});

		test.serial("should map postgres to api/sql not sqlite", async () => {
			expect.hasAssertions();
			const result = await searchBunDocs("postgres");
			expect(result).toContain("api/sql");
			expect(result).not.toContain("api/sqlite");
		});

		test.serial("should return fallback for unknown term", async () => {
			expect.hasAssertions();
			const result = await searchBunDocs("xyznonexistent123");
			expect(result).toContain("Bun Documentation");
			expect(result).toContain("Bun MCP");
			expect(result).toContain(BUN_DOCS_BASE);
		});

		test.serial("should accept empty opts", async () => {
			expect.hasAssertions();
			const result = await searchBunDocs("sqlite");
			expect(result).toContain("sqlite");
		});

		test.serial("should trim query before search", async () => {
			expect.hasAssertions();
			const result = await searchBunDocs("  fetch  ");
			expect(result).toContain("fetch");
		});

		test.serial("should exclude mcp when bunVersion filters too-new APIs", async () => {
			expect.hasAssertions();
			const result = await searchBunDocs("mcp", { bunVersion: "1.0.0" });
			expect(result).not.toContain("Bun: mcp");
		});
	});

	describe("BUN_DOC_ENTRIES", () => {
		test("should have Tier-1380 schema fields", () => {
			const e = BUN_DOC_ENTRIES[0];
			expect(e).toHaveProperty("term");
			expect(e).toHaveProperty("path");
			expect(e).toHaveProperty("bunMinVersion");
			expect(e).toHaveProperty("stability");
			expect(e).toHaveProperty("platforms");
			expect(e).toHaveProperty("security");
		});
	});

	describe("filterEntriesByVersion", () => {
		test("should hide APIs requiring newer runtime", () => {
			const filtered = filterEntriesByVersion(BUN_DOC_ENTRIES, "1.0.0");
			expect(filtered.length).toBeLessThan(BUN_DOC_ENTRIES.length);
			expect(filtered.map((e) => e.term)).toContain("fetch");
			expect(filtered.map((e) => e.term)).not.toContain("mcp");
		});
	});

	describe("filterEntriesByStability", () => {
		test("should exclude experimental for prod", () => {
			const prodSafe = filterEntriesByStability(BUN_DOC_ENTRIES, ["stable"]);
			expect(prodSafe.every((e) => e.stability === "stable")).toBe(true);
			expect(prodSafe.some((e) => e.term === "Bun.Transpiler.replMode")).toBe(false);
		});

		test("should exclude Bun.inspect.table from prod-safe", () => {
			const prodTerms = filterEntriesByStability(BUN_DOC_ENTRIES, ["stable"]).map((e) => e.term);
			expect(prodTerms).not.toContain("Bun.inspect.table");
			expect(prodTerms).not.toContain("inspect");
		});
	});

	describe("filterEntriesByPlatform", () => {
		test("should exclude darwin+linux-only on win32", () => {
			const win = filterEntriesByPlatform(BUN_DOC_ENTRIES, "win32");
			expect(win.some((e) => e.term === "password")).toBe(false);
			expect(win.some((e) => e.term === "fetch")).toBe(true);
		});
	});

	describe("BINARY_PERF_METRICS", () => {
		test("should include Buffer.swap16 and Buffer.swap64", () => {
			expect(BINARY_PERF_METRICS).toHaveLength(2);
			expect(BINARY_PERF_METRICS.map((m) => m.op)).toContain("Buffer.swap16");
			expect(BINARY_PERF_METRICS.map((m) => m.op)).toContain("Buffer.swap64");
			expect(BINARY_PERF_METRICS.find((m) => m.op === "Buffer.swap64")?.imp).toBe("3.6x");
		});
	});

	describe("BUN_DOC_MAP buffer ops", () => {
		test.each([
			["Buffer.swap16", "api/buffer"],
			["Buffer.swap64", "api/buffer"],
		] as [string, string][])("should map %s to %s", (term, path) => {
			expect(BUN_DOC_MAP[term]).toBe(path);
		});
	});

	describe("TEST_CONFIG_MATRIX", () => {
		test("should have install inheritance row", () => {
			const installRow = TEST_CONFIG_MATRIX.find((r) => r.Section === "Install");
			expect(installRow).toBeDefined();
			expect(installRow!.KeyValues).toContain("registry");
		});

		test("should have [test.ci] profile", () => {
			const ciRow = TEST_CONFIG_MATRIX.find((r) => r.Section === "[test.ci]");
			expect(ciRow).toBeDefined();
			expect(ciRow!.InheritsFrom).toBe("[test]");
		});
	});

	describe("bun test entry", () => {
		test("should map bun test to test path", () => {
			expect(BUN_DOC_MAP["bun test"]).toBe("test");
		});
	});

	describe("getDocEntry", () => {
		test("should return entry for exact term", () => {
			const e = getDocEntry("spawn");
			expect(e).not.toBeNull();
			expect(e!.term).toBe("spawn");
			expect(e!.path).toBe("api/spawn");
		});
		test("should return entry for case-insensitive term", () => {
			const e = getDocEntry("SPAWN");
			expect(e).not.toBeNull();
			expect(e!.term).toBe("spawn");
		});
		test("should return null for unknown term", () => {
			expect(getDocEntry("xyznonexistent")).toBeNull();
		});
	});

	describe("getReferenceUrl / BUN_REFERENCE_KEYS", () => {
		test("should return URL for fileAPI", () => {
			expect(getReferenceUrl("fileAPI")).toBe("https://bun.sh/docs/api/file-io");
		});
		test("should list all reference keys", () => {
			expect(BUN_REFERENCE_KEYS).toContain("fileAPI");
			expect(BUN_REFERENCE_KEYS).toContain("httpServer");
			expect(BUN_REFERENCE_KEYS).toContain("bunTest");
			expect(BUN_REFERENCE_KEYS).toContain("bunTypes");
			expect(getReferenceUrl("fileAPI")).toEqual(BUN_REFERENCE_LINKS.fileAPI);
			expect(getReferenceUrl("bunTest")).toBe(BUN_TEST_REFERENCE_URL);
			expect(getReferenceUrl("bunTypes")).toBe(BUN_TYPES_REPO_URL);
			expect(getReferenceUrl("bunTypesReadme")).toBe(BUN_TYPES_README_URL);
			expect(BUN_REFERENCE_KEYS).toContain("bunApis");
			expect(BUN_REFERENCE_KEYS).toContain("webApis");
			expect(BUN_REFERENCE_KEYS).toContain("nodeApi");
			expect(BUN_REFERENCE_KEYS).toContain("shop");
			expect(BUN_REFERENCE_KEYS).toContain("blog");
			expect(BUN_REFERENCE_KEYS).toContain("guides");
			expect(BUN_REFERENCE_KEYS).toContain("blogRss");
			expect(BUN_REFERENCE_KEYS).toContain("changelogRss");
			expect(getReferenceUrl("shop")).toBe(BUN_SHOP_URL);
			expect(getReferenceUrl("blog")).toBe(BUN_BLOG_URL);
			expect(getReferenceUrl("guides")).toBe(BUN_GUIDES_URL);
			expect(getReferenceUrl("blogRss")).toBe(BUN_BLOG_RSS_URL);
			expect(getReferenceUrl("changelogRss")).toBe(BUN_CHANGELOG_RSS);
		});
	});

	describe("BUN_GLOBALS / getCrossReferences", () => {
		test("should include Bun, $, fetch, Buffer in BUN_GLOBALS", () => {
			const names = BUN_GLOBALS.map((g) => g.name);
			expect(names).toContain("Bun");
			expect(names).toContain("$");
			expect(names).toContain("fetch");
			expect(names).toContain("Buffer");
		});
		test("should point BUN_GLOBALS_API_URL to api/globals", () => {
			expect(BUN_GLOBALS_API_URL).toBe("https://bun.sh/docs/api/globals");
		});
		test("should return cross-refs for spawn (subprocess, shell)", () => {
			const xrefs = getCrossReferences("spawn");
			expect(xrefs.length).toBeGreaterThan(0);
			expect(xrefs.map((x) => x.term)).toContain("subprocess");
			expect(xrefs.map((x) => x.term)).toContain("shell");
		});
		test("should return cross-refs for Bun.serve (serve, fetch)", () => {
			const xrefs = getCrossReferences("Bun.serve");
			expect(xrefs.map((x) => x.term)).toContain("serve");
			expect(xrefs.map((x) => x.term)).toContain("fetch");
		});
		test("should return empty array for term with no relatedTerms", () => {
			const xrefs = getCrossReferences("env");
			expect(Array.isArray(xrefs)).toBe(true);
		});
	});

	describe("suggestDocTerms", () => {
		test("should return matches for partial query", () => {
			const results = suggestDocTerms("spawn");
			expect(results.length).toBeGreaterThan(0);
			expect(results.map((r) => r.term)).toContain("spawn");
			expect(results[0]).toHaveProperty("url");
			expect(results[0]).toHaveProperty("stability");
		});
		test("should respect limit", () => {
			const results = suggestDocTerms("Bun", 3);
			expect(results.length).toBeLessThanOrEqual(3);
		});
		test("should return empty for empty query", () => {
			expect(suggestDocTerms("")).toEqual([]);
			expect(suggestDocTerms("   ")).toEqual([]);
		});
	});

	describe("TIER_1380_COMPLIANCE", () => {
		test("should document Transpiler.replMode Col 93 and maxHeaders", () => {
			const items = TIER_1380_COMPLIANCE.map((r) => r.Item);
			expect(items).toContain("Transpiler.replMode");
			expect(items).toContain("http.maxHeaders 200");
		});
	});

	describe("BUN_137_FEATURE_MATRIX", () => {
		test("should include S3.presign and String.isWellFormed", () => {
			const terms = BUN_137_FEATURE_MATRIX.map((r) => r.Term);
			expect(terms).toContain("S3.presign");
			expect(terms).toContain("String.isWellFormed");
		});
		test("should have 7 v1.3.7 features", () => {
			expect(BUN_137_FEATURE_MATRIX).toHaveLength(7);
		});
	});

	describe("BUN_137_COMPLETE_MATRIX", () => {
		test("should include Buffer.from and Bun.wrapAnsi", () => {
			const terms = BUN_137_COMPLETE_MATRIX.map((r) => r.Term);
			expect(terms).toContain("Buffer.from");
			expect(terms).toContain("Bun.wrapAnsi");
		});
		test("should have 20 complete matrix rows (v1.3.7 catalog)", () => {
			expect(BUN_137_COMPLETE_MATRIX.length).toBeGreaterThanOrEqual(18);
		});
	});

	describe("v1.3.7 BUN_DOC_ENTRIES", () => {
		test("should map S3File.presign to api/s3", () => {
			expect(BUN_DOC_MAP["S3File.presign"]).toBe("api/s3");
		});
		test("should map node:inspector to api/node-inspector", () => {
			expect(BUN_DOC_MAP["node:inspector"]).toBe("api/node-inspector");
		});
	});
});
