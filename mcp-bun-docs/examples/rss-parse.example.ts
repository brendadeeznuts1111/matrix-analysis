#!/usr/bin/env bun
/**
 * Tier-1380 hardened RSS parse example.
 * - parseRSS with timeout, try/catch, parsererror check
 * - Escape all displayed content with Bun.escapeHTML
 * - Enforce Col-89 on every line (stringWidth + wrapAnsi)
 * - Log feed fetch time + size + parse time for audit
 *
 * Run: bun mcp-bun-docs/examples/rss-parse.example.ts
 * Or:  bun run rss:parse
 */

import { parseRSS } from "../rss.ts";
import { BUN_CHANGELOG_RSS, COL89_MAX } from "../lib.ts";

function escape(s: string): string {
	return typeof Bun !== "undefined" && typeof Bun.escapeHTML === "function" ? Bun.escapeHTML(s) : s;
}

function width(s: string): number {
	return typeof Bun !== "undefined" && typeof Bun.stringWidth === "function" ? Bun.stringWidth(s, { countAnsiEscapeCodes: false }) : s.length;
}

function wrapToCol89(s: string): string {
	if (width(s) <= COL89_MAX) return s;
	return typeof Bun !== "undefined" && typeof Bun.wrapAnsi === "function" ? Bun.wrapAnsi(s, COL89_MAX) : s.slice(0, COL89_MAX);
}

async function main(): Promise<void> {
	const { feed, audit } = await parseRSS(BUN_CHANGELOG_RSS, {
		timeoutMs: 10_000,
		onAudit: (a) => {
			console.error(`[audit] fetch ${a.fetchTimeMs.toFixed(0)}ms size ${a.sizeBytes} parse ${a.parseTimeMs.toFixed(0)}ms${a.fromCache ? " (cached)" : ""}`);
		},
	});

	console.log(wrapToCol89(`Feed: ${escape(feed.title)}`));
	console.log(wrapToCol89(`Items: ${feed.items.length}`));
	console.log("");

	feed.items.slice(0, 3).forEach((item) => {
		const datePart = item.pubDate?.slice(0, 10) ?? "          ";
		const titleSafe = escape(item.title);
		const line = `${datePart}  ${titleSafe}`;
		console.log(wrapToCol89(line));
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
