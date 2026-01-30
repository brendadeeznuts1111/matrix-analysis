/**
 * SearchBun core logic - exported for testing and programmatic use.
 * @col_93 balanced_braces (skills) - code blocks have balanced braces/brackets/parens
 */

export const BUN_DOCS_BASE = "https://bun.com/docs";
export const BUN_DOCS_VERSION = "1.3.7";
export const BUN_DOCS_MIN_VERSION = "1.3.6";
/** Official Bun changelog/release RSS: https://bun.com/rss.xml */
export const BUN_CHANGELOG_RSS = "https://bun.com/rss.xml";

/** Tier-1380 Matrix v2: traceability schema for ACP filtering & CI gating */
export type SemVer = `${number}.${number}.${number}`;
export type Stability = "experimental" | "stable" | "deprecated";
export type Platform = "darwin" | "linux" | "win32";
export type SecurityClass = "critical" | "high" | "medium" | "low";

export type DocCategory = "storage" | "runtime" | "bundler" | "network";

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
	// v1.3.7 Feature Matrix — Tier-1380 (spec-complete)
	{ term: "S3File.presign", path: "api/s3", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { classification: "critical", notes: "Presigned URL expiration + contentDisposition injection protection", zeroTrustEnforced: true }, perfProfile: { opsSec: 0, baseline: "<0.1ms signature" }, newParams: ["contentDisposition", "type"], useCases: ["Secure downloads", "PDF reporting", "Attachment forcing"], relatedTerms: ["s3", "s3.file"], category: "storage" },
	{ term: "node:inspector", path: "api/node-inspector", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux"], security: { classification: "high", requiresRoot: false, notes: "CDP Profiler.enable gated by --inspect flag" }, perfProfile: { opsSec: 0, baseline: "<3% CPU impact" }, methods: ["Profiler.enable", "Profiler.start", "Profiler.stop", "setSamplingInterval"], relatedTerms: ["--inspect"], category: "runtime" },
	{ term: "Bun.Transpiler.replMode", path: "api/transpiler", bunMinVersion: "1.3.7", stability: "experimental", platforms: ["darwin", "linux", "win32"], security: { classification: "medium", notes: "vm.runInContext isolation required" }, perfProfile: { opsSec: 0, baseline: "50KB/ms" }, features: ["Variable hoisting", "const→let", "Top-level await", "Object literal detection"], relatedTerms: ["transpiler"], category: "bundler" },
	{ term: "http.maxHeaders", path: "api/http", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { classification: "medium", notes: "DoS protection limit doubled" }, perfProfile: { opsSec: 0, baseline: "100→200 headers, 0.2µs/header" }, default: 200, relatedTerms: ["serve", "Bun.serve"], category: "network" },
	{ term: "WebSocket.credentials", path: "api/websocket", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: { classification: "critical", notes: "URL credential extraction + Authorization header precedence", zeroTrustEnforced: true }, support: ["ws://user:pass@host", "Basic Auth auto-encoding"], relatedTerms: ["WebSocket"], category: "network" },
	{ term: "String.isWellFormed", path: "api/string", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "5.4x (simdutf)" }, implementation: "WebKit C++ + simdutf", useCases: ["UTF-16 validation"], relatedTerms: ["String.toWellFormed"], category: "runtime" },
	{ term: "RegExp[Symbol.matchAll]", path: "api/regexp", bunMinVersion: "1.3.7", stability: "stable", platforms: ["darwin", "linux", "win32"], security: SEC_IO, perfProfile: { opsSec: 0, baseline: "C++ reimplementation" }, relatedTerms: ["RegExp", "matchAll"], category: "runtime" },
];

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
	const [am, ai, ap] = a.split(".").map(Number);
	const [bm, bi, bp] = b.split(".").map(Number);
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
};

export function buildDocUrl(path: string): string {
	return path.startsWith("http") ? path : `${BUN_DOCS_BASE}/${path}`;
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
