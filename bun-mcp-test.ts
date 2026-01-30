#!/usr/bin/env bun
/**
 * Test and validate https://bun.com/docs/mcp
 *
 * Fetches the Bun MCP manifest, validates structure, and reports status.
 * Run: bun run mcp:bun-test
 */

import {
	fetchManifest,
	validateManifest,
	MCP_MANIFEST_URL,
} from "./bun-mcp-manifest.ts";

async function main(): Promise<void> {
	console.log("🔍 Bun MCP Manifest Test");
	console.log(`   URL: ${MCP_MANIFEST_URL}`);
	console.log();

	const { ok, data, error } = await fetchManifest();

	if (!ok || !data) {
		console.log("❌ Fetch failed:", error ?? "unknown");
		process.exit(1);
	}

	console.log("✅ Fetch OK");
	console.log();
	console.log("Server:");
	console.log(`  name:     ${data.server?.name}`);
	console.log(`  version:  ${data.server?.version}`);
	console.log(`  transport: ${data.server?.transport}`);
	console.log();

	const tool = data.capabilities?.tools?.SearchBun;
	if (tool) {
		console.log("Tool: SearchBun");
		console.log(`  description: ${tool.description?.slice(0, 80)}...`);
		console.log(`  inputs: query (required), ${Object.keys(tool.inputSchema?.properties ?? {}).filter((k) => k !== "query").join(", ") || "none"}`);
		console.log();
	}

	const issues = validateManifest(data);
	if (issues.length > 0) {
		console.log("⚠️  Validation issues:");
		for (const i of issues) console.log(`   - ${i}`);
		process.exit(1);
	}

	console.log("✅ Manifest valid");
	console.log();
	console.log("Note: No public HTTP MCP endpoint URL documented. For SearchBun integration,");
	console.log("      use a local MCP bridge (bun run mcp:bun-docs) or Context7 with Bun docs.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
