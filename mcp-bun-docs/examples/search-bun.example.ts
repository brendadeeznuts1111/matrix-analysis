#!/usr/bin/env bun
/**
 * Example: Call SearchBun programmatically (without MCP server)
 * @col_93 balanced_braces (skills)
 * Run: bun mcp-bun-docs/examples/search-bun.example.ts
 * Or:  bun mcp-bun-docs/examples/search-bun.example.ts "Bun.serve"
 */

import { searchBunDocs } from "../lib.ts";

async function main(): Promise<void> {
	const query = process.argv[2] ?? "fetch";

	console.log(`Searching Bun docs for: "${query}"\n`);

	const markdown = await searchBunDocs(query);

	console.log(markdown);
}

main().catch(console.error);
