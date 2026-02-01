/**
 * Bun MCP Manifest - fetch and validate https://bun.com/docs/mcp
 *
 * Exported for testing and programmatic use.
 * @col_93 balanced_braces (skills) - code blocks have balanced braces/brackets/parens
 */

export const MCP_MANIFEST_URL = "https://bun.com/docs/mcp";

export interface SearchBunSchema {
	type: "object";
	properties: Record<string, { type: string; description: string }>;
	required: string[];
}

export interface SearchBunTool {
	name: string;
	description: string;
	inputSchema: SearchBunSchema;
	operationId: string;
}

export interface MCPManifest {
	server: { name: string; version: string; transport: string };
	capabilities: {
		tools: { SearchBun: SearchBunTool };
		resources: unknown[];
		prompts: unknown[];
	};
}

export async function fetchManifest(): Promise<{
	ok: boolean;
	data: MCPManifest | null;
	error?: string;
}> {
	const start = Bun.nanoseconds();
	try {
		const res = await fetch(MCP_MANIFEST_URL, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(10000),
		});
		const elapsed = ((Bun.nanoseconds() - start) / 1e6).toFixed(2);

		if (!res.ok) {
			return {
				ok: false,
				data: null,
				error: `HTTP ${res.status} in ${elapsed}ms`,
			};
		}

		const text = await res.text();
		let data: MCPManifest;

		try {
			data = JSON.parse(text) as MCPManifest;
		} catch {
			return {
				ok: false,
				data: null,
				error: `Invalid JSON (${text.length} bytes) in ${elapsed}ms`,
			};
		}

		return { ok: true, data };
	} catch (err) {
		const elapsed = ((Bun.nanoseconds() - start) / 1e6).toFixed(2);
		return {
			ok: false,
			data: null,
			error: `${err instanceof Error ? err.message : String(err)} (${elapsed}ms)`,
		};
	}
}

export function validateManifest(m: MCPManifest): string[] {
	const issues: string[] = [];

	if (!m.server?.name) issues.push("server.name missing");
	if (!m.server?.version) issues.push("server.version missing");
	if (m.server?.transport !== "http") issues.push("server.transport should be 'http'");

	const tool = m.capabilities?.tools?.SearchBun;
	if (!tool) {
		issues.push("capabilities.tools.SearchBun missing");
		return issues;
	}

	if (!tool.name || tool.name !== "SearchBun") issues.push("SearchBun.name invalid");
	if (!tool.description?.length) issues.push("SearchBun.description missing");
	if (!tool.inputSchema?.properties?.query) issues.push("SearchBun.inputSchema.query missing");
	if (!tool.inputSchema?.required?.includes("query"))
		issues.push("SearchBun.inputSchema.required should include 'query'");

	const optProps = ["version", "language", "apiReferenceOnly", "codeOnly"];
	for (const p of optProps) {
		if (tool.inputSchema?.properties?.[p] && !tool.inputSchema.properties[p].description) {
			issues.push(`SearchBun.inputSchema.${p} missing description`);
		}
	}

	return issues;
}
