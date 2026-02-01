#!/usr/bin/env bun
/**
 * Example: Fetch and inspect the Bun MCP manifest
 * @col_93 balanced_braces (skills)
 * Run: bun mcp-bun-docs/examples/manifest-fetch.example.ts
 */

import {
	fetchManifest,
	MCP_MANIFEST_URL,
	validateManifest,
} from "../../bun-mcp-manifest.ts";

async function main(): Promise<void> {
	console.log("Fetching Bun MCP manifest...\n");
	console.log(`URL: ${MCP_MANIFEST_URL}\n`);

	const result = await fetchManifest();

	if (!result.ok) {
		console.error("Failed:", result.error);
		process.exit(1);
	}

	const m = result.data!;

	console.log("Server:");
	console.log(`  name:     ${m.server.name}`);
	console.log(`  version:  ${m.server.version}`);
	console.log(`  transport: ${m.server.transport}`);
	console.log();

	const tool = m.capabilities.tools.SearchBun;
	console.log("Tool: SearchBun");
	console.log(`  description: ${tool.description}`);
	console.log("  parameters:");
	for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
		const required = tool.inputSchema.required.includes(key) ? " (required)" : "";
		console.log(`    - ${key}: ${(prop as { type: string }).type}${required}`);
	}
	console.log();

	const issues = validateManifest(m);
	if (issues.length === 0) {
		console.log("Validation: OK");
	} else {
		console.log("Validation issues:");
		issues.forEach((i) => console.log(`  - ${i}`));
	}
}

main().catch(console.error);
