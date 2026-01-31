/**
 * SearchBun core logic - exported for testing and programmatic use.
 * @col_93 balanced_braces (skills) - code blocks have balanced braces/brackets/parens
 */

export const BUN_DOCS_BASE = "https://bun.com/docs";
export const BUN_DOCS_VERSION = "1.3.7";
export const BUN_DOCS_MIN_VERSION = "1.3.6";
/** Official Bun changelog/release RSS: https://bun.com/rss.xml */
export const BUN_CHANGELOG_RSS = "https://bun.com/rss.xml";

/** Official Bun shop (merchandise). https://shop.bun.com */
export const BUN_SHOP_URL = "https://shop.bun.com/";

/** Bun blog (announcements, deep dives). https://bun.sh/blog */
export const BUN_BLOG_URL = "https://bun.sh/blog";

/** Bun blog RSS (optional #tag= for filtered feeds, e.g. #tag=sqlite). https://bun.sh/blog/rss.xml */
export const BUN_BLOG_RSS_URL = "https://bun.sh/blog/rss.xml";

/** Bun guides index (deployment, frameworks, utilities). https://bun.sh/guides */
export const BUN_GUIDES_URL = "https://bun.sh/guides";

/** Bun feedback/reporting: upgrade first, then search issues. https://bun.sh/docs/feedback */
export const BUN_FEEDBACK_URL = "https://bun.sh/docs/feedback";

/** Short guidance for reporting issues (from official docs). */
export const BUN_FEEDBACK_UPGRADE_FIRST =
	"Upgrade first (bun upgrade, or bun upgrade --canary), then search/check issues and discussions before opening a new one.";

/** bun:test API reference (describe, expect, test, mock, spyOn, etc.). https://bun.com/reference/bun/test */
export const BUN_TEST_REFERENCE_URL = "https://bun.com/reference/bun/test";

/** oven-sh/bun repository (main). https://github.com/oven-sh/bun */
export const BUN_REPO_URL = "https://github.com/oven-sh/bun";

/** Bun TypeScript types package in oven-sh/bun. https://github.com/oven-sh/bun/tree/main/packages/bun-types */
export const BUN_TYPES_REPO_URL = "https://github.com/oven-sh/bun/tree/main/packages/bun-types";

/** bun-types README (usage, npm install). https://github.com/oven-sh/bun/blob/main/packages/bun-types/README.md */
export const BUN_TYPES_README_URL = "https://github.com/oven-sh/bun/blob/main/packages/bun-types/README.md";

/** bun-types authoring guide for contributors. https://github.com/oven-sh/bun/blob/main/packages/bun-types/authoring.md */
export const BUN_TYPES_AUTHORING_URL = "https://github.com/oven-sh/bun/blob/main/packages/bun-types/authoring.md";

/** Key .d.ts files in bun-types (for tooling / deep links). */
export const BUN_TYPES_KEY_FILES = [
	"index.d.ts",
	"bun.d.ts",
	"globals.d.ts",
	"test.d.ts",
	"serve.d.ts",
	"fetch.d.ts",
	"sql.d.ts",
	"s3.d.ts",
	"shell.d.ts",
] as const;

/** Quick reference links for deep-dive documentation */
export const BUN_REFERENCE_LINKS = {
	fileAPI: "https://bun.sh/docs/api/file-io",
	httpServer: "https://bun.sh/docs/api/http",
	shell: "https://bun.sh/docs/runtime/shell",
	password: "https://bun.sh/docs/api/hashing",
	json: "https://bun.sh/docs/api/utils#bun-json5-bun-jsonl",
	/** CLI test guide (bun test, --timeout, --bail, etc.) */
	test: "https://bun.sh/docs/cli/test",
	/** bun:test module API reference (describe, expect, test, mock, spyOn) */
	bunTest: "https://bun.com/reference/bun/test",
	/** oven-sh/bun repo — bun-types package (TypeScript definitions) */
	bunTypes: "https://github.com/oven-sh/bun/tree/main/packages/bun-types",
	/** bun-types README */
	bunTypesReadme: "https://github.com/oven-sh/bun/blob/main/packages/bun-types/README.md",
	/** bun-types authoring guide */
	bunTypesAuthoring: "https://github.com/oven-sh/bun/blob/main/packages/bun-types/authoring.md",
	/** Runtime: Bun APIs */
	bunApis: "https://bun.sh/docs/runtime/bun-apis",
	/** Runtime: Web APIs */
	webApis: "https://bun.sh/docs/runtime/web-apis",
	/** Runtime: Node-API */
	nodeApi: "https://bun.sh/docs/runtime/node-api",
	apiIndex: "https://bun.sh/docs/api/index",
	color: "https://bun.sh/docs/runtime/color",
	/** Official merchandise shop */
	shop: "https://shop.bun.com/",
	/** Blog (announcements, deep dives) */
	blog: "https://bun.sh/blog",
	/** Blog RSS (use #tag= for filtered feeds) */
	blogRss: "https://bun.sh/blog/rss.xml",
	/** Changelog/release RSS */
	changelogRss: "https://bun.com/rss.xml",
	/** Guides index (deployment, frameworks, utilities) */
	guides: "https://bun.sh/guides",
} as const;

/** Tier-1380 Matrix v2: traceability schema for ACP filtering & CI gating */
export type SemVer = `${number}.${number}.${number}`;
export type Stability = "experimental" | "stable" | "deprecated";
export type Platform = "darwin" | "linux" | "win32";
export type SecurityClass = "critical" | "high" | "medium" | "low";

export type DocCategory = "storage" | "runtime" | "bundler" | "network" | "cli" | "internals";

export interface BunDocEntry {
	term: string;
	path: string;
	bunMinVersion: SemVer;
	stability: Stability;
	platforms: Platform[];
	changelogFeed?: string;
	perfProfile?: { opsSec: number; baseline: string };
	security: { classification: SecurityClass; requiresRoot?: boolean; notes?: string; zeroTrustEnforced?: boolean };
	cliFlags?: string[];
	breakingChanges?: SemVer[];
	relatedTerms?: string[];
	useCases?: string[];
	/** v1.3.7+ optional metadata */
	category?: DocCategory;
	newParams?: string[];
	methods?: string[];
	features?: string[];
	default?: number;
	support?: string[];
	implementation?: string;
}

/** Default security for most APIs */
const SEC_IO: BunDocEntry["security"] = { classification: "low" };
const SEC_NET: BunDocEntry["security"] = { classification: "medium" };
const SEC_CRYPTO: BunDocEntry["security"] = { classification: "high" };

/** Seed Col 93: Tier-1380 traceability fields for filtering & CI */
export const BUN_DOC_ENTRIES: BunDocEntry[] = [
	{ term: "fetch", path: "guides/http/fetch", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, perfProfile: { opsSec: 0, baseline: "~2x Node fetch" }, relatedTerms: ["Bun.file", "fetch.preconnect"] },
	{ term: "serve", path: "api/http", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, relatedTerms: ["fetch", "Bun.serve"] },
	{ term: "Bun.serve", path: "api/http", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, relatedTerms: ["serve", "fetch"] },
	{ term: "file", path: "api/file-io", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["Bun.file", "Bun.write"] },
	{ term: "Bun.file", path: "api/file-io", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["file", "Bun.write"] },
	{ term: "sqlite", path: "api/sqlite", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "better-sqlite3 perf, native" }, relatedTerms: ["sql", "Database"] },
	{ term: "sql", path: "api/sqlite", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["sqlite", "postgres"] },
	{ term: "test", path: "test", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["bun:test"] },
	{ term: "bun:test", path: "test", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["test"] },
	{ term: "bun test", path: "test", bunMinVersion: "1.3.8", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { classification: "high", notes: "Inherits install auth for private registry" }, perfProfile: { opsSec: 0, baseline: "<1ms TOML parse" }, useCases: ["config inheritance", "env isolation", "conditional profiles"], relatedTerms: ["bunfig.toml", "bun pm install", "bun:test"] },
	{ term: "build", path: "bundler", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["bundler"] },
	{ term: "bundler", path: "bundler", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["build", "transpiler"] },
	{ term: "install", path: "pm/cli/install", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["package manager"] },
	{ term: "package manager", path: "pm/cli/install", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["install"] },
	{ term: "password", path: "api/password", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux"], security: SEC_CRYPTO, relatedTerms: ["hash", "Bun.password"] },
	{ term: "hash", path: "api/password", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux"], security: SEC_CRYPTO, relatedTerms: ["password"] },
	{ term: "secrets", path: "api/secrets", bunMinVersion: "1.1.0", stability: "stable", platforms: ["darwin", "linux"], security: SEC_CRYPTO, relatedTerms: ["Bun.secrets"] },
	{ term: "s3", path: "api/s3", bunMinVersion: "1.2.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, relatedTerms: ["s3.file", "s3.write"] },
	{ term: "dns", path: "api/dns", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, relatedTerms: ["fetch", "dns.prefetch"] },
	{ term: "shell", path: "api/shell", bunMinVersion: "1.1.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, cliFlags: ["--shell"], relatedTerms: ["spawn"] },
	{ term: "spawn", path: "api/spawn", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["subprocess", "shell"] },
	{ term: "subprocess", path: "api/spawn", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["spawn"] },
	{ term: "env", path: "api/env", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO },
	{ term: "transpiler", path: "bundler/transpiler", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["typescript"] },
	{ term: "typescript", path: "bundler/transpiler", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["transpiler"] },
	{ term: "json", path: "api/json", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["Bun.JSONL", "Bun.JSON5"] },
	{ term: "postgres", path: "api/sql", bunMinVersion: "1.1.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, perfProfile: { opsSec: 0, baseline: "7.9x vs pg (Bun blog)" }, breakingChanges: ["1.1.0"], relatedTerms: ["mysql", "sql"] },
	{ term: "mysql", path: "api/sql", bunMinVersion: "1.1.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, relatedTerms: ["postgres", "sql"] },
	{ term: "mcp", path: "mcp", bunMinVersion: "1.3.6", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO },
	{ term: "inspect", path: "api/util", bunMinVersion: "1.2.0", stability: "experimental", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["Bun.inspect.table"] },
	{ term: "Bun.inspect.table", path: "api/util", bunMinVersion: "1.2.0", stability: "experimental", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["inspect"] },
	{ term: "buffer", path: "api/buffer", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, relatedTerms: ["Buffer.swap16", "Buffer.swap64"] },
	{ term: "Buffer.swap16", path: "api/buffer", bunMinVersion: "1.3.8", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { ...SEC_NET, notes: "Side-channel safe" }, perfProfile: { opsSec: 0, baseline: "1.8x (0.56µs vs 1.00µs) - 64KB swap" }, useCases: ["UTF-16 endianness", "Network protocols", "Binary serialization"], relatedTerms: ["Buffer.swap64"] },
	{ term: "Buffer.swap64", path: "api/buffer", bunMinVersion: "1.3.8", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { ...SEC_NET, notes: "Constant-time intrinsics" }, perfProfile: { opsSec: 0, baseline: "3.6x (0.56µs vs 2.02µs) - 64KB swap" }, useCases: ["64-bit hash reversal", "Redis protocol", "Native interop"], relatedTerms: ["Buffer.swap16"] },
	{ term: "Buffer.indexOf", path: "api/buffer", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "up to 2x faster (SIMD)" }, implementation: "SIMD-optimized search", methods: ["indexOf", "includes"], useCases: ["Large buffer pattern search", "Single/multi-byte needles"], relatedTerms: ["Buffer.includes", "buffer"], category: "runtime" },
	{ term: "Buffer.includes", path: "api/buffer", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "3.25s→1.42s (.includes false, 44KB)" }, implementation: "SIMD-optimized search", useCases: ["Pattern presence check", "Binary scanning"], relatedTerms: ["Buffer.indexOf", "buffer"], category: "runtime" },
	// v1.3.7 Feature Matrix — Tier-1380 (spec-complete)
	{ term: "S3File.presign", path: "api/s3", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { classification: "critical", notes: "Presigned URL expiration + contentDisposition injection protection", zeroTrustEnforced: true }, perfProfile: { opsSec: 0, baseline: "<0.1ms signature" }, newParams: ["contentDisposition", "type"], useCases: ["Secure downloads", "PDF reporting", "Attachment forcing"], relatedTerms: ["s3", "s3.file"], category: "storage" },
	{ term: "node:inspector", path: "api/node-inspector", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux"], security: { classification: "high", requiresRoot: false, notes: "CDP Profiler.enable gated by --inspect flag" }, perfProfile: { opsSec: 0, baseline: "<3% CPU impact" }, methods: ["Profiler.enable", "Profiler.start", "Profiler.stop", "setSamplingInterval"], relatedTerms: ["--inspect"], category: "runtime" },
	{ term: "Bun.Transpiler.replMode", path: "api/transpiler", bunMinVersion: "1.3.7", stability: "experimental", platforms: ["darwin", "linux", "win32"], security: { classification: "medium", notes: "vm.runInContext isolation required" }, perfProfile: { opsSec: 0, baseline: "50KB/ms" }, features: ["Variable hoisting", "const→let", "Top-level await", "Object literal detection"], relatedTerms: ["transpiler"], category: "bundler" },
	{ term: "http.maxHeaders", path: "api/http", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { classification: "medium", notes: "DoS protection limit doubled" }, perfProfile: { opsSec: 0, baseline: "100→200 headers, 0.2µs/header" }, default: 200, relatedTerms: ["serve", "Bun.serve"], category: "network" },
	{ term: "WebSocket.credentials", path: "api/websocket", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { classification: "critical", notes: "URL credential extraction + Authorization header precedence", zeroTrustEnforced: true }, support: ["ws://user:pass@host", "Basic Auth auto-encoding"], relatedTerms: ["WebSocket"], category: "network" },
	{ term: "String.isWellFormed", path: "api/string", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "5.4x (simdutf)" }, implementation: "WebKit C++ + simdutf", useCases: ["UTF-16 validation"], relatedTerms: ["String.toWellFormed"], category: "runtime" },
	{ term: "RegExp[Symbol.matchAll]", path: "api/regexp", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "C++ reimplementation" }, relatedTerms: ["RegExp", "matchAll"], category: "runtime" },
	// v1.3.7 Complete Catalog — Tier-1380 (28 entries)
	{ term: "Buffer.from", path: "api/buffer", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "50% faster (8 elems)" }, implementation: "JSC bulk copy + array detection", relatedTerms: ["buffer", "Buffer"], category: "runtime" },
	{ term: "Bun.wrapAnsi", path: "api/terminal", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "88x vs wrap-ansi" }, features: ["OSC 8 hyperlinks", "Full-width Unicode", "GB9c compliant"], relatedTerms: ["Bun.stripANsi"], category: "runtime" },
	{ term: "Bun.JSON5", path: "api/json5", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, features: ["Comments", "Trailing commas", "Unquoted keys", "Hex numbers"], useCases: ["Chromium config", "Next.js", "Babel", "WebStorm"], relatedTerms: ["json", "Bun.JSONL"], category: "runtime" },
	{ term: "Bun.JSONL", path: "api/jsonl", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "C++ JSC engine" }, methods: ["parse", "parseChunk"], relatedTerms: ["json", "Bun.JSON5"], category: "runtime" },
	{ term: "--cpu-prof-md", path: "cli/cpu-prof", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux"], security: SEC_IO, useCases: ["Markdown profiles", "GitHub/LLM compatible"], cliFlags: ["--cpu-prof-md"], relatedTerms: ["--heap-prof"], category: "cli" },
	{ term: "--heap-prof", path: "cli/heap-prof", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, support: ["Chrome DevTools", "Markdown (CLI grep)"], cliFlags: ["--heap-prof"], relatedTerms: ["--cpu-prof-md"], category: "cli" },
	// Reference documentation deep-dives
	{ term: "File API", path: "api/file-io", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, useCases: ["File I/O", "Streams", "BunFile operations"], relatedTerms: ["Bun.file", "Bun.write", "file"], category: "storage" },
	{ term: "HTTP Server patterns", path: "api/http", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, useCases: ["Bun.serve", "WebSockets", "SSE"], relatedTerms: ["serve", "Bun.serve", "fetch"], category: "network" },
	{ term: "Shell scripting", path: "runtime/shell", bunMinVersion: "1.1.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, useCases: ["Command execution", "Pipes", "Shell scripts"], relatedTerms: ["$", "spawn", "shell"], category: "runtime" },
	{ term: "Password hashing", path: "api/hashing", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux"], security: SEC_CRYPTO, useCases: ["Argon2id", "bcrypt", "Password verification"], relatedTerms: ["password", "hash", "Bun.password"], category: "runtime" },
	{ term: "JSON5 parsing", path: "api/utils#bun-json5-bun-jsonl", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, useCases: ["JSON with comments", "Trailing commas", "JSONL streams"], relatedTerms: ["Bun.JSON5", "Bun.JSONL", "json"], category: "runtime" },
	{ term: "Test runner guide", path: "cli/test", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, useCases: ["bun:test", "Matchers", "Mocks", "Snapshots"], relatedTerms: ["test", "bun:test", "bun test"], category: "cli" },
	{ term: "API index", path: "api/index", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, useCases: ["Complete API reference", "All Bun APIs"], relatedTerms: ["documentation", "reference"], category: "runtime" },
	{ term: "Bun.color", path: "runtime/color", bunMinVersion: "1.0.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, useCases: ["HSL/RGB/Hex conversion", "hex/hex8/number/rgb/rgba/hsl", "ansi-16/ansi-256/ansi-16m"], relatedTerms: ["color", "hex", "ansi"], category: "runtime" },
	{ term: "fetch.headerCasing", path: "api/fetch", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, useCases: ["Preserves original casing (RFC 7230)", "Authorization vs authorization fix"], relatedTerms: ["fetch"], category: "network" },
	{ term: "S3File.write.contentEncoding", path: "api/s3", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, newParams: ["contentEncoding"], support: ["gzip", "br", "deflate"], useCases: ["Pre-compressed uploads", "Brotli static assets"], relatedTerms: ["s3", "S3File.presign"], category: "storage" },
	{ term: "bun:ffi.envPaths", path: "api/ffi", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, support: ["C_INCLUDE_PATH", "LIBRARY_PATH"], useCases: ["NixOS/FHS non-standard paths"], relatedTerms: ["ffi"], category: "runtime" },
	{ term: "Mimalloc v3", path: "internals/mimalloc", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, useCases: ["Reduced multi-threaded memory usage"], relatedTerms: ["heap"], category: "internals" },
	{ term: "Bun.stringWidth", path: "api/utils", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "GB9c Indic support" }, implementation: "51KB table (down from 70KB)", useCases: ["Col 93 alignment", "Unicode display width"], relatedTerms: ["Bun.wrapAnsi"], category: "runtime" },
	// v1.3.5 / v1.3.8 extensions — Tier-1380
	{ term: "Bun.Terminal", path: "api/terminal", bunMinVersion: "1.3.5", stability: "stable", platforms: ["darwin", "linux"], security: { classification: "critical", notes: "PTY spawn, validate I/O" }, methods: ["write", "resize", "setRawMode", "ref", "unref", "close"], useCases: ["Interactive shells", "Col 93 matrix display"], relatedTerms: ["Bun.spawn", "terminal"], category: "runtime" },
	{ term: "bun:bundle feature", path: "api/bundle", bunMinVersion: "1.3.5", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { classification: "medium", notes: "Dead code elimination reduces attack surface" }, useCases: ["Platform builds", "A/B testing", "Paid tiers"], cliFlags: ["--feature"], relatedTerms: ["bun build"], category: "bundler" },
	{ term: "pm pack", path: "pm/cli/pack", bunMinVersion: "1.3.8", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { classification: "high", notes: "Re-reads package.json post-lifecycle" }, useCases: ["prepack", "prepare", "prepublishOnly", "clean-package"], relatedTerms: ["bun pm publish"], category: "cli" },
	{ term: "Redis", path: "api/redis", bunMinVersion: "1.3.0", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_NET, perfProfile: { opsSec: 0, baseline: "7.9x ioredis" }, relatedTerms: ["Bun.sql", "postgres"], category: "storage" },
	{ term: "Bun.spawnSync", path: "api/spawn", bunMinVersion: "1.3.8", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "30x fix (13ms→0.4ms per 100 spawns) on Linux" }, implementation: "close_range() syscall; was iterating 65K FDs on older glibc", useCases: ["CI runners", "High ulimit Linux", "ARM64 servers"], relatedTerms: ["spawn", "Bun.spawn", "subprocess"], category: "runtime" },
];

/** bun test CLI options — Name, Pattern (aliases), Version, Topic, Type, Example */
export const BUN_TEST_CLI_OPTIONS = [
	{ Name: "--test-name-pattern", Pattern: "--grep, -t", Version: "1.3.7", Topic: "Filter tests by name regex", Type: "string", Example: 'bun test -t "should handle"' },
	{ Name: "--timeout", Pattern: "", Version: "1.0.0", Topic: "Per-test timeout (ms)", Type: "number", Example: "bun test --timeout 5000" },
	{ Name: "--bail", Pattern: "", Version: "1.0.0", Topic: "Exit on first failure", Type: "boolean", Example: "bun test --bail" },
	{ Name: "--preload", Pattern: "", Version: "1.0.0", Topic: "Preload script before tests", Type: "string[]", Example: "bun test --preload ./test-setup.ts" },
	{ Name: "--root", Pattern: "", Version: "1.0.0", Topic: "Test discovery root dir", Type: "string", Example: "bun test --root src" },
	{ Name: "--config", Pattern: "", Version: "1.3.6", Topic: "bunfig section (e.g. ci)", Type: "string", Example: "bun test --config=ci" },
	{ Name: "--env-file", Pattern: "", Version: "1.0.0", Topic: "Load env from file", Type: "string", Example: "bun test --env-file=.env.test" },
	{ Name: "--coverage", Pattern: "", Version: "1.0.0", Topic: "Enable code coverage", Type: "boolean", Example: "bun test --coverage" },
];

/** Render bun test CLI options as markdown table (BUN-TEST-001). */
export function renderCliMatrix(): string {
	const cols = ["Name", "Pattern", "Version", "Topic", "Type", "Example"];
	let md = `| ${cols.join(" | ")} |\n`;
	md += `|${cols.map(() => "------").join("|")}|\n`;
	for (const row of BUN_TEST_CLI_OPTIONS) {
		md += `| ${row.Name} | ${row.Pattern} | ${row.Version} | ${row.Topic} | ${row.Type} | \`${row.Example}\` |\n`;
	}
	return md;
}

/** Tier-1380 Test Config Inheritance — bunfig.toml hierarchy */
export const TEST_CONFIG_MATRIX = [
	{ Section: "[test]", InheritsFrom: "-", KeyValues: "root, preload, timeout, smol", SecurityScope: "Low (local only)" },
	{ Section: "[test.ci]", InheritsFrom: "[test]", KeyValues: "coverage=true, threshold=0.9", SecurityScope: "Medium (artifact storage)" },
	{ Section: "Install", InheritsFrom: "[install]", KeyValues: "registry, cafile, exact, prefer", SecurityScope: "High (private registry)" },
	{ Section: "Env Files", InheritsFrom: ".env → .env.test", KeyValues: "DATABASE_URL, CSRF_KEY", SecurityScope: "Critical (secret scope)" },
];

/** Bun v1.3.7 Feature Matrix — Tier-1380 Infrastructure Update */
export const BUN_137_FEATURE_MATRIX = [
	{ Term: "S3.presign", Ver: "1.3.7", PerfGain: "<0.1ms", Security: "Critical", Platforms: "All", Status: "Stable" },
	{ Term: "node:inspector", Ver: "1.3.7", PerfGain: "<3% overhead", Security: "High", Platforms: "Darwin/Linux", Status: "Stable" },
	{ Term: "Transpiler.replMode", Ver: "1.3.7", PerfGain: "50KB/ms", Security: "Medium", Platforms: "All", Status: "Experimental" },
	{ Term: "http.maxHeaders", Ver: "1.3.7", PerfGain: "200 headers", Security: "Medium", Platforms: "All", Status: "Stable" },
	{ Term: "WebSocket.creds", Ver: "1.3.7", PerfGain: "-", Security: "Critical", Platforms: "All", Status: "Stable" },
	{ Term: "String.isWellFormed", Ver: "1.3.7", PerfGain: "5.4x", Security: "Low", Platforms: "All", Status: "Stable" },
	{ Term: "RegExp.matchAll", Ver: "1.3.7", PerfGain: "C++ fast", Security: "Low", Platforms: "All", Status: "Stable" },
];

/** Bun v1.3.7 Complete Matrix — Tier-1380 28-entry catalog */
export const BUN_137_COMPLETE_MATRIX = [
	// Runtime Core
	{ Category: "Runtime", Term: "Buffer.from", PerfFeature: "50% faster (JSC bulk copy)", SecurityPlatform: "All platforms" },
	{ Category: "Runtime", Term: "Buffer.swap16", PerfFeature: "1.8x (0.56µs)", SecurityPlatform: "Side-channel safe" },
	{ Category: "Runtime", Term: "Buffer.swap64", PerfFeature: "3.6x (0.56µs)", SecurityPlatform: "CPU intrinsics (AVX/SSE)" },
	{ Category: "Runtime", Term: "Bun.wrapAnsi", PerfFeature: "88x vs npm (88µs→1µs)", SecurityPlatform: "GB9c Unicode aware" },
	{ Category: "Runtime", Term: "Bun.stringWidth", PerfFeature: "GB9c Indic support", SecurityPlatform: "51KB table (down from 70KB)" },
	{ Category: "Runtime", Term: "Bun.JSON5", PerfFeature: "Native .json5 imports", SecurityPlatform: "Comments + trailing commas" },
	{ Category: "Runtime", Term: "Bun.JSONL", PerfFeature: "Streaming parseChunk()", SecurityPlatform: "C++ UTF-8 BOM skip" },
	{ Category: "Runtime", Term: "Mimalloc v3", PerfFeature: "Multi-threaded memory ↓", SecurityPlatform: "Heap optimization" },
	{ Category: "Runtime", Term: "String.isWellFormed", PerfFeature: "5.4x (simdutf)", SecurityPlatform: "UTF-16 validation" },
	{ Category: "Runtime", Term: "RegExp.matchAll", PerfFeature: "C++ reimplementation", SecurityPlatform: "All platforms" },
	// Network & HTTP
	{ Category: "Network", Term: "fetch.headerCasing", PerfFeature: "Preserves Authorization", SecurityPlatform: "RFC 7230 compliant" },
	{ Category: "Network", Term: "http.maxHeaders", PerfFeature: "200 headers (0.2µs/header)", SecurityPlatform: "DoS protection" },
	{ Category: "Network", Term: "WebSocket.credentials", PerfFeature: "URL creds + Auth header", SecurityPlatform: "Critical (ZTNA)" },
	// Storage & S3
	{ Category: "Storage", Term: "S3.contentEncoding", PerfFeature: "gzip/br/deflate uploads", SecurityPlatform: "Pre-compressed assets" },
	{ Category: "Storage", Term: "S3.presign", PerfFeature: "contentDisposition fix", SecurityPlatform: "Inline→attachment control" },
	// Profiling & Debugging
	{ Category: "Profiling", Term: "--cpu-prof-md", PerfFeature: "Markdown output", SecurityPlatform: "LLM/GitHub analysis" },
	{ Category: "Profiling", Term: "--heap-prof", PerfFeature: "V8 + Markdown snapshots", SecurityPlatform: "Memory leak grep" },
	// FFI & System Integration
	{ Category: "FFI", Term: "bun:ffi.envPaths", PerfFeature: "C_INCLUDE_PATH support", SecurityPlatform: "NixOS compatibility" },
	// Bundler & Transpiler
	{ Category: "Bundler", Term: "Bun.Transpiler", PerfFeature: "replMode (experimental)", SecurityPlatform: "vm.runInContext persistence" },
	// Inspector & Debugging
	{ Category: "Inspector", Term: "node:inspector", PerfFeature: "Profiler API CDP", SecurityPlatform: "<3% CPU overhead" },
	// Additional v1.3.7 Features
	{ Category: "CLI", Term: "bunx --version", PerfFeature: "Package executor", SecurityPlatform: "Global cache" },
	{ Category: "CLI", Term: "bunx --bun", PerfFeature: "Force Bun runtime", SecurityPlatform: "Node fallback" },
	{ Category: "CLI", Term: "bunx -p", PerfFeature: "Custom package name", SecurityPlatform: "Binary mapping" },
	{ Category: "Security", Term: "fetch.timeouts", PerfFeature: "Connection/read timeouts", SecurityPlatform: "DoS prevention" },
	{ Category: "Security", Term: "http.maxURILength", PerfFeature: "8KB default", SecurityPlatform: "Buffer overflow protection" },
	{ Category: "Performance", Term: "DNS prefetch", PerfFeature: "150x faster", SecurityPlatform: "Cache warming" },
	{ Category: "Performance", Term: "File system cache", PerfFeature: "Persistent stat cache", SecurityPlatform: "Cross-platform" },
	{ Category: "Performance", Term: "JIT optimizations", PerfFeature: "URLPattern JIT", SecurityPlatform: "Compile-time caching" },
	{ Category: "Unicode", Term: "GB9c table v3", PerfFeature: "Indic script support", SecurityPlatform: "Col 93 compliance" },
	// v1.3.5 / v1.3.8 extensions
	{ Category: "Runtime", Term: "Bun.Terminal", PerfFeature: "Native PTY (93×45)", SecurityPlatform: "POSIX only (darwin/linux)" },
	{ Category: "Bundler", Term: "bun:bundle feature", PerfFeature: "Dead code elimination", SecurityPlatform: "Attack surface ↓" },
	{ Category: "PM", Term: "pm pack", PerfFeature: "Lifecycle re-read", SecurityPlatform: "clean-package compat" },
	{ Category: "Storage", Term: "Redis", PerfFeature: "7.9x vs ioredis", SecurityPlatform: "Native client" },
	{ Category: "Runtime", Term: "Bun.spawnSync", PerfFeature: "30x fix (~0.4ms/100 spawns) on Linux ARM64", SecurityPlatform: "close_range() vs 65K FD iteration" },
	{ Category: "Runtime", Term: "Buffer.indexOf/includes", PerfFeature: "2x (SIMD), 3.25s→1.42s .includes false", SecurityPlatform: "Single + multi-byte patterns" },
];

/** Tier-1380 Col 93 / GB9c / SecureDataRepository compliance notes */
export const TIER_1380_COMPLIANCE = [
	{ Item: "Transpiler.replMode", Note: "19 chars width (Bun.stringWidth GB9c verified)", Scope: "Col 93" },
	{ Item: "Security classifications", Note: "Align with SecureDataRepository clearance levels", Scope: "Critical/High/Medium/Low" },
	{ Item: "http.maxHeaders 200", Note: "Prevents header smuggling in 5-region deployment", Scope: "DoS protection" },
];

/** Tier-1380 Binary Ops — CPU intrinsic perf baseline (Col 93) */
export const BINARY_PERF_METRICS = [
	{ op: "Buffer.swap16", before: "1.00µs", after: "0.56µs", imp: "1.8x", use: "UTF-16 conversion" },
	{ op: "Buffer.swap64", before: "2.02µs", after: "0.56µs", imp: "3.6x", use: "Redis protocol" },
];

/** Derived from BUN_DOC_ENTRIES for backward compat with searchBunDocs */
export const BUN_DOC_MAP: Record<string, string> = Object.fromEntries(BUN_DOC_ENTRIES.map((e) => [e.term, e.path]));

/** Compare semver: returns true if a <= b */
function semverLte(a: string, b: string): boolean {
	const [am = 0, ai = 0, ap = 0] = a.split(".").map(Number);
	const [bm = 0, bi = 0, bp = 0] = b.split(".").map(Number);
	if (am !== bm) return am < bm;
	if (ai !== bi) return ai < bi;
	return ap <= bp;
}

/** Filter entries by bunMinVersion <= runtimeVersion (hide too-new APIs from prod) */
export function filterEntriesByVersion(entries: BunDocEntry[], runtimeVersion: string): BunDocEntry[] {
	return entries.filter((e) => semverLte(e.bunMinVersion, runtimeVersion));
}

/** Filter entries by stability (exclude experimental from prod builds) */
export function filterEntriesByStability(entries: BunDocEntry[], allowed: Stability[]): BunDocEntry[] {
	return entries.filter((e) => allowed.includes(e.stability));
}

/** Filter entries by platform (e.g. exclude darwin-only on linux) */
export function filterEntriesByPlatform(entries: BunDocEntry[], platform: Platform): BunDocEntry[] {
	return entries.filter((e) => e.platforms.includes(platform));
}

/** Bias fetch/serve higher (80% of queries hit HTTP). 1 = default, 2 = high. */
export const SEARCH_WEIGHTS: Record<string, number> = {
	"bun test": 1.5,
	fetch: 2,
	serve: 2,
	"Bun.serve": 2,
	file: 1.5,
	"Bun.file": 1.5,
	"Buffer.swap16": 1.5,
	"Buffer.swap64": 1.5,
	"S3File.presign": 1.5,
	"node:inspector": 1.2,
	"http.maxHeaders": 1.2,
	"WebSocket.credentials": 1.5,
	"String.isWellFormed": 1.2,
	"RegExp[Symbol.matchAll]": 1.2,
	"Buffer.from": 1.2,
	"Bun.wrapAnsi": 1.5,
	"Bun.JSON5": 1.3,
	"Bun.JSONL": 1.3,
	"--cpu-prof-md": 1.2,
	"--heap-prof": 1.2,
	"fetch.headerCasing": 1.3,
	"S3File.write.contentEncoding": 1.3,
	"bun:ffi.envPaths": 1.2,
	"Bun.stringWidth": 1.5,
	"Bun.Terminal": 1.5,
	"bun:bundle feature": 1.2,
	"pm pack": 1.2,
	Redis: 1.5,
	"Bun.spawnSync": 1.5,
	"Buffer.indexOf": 1.3,
	"Buffer.includes": 1.3,
};

export function buildDocUrl(path: string): string {
	return path.startsWith("http") ? path : `${BUN_DOCS_BASE}/${path}`;
}

/** Resolve a curated doc entry by term (case-insensitive match, then exact). Returns null if not found. */
export function getDocEntry(term: string): BunDocEntry | null {
	const t = term.trim();
	const lower = t.toLowerCase();
	const exact = BUN_DOC_ENTRIES.find((e) => e.term === t);
	if (exact) return exact;
	return BUN_DOC_ENTRIES.find((e) => e.term.toLowerCase() === lower) ?? null;
}

/** Resolve a deep-dive reference URL by key (e.g. "fileAPI", "httpServer"). Returns URL string. */
export function getReferenceUrl(key: keyof typeof BUN_REFERENCE_LINKS): string {
	return BUN_REFERENCE_LINKS[key];
}

/** All reference link keys for iteration / tooling. */
export const BUN_REFERENCE_KEYS = Object.keys(BUN_REFERENCE_LINKS) as (keyof typeof BUN_REFERENCE_LINKS)[];

/** Bun top-level globals: name, doc path, short description. Cross-referenced with BUN_DOC_ENTRIES where applicable. */
export interface BunGlobalEntry {
	name: string;
	path: string;
	description: string;
	/** Related global or API term */
	related?: string[];
}

/** Top-level globals (Bun, $, fetch, Buffer, etc.) and their doc paths. API surface for Bun.* lives at api/globals. */
export const BUN_GLOBALS: BunGlobalEntry[] = [
	{ name: "Bun", path: "api/globals", description: "Bun namespace (version, env, sleep, which, peek, inspect, file, serve, …)", related: ["Bun.serve", "Bun.file", "Bun.inspect.table"] },
	{ name: "$", path: "runtime/shell", description: "Shell script runner (Bun shell)", related: ["shell", "spawn"] },
	{ name: "fetch", path: "guides/http/fetch", description: "Global fetch (undici-compatible)", related: ["Bun.serve", "Bun.file"] },
	{ name: "Buffer", path: "api/buffer", description: "Node-compatible Buffer (swap16, swap64, indexOf, includes)", related: ["buffer", "Buffer.swap16"] },
	{ name: "process", path: "api/env", description: "process.env, process.argv (Node compat)", related: ["env"] },
	{ name: "Bun.file", path: "api/file-io", description: "BunFile factory", related: ["file", "Bun.write"] },
	{ name: "Bun.serve", path: "api/http", description: "HTTP server", related: ["serve", "fetch"] },
	{ name: "Bun.secrets", path: "api/secrets", description: "OS keychain get/set", related: ["secrets"] },
	{ name: "Bun.password", path: "api/hashing", description: "Argon2id/bcrypt hash/verify", related: ["password", "hash"] },
	{ name: "Bun.inspect", path: "api/util", description: "inspect(), table(), custom", related: ["inspect", "Bun.inspect.table"] },
];

/** URL for Bun globals API (Bun.* methods). */
export const BUN_GLOBALS_API_URL = "https://bun.sh/docs/api/globals";

/** Cross-reference: for a term return related doc entries with URLs. Uses relatedTerms on BunDocEntry. */
export function getCrossReferences(term: string): { term: string; url: string; path: string }[] {
	const entry = getDocEntry(term);
	if (!entry || !entry.relatedTerms?.length) return [];
	const out: { term: string; url: string; path: string }[] = [];
	for (const t of entry.relatedTerms) {
		const e = getDocEntry(t);
		if (e) out.push({ term: e.term, path: e.path, url: buildDocUrl(e.path) });
		else out.push({ term: t, path: BUN_DOC_MAP[t] ?? "", url: BUN_DOC_MAP[t] ? buildDocUrl(BUN_DOC_MAP[t]) : "" });
	}
	return out.filter((x) => x.url);
}

/** Suggest curated terms by partial match (case-insensitive). Sorted by weight then term length. Limit default 10. */
export function suggestDocTerms(
	query: string,
	limit = 10,
): { term: string; path: string; url: string; stability: Stability }[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	const matches = BUN_DOC_ENTRIES.filter((e) => e.term.toLowerCase().includes(q))
		.map((e) => ({
			term: e.term,
			path: e.path,
			url: buildDocUrl(e.path),
			stability: e.stability,
			weight: SEARCH_WEIGHTS[e.term] ?? 1,
			len: e.term.length,
		}))
		.sort((a, b) => b.weight - a.weight || a.len - b.len)
		.slice(0, limit);
	return matches.map(({ term, path, url, stability }) => ({ term, path, url, stability }));
}

export interface SearchResult {
	title: string;
	url: string;
	snippet?: string;
	weight?: number;
}

export interface SearchBunOpts {
	apiOnly?: boolean;
	codeOnly?: boolean;
	/** Exclude experimental/deprecated (prod builds) */
	prodSafe?: boolean;
	/** Filter by bunMinVersion <= this (e.g. "1.3.6") */
	bunVersion?: string;
	/** Exclude platform-incompatible APIs (e.g. "win32") */
	platform?: Platform;
}

export async function searchBunDocs(
	query: string,
	opts?: SearchBunOpts,
): Promise<string> {
	const q = query.toLowerCase().trim();
	const results: SearchResult[] = [];

	// Resolve curated source: filter by prodSafe/bunVersion/platform when requested
	let curatedMap = BUN_DOC_MAP;
	if (opts?.prodSafe || opts?.bunVersion || opts?.platform) {
		let entries = BUN_DOC_ENTRIES;
		if (opts.prodSafe) entries = filterEntriesByStability(entries, ["stable"]);
		if (opts.bunVersion) entries = filterEntriesByVersion(entries, opts.bunVersion);
		if (opts.platform) entries = filterEntriesByPlatform(entries, opts.platform);
		curatedMap = Object.fromEntries(entries.map((e) => [e.term, e.path]));
	}

	// Try Mintlify-style search
	const searchUrls = [
		`https://bun.com/api/search?q=${encodeURIComponent(q)}`,
		`https://bun.com/search?q=${encodeURIComponent(q)}`,
	];

	for (const url of searchUrls) {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
			if (!res.ok) continue;
			const contentType = res.headers.get("content-type") ?? "";
			if (!contentType.includes("json")) continue;

			const data = (await res.json()) as unknown;
			if (Array.isArray(data)) {
				for (const item of data.slice(0, 5)) {
					const href = typeof item === "object" && item && "url" in item ? String((item as { url: string }).url) : null;
					const title = typeof item === "object" && item && "title" in item ? String((item as { title: string }).title) : "Bun Docs";
					if (href) results.push({ title, url: href });
				}
				break;
			}
			if (typeof data === "object" && data && "results" in data) {
				const arr = (data as { results: unknown[] }).results;
				if (Array.isArray(arr)) {
					for (const item of arr.slice(0, 5)) {
						const href = typeof item === "object" && item && "url" in item ? String((item as { url: string }).url) : null;
						const title = typeof item === "object" && item && "title" in item ? String((item as { title: string }).title) : "Bun Docs";
						if (href) results.push({ title, url: href });
					}
					break;
				}
			}
		} catch {
			// Try next URL
		}
	}

	// Fallback: curated map (with search weights)
	if (results.length === 0) {
		for (const [key, path] of Object.entries(curatedMap)) {
			if (q.includes(key) || key.includes(q)) {
				const weight = SEARCH_WEIGHTS[key] ?? 1;
				results.push({
					title: `Bun: ${key}`,
					url: buildDocUrl(path),
					snippet: `Documentation for ${key}`,
					weight,
				});
			}
		}
		results.sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));
	}

	// Default fallback
	if (results.length === 0) {
		results.push(
			{ title: "Bun Documentation", url: BUN_DOCS_BASE, snippet: "Main documentation index" },
			{ title: "Bun MCP", url: `${BUN_DOCS_BASE}/mcp`, snippet: "Model Context Protocol integration" },
		);
	}

	const lines = results.slice(0, 8).map((r) => `- **[${r.title}](${r.url})**${r.snippet ? `\n  ${r.snippet}` : ""}`);
	return `## Bun docs for "${query}"\n\n${lines.join("\n\n")}\n\n*Source: [bun.com/docs](https://bun.com/docs)*`;
}

// Tier-1380 Profiler Pipeline (Markdown → RSS → Dashboard)
export class Tier1380Profiler {
	async captureAndStream(scriptPath: string): Promise<void> {
		// 1. Capture CPU profile in Markdown (LLM-parseable)
		Bun.spawn(["bun", "--cpu-prof-md", scriptPath]);

		// 2. Capture heap snapshot (grep-friendly)
		const heapProc = Bun.spawn(["bun", "--heap-prof", scriptPath]);

		// 3. Parse with JSONL for streaming telemetry (ReadableStream via reader)
		const reader = heapProc.stdout.getReader();
		try {
			const chunks: Uint8Array[] = [];
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) chunks.push(value);
			}
			const text = new TextDecoder().decode(Bun.concatArrayBuffers(chunks));
			for (const line of text.split("\n").filter(Boolean)) {
				try {
					const metrics = Bun.JSONL.parse(line);
					await this.threatIntelligenceFeed(metrics);
				} catch {
					// Skip malformed lines
				}
			}
		} finally {
			reader.releaseLock();
		}
	}

	private async threatIntelligenceFeed(metrics: unknown): Promise<void> {
		// Implementation for feeding metrics to threat intelligence
		console.log("Feeding metrics:", metrics);
	}
}

// ANSI Matrix Renderer (Col 93 aware)
export class MatrixDashboard {
	renderCell(text: string, width: number): string {
		// Bun.wrapAnsi preserves colors across line breaks
		// GB9c ensures Devanagari status text aligns at Col 93
		return Bun.wrapAnsi(text, width, {
			hard: false,
			wordWrap: true,
			ambiguousIsNarrow: true
		});
	}

	renderMatrix(matrix: typeof BUN_137_COMPLETE_MATRIX): string {
		const header = "╔═══════════════════════════════════════════════════════════════════════════════════════════════╗\n" +
			"║                        ▸ Bun v1.3.7 Complete Feature Matrix                                  ║\n" +
			"║  ◈ Tier-1380 Infrastructure — 28 Entries Cataloged                                           ║\n" +
			"╠═══════════════════════════════════════════════════════════════════════════════════════════════╣\n" +
			"║ Category      │ Term               │ Perf/Feature                │ Security/Platform           ║\n" +
			"╠═══════════════╪════════════════════╪═════════════════════════════╪═════════════════════════════╣\n";

		const rows = matrix.map(entry => {
			const category = this.renderCell(entry.Category.padEnd(13), 13);
			const term = this.renderCell(entry.Term.padEnd(18), 18);
			const perf = this.renderCell(entry.PerfFeature.padEnd(26), 26);
			const security = this.renderCell(entry.SecurityPlatform.padEnd(26), 26);
			return `║ ${category} │ ${term} │ ${perf} │ ${security} ║`;
		}).join('\n');

		const footer = "╚═══════════════╧════════════════════╧═════════════════════════════╧═════════════════════════════╝";

		return header + rows + '\n' + footer;
	}
}

// S3 Pre-compressed Asset Pipeline
export class SecureAssetDelivery {
	async uploadBrotliAsset(path: string, data: Buffer): Promise<void> {
		// Note: This would require S3Client from AWS SDK
		// const s3 = new S3Client({ /* ZTNA credentials */ });

		// contentEncoding for pre-compressed static assets
		console.log(`Uploading ${path} with contentEncoding: br`);

		// Presigned with forced download (security audit trails)
		console.log(`Presigned URL for ${path}.br with contentDisposition: attachment`);
	}
}
