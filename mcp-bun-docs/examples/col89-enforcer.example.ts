#!/usr/bin/env bun
/**
 * Col-89 column width enforcer with Unicode safety (Tier-1380).
 *
 * Validates lines fit within 89 columns using:
 * - Bun.stringWidth (countAnsiEscapeCodes: false; optional ambiguousIsNarrow)
 * - GB9c version check (Bun >= 1.3.7 for accurate Indic/CJK width)
 * - Nanosecond timing and COL_89_VIOLATION audit entries
 * - Bun.inspect.table for violation report
 * - Optional: Bun.jsc.estimateShallowMemoryUsageOf for mem_bytes audit; export col89-audit.md
 *
 * Run: bun mcp-bun-docs/examples/col89-enforcer.example.ts
 * Export MD: EXPORT_COL89_AUDIT=1 bun examples/col89-enforcer.example.ts
 */

import {
	COL89_MAX,
	MIN_GB9C_VERSION,
	type Col89ViolationAudit,
	getDocLinkWidth,
} from "../lib.ts";

const PREVIEW_LEN = 40;

function stringWidth(line: string): number {
	if (typeof Bun !== "undefined" && typeof Bun.stringWidth === "function") {
		return Bun.stringWidth(line, { countAnsiEscapeCodes: false });
	}
	return line.length;
}

export interface Col89EnforcerSummary {
	lines_checked: number;
	violation_count: number;
	total_mem?: number;
}

function enforceCol89WithUnicodeSafety(lines: string[]): {
	ok: boolean[];
	auditRepo: Col89ViolationAudit[];
	summary: Col89EnforcerSummary;
} {
	const version =
		typeof Bun !== "undefined" && Bun.version != null ? Bun.version : "";
	const satisfies =
		typeof Bun !== "undefined" &&
		typeof (Bun as { semver?: { satisfies: (v: string, r: string) => boolean } }).semver?.satisfies === "function"
			? (Bun as { semver: { satisfies: (v: string, r: string) => boolean } }).semver.satisfies
			: null;
	const unicodeAware: boolean = satisfies !== null && !!version && satisfies(version, MIN_GB9C_VERSION);

	if (!unicodeAware && version) {
		console.warn(
			`⚠ Bun ${version} < ${MIN_GB9C_VERSION}: Indic widths may be inaccurate (upgrade for GB9c).`,
		);
	}

	const ok: boolean[] = [];
	const auditRepo: Col89ViolationAudit[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const t0 = typeof Bun !== "undefined" && typeof Bun.nanoseconds === "function" ? Bun.nanoseconds() : 0;
		const width = stringWidth(line);
		const perfNs =
			typeof Bun !== "undefined" && typeof Bun.nanoseconds === "function"
				? Bun.nanoseconds() - t0
				: undefined;

		if (width <= COL89_MAX) {
			ok.push(true);
			continue;
		}

		ok.push(false);
		const jsc = typeof Bun !== "undefined" && (Bun as { jsc?: { estimateShallowMemoryUsageOf?: (obj: unknown) => number } }).jsc;
		const memBytes =
			jsc && typeof jsc.estimateShallowMemoryUsageOf === "function"
				? jsc.estimateShallowMemoryUsageOf(line)
				: undefined;
		auditRepo.push({
			event: "COL_89_VIOLATION",
			index: i,
			computed_width: width,
			preview: line.slice(0, PREVIEW_LEN) + (line.length > PREVIEW_LEN ? "…" : ""),
			unicode_aware: unicodeAware,
			...(version && { bun_version: version }),
			grapheme_table: unicodeAware ? "~51KB (GB9c)" : "~70KB (pre-GB9c)",
			...(perfNs != null && { perf_ns: perfNs }),
			recommendation: "Truncate or wrap with Bun.wrapAnsi(line, 89).",
			...(memBytes != null && { mem_bytes: memBytes }),
		});
	}

	const totalMem =
		auditRepo.length > 0
			? auditRepo.reduce((s, a) => s + (a.mem_bytes ?? 0), 0)
			: 0;
	const summary: Col89EnforcerSummary = {
		lines_checked: lines.length,
		violation_count: auditRepo.length,
		...(totalMem > 0 && { total_mem: totalMem }),
	};

	return { ok, auditRepo, summary };
}

// Test cases from Col-89 enforcer doc (last line intentional violation)
const TEST_LINES = [
	"Latin ASCII: hello world (11 cols)",
	"CJK: 你好世界 (8 cols)",
	"Emoji ZWJ: 👨🚀🦊 (4 cols)",
	"Indic conjunct: क्ष क्ष क्क्क (7 cols)",
	"a".repeat(50),
	"Over-long: " + "a".repeat(80), // 90 cols → COL_89_VIOLATION
];

const { ok, auditRepo, summary } = enforceCol89WithUnicodeSafety(TEST_LINES);

console.log("Col-89 check (max %d columns):\n", COL89_MAX);
for (let i = 0; i < TEST_LINES.length; i++) {
	const w = getDocLinkWidth(TEST_LINES[i]);
	console.log("  [%s] width=%d  %s", ok[i] ? "OK" : "VIOLATION", w, TEST_LINES[i].slice(0, 50) + (TEST_LINES[i].length > 50 ? "…" : ""));
}

if (auditRepo.length > 0) {
	const cols = ["event", "index", "computed_width", "unicode_aware", "bun_version", "perf_ns", "mem_bytes", "recommendation"].filter(
		(c) => c !== "mem_bytes" || auditRepo.some((a) => a.mem_bytes != null),
	);
	console.log("\nViolations (Bun.inspect.table):\n");
	const tableStr =
		typeof Bun !== "undefined" && typeof Bun.inspect !== "undefined" && typeof Bun.inspect.table === "function"
			? Bun.inspect.table(auditRepo, cols.length ? cols : ["event", "index", "computed_width", "unicode_aware", "bun_version", "perf_ns", "recommendation"], { colors: true })
			: JSON.stringify(auditRepo, null, 2);
	console.log(tableStr);

	console.log(
		"\nSummary: %d violation(s) of %d line(s) checked%s.",
		summary.violation_count,
		summary.lines_checked,
		summary.total_mem != null ? ` | total shallow mem: ${summary.total_mem} B` : "",
	);
} else {
	console.log("\nSummary: 0 violations of %d line(s) checked.", summary.lines_checked);
}

const exportAudit = typeof process !== "undefined" && process.env["EXPORT_COL89_AUDIT"] === "1";
if (exportAudit && typeof Bun !== "undefined" && (auditRepo.length > 0 || process.env["EXPORT_COL89_AUDIT_ALWAYS"] === "1")) {
	const stripANSI =
		typeof Bun.stripANSI === "function"
			? Bun.stripANSI
			: (s: string) => s.replace(/\u001b\[[0-9;]*m/g, "");
	const tableStr =
		typeof Bun.inspect !== "undefined" && typeof Bun.inspect.table === "function"
			? Bun.inspect.table(auditRepo, ["event", "index", "computed_width", "unicode_aware", "bun_version", "perf_ns", "mem_bytes", "recommendation"].filter(
					(c) => c !== "mem_bytes" || auditRepo.some((a) => a.mem_bytes != null),
				), { colors: false })
			: JSON.stringify(auditRepo, null, 2);
	const summaryBlock = [
		"| Metric | Value |",
		"|--------|-------|",
		`| Lines checked | ${summary.lines_checked} |`,
		`| Violations | ${summary.violation_count} |`,
		...(summary.total_mem != null ? [`| Total shallow mem | ${summary.total_mem} B |`] : []),
	].join("\n");
	const md = `# Tier-1380 Col-89 Audit\n\n## Summary\n\n${summaryBlock}\n\n## Violations\n\n${stripANSI(tableStr)}\n`;
	await Bun.write("col89-audit.md", md);
	console.log("\nMD Export: col89-audit.md");

	const json = JSON.stringify({ summary, auditRepo }, null, 0);
	const zst = Bun.zstdCompressSync(new TextEncoder().encode(json));
	await Bun.write("col89-audit.json.zst", zst);
	console.log("Zstd Export: col89-audit.json.zst (%d B)", zst.byteLength);
}
