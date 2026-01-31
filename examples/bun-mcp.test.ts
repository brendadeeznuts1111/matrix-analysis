#!/usr/bin/env bun
/**
 * Bun MCP Manifest tests — follows Bun best practices
 * @see https://bun.com/docs/test/writing-tests
 *
 * Run: bun test bun-mcp.test.ts
 */

import { describe, expect, test } from "bun:test";
import {
	fetchManifest,
	validateManifest,
	MCP_MANIFEST_URL,
	type MCPManifest,
} from "./bun-mcp-manifest.ts";

describe("Bun MCP Manifest", () => {
	describe("constants", () => {
		test("should point MCP_MANIFEST_URL to bun.com", () => {
			expect(MCP_MANIFEST_URL).toBe("https://bun.com/docs/mcp");
			expect(MCP_MANIFEST_URL).toContain("bun.com");
		});
	});

	describe("fetchManifest", () => {
		test("should return ok and valid JSON", async () => {
			expect.hasAssertions();
			const result = await fetchManifest();
			expect(result.ok).toBe(true);
			expect(result.data).not.toBeNull();
			expect(result.error).toBeUndefined();
		});

		test("should include server info", async () => {
			expect.hasAssertions();
			const result = await fetchManifest();
			expect(result.ok).toBe(true);
			const m = result.data!;
			expect(m.server.name).toBe("Bun");
			expect(m.server.version).toBeDefined();
			expect(m.server.transport).toBe("http");
		});

		test("should include SearchBun tool", async () => {
			expect.hasAssertions();
			const result = await fetchManifest();
			expect(result.ok).toBe(true);
			const tool = result.data!.capabilities?.tools?.SearchBun;
			expect(tool).toBeDefined();
			expect(tool!.name).toBe("SearchBun");
			expect(tool!.description.length).toBeGreaterThan(0);
			expect(tool!.inputSchema.properties.query).toBeDefined();
			expect(tool!.inputSchema.required).toContain("query");
		});
	});

	describe("validateManifest", () => {
		test("should return no issues for real manifest", async () => {
			expect.hasAssertions();
			const result = await fetchManifest();
			expect(result.ok).toBe(true);
			const issues = validateManifest(result.data!);
			expect(issues).toHaveLength(0);
		});

		test("should detect missing server.name", () => {
			const m: MCPManifest = {
				server: { name: "", version: "1.0", transport: "http" },
				capabilities: {
					tools: {
						SearchBun: {
							name: "SearchBun",
							description: "x",
							inputSchema: {
								type: "object",
								properties: { query: { type: "string", description: "q" } },
								required: ["query"],
							},
							operationId: "x",
						},
					},
					resources: [],
					prompts: [],
				},
			};
			const issues = validateManifest(m);
			expect(issues.some((i) => i.includes("server.name"))).toBe(true);
		});

		test("should detect missing SearchBun tool", () => {
			const m = {
				server: { name: "Bun", version: "1.0", transport: "http" },
				capabilities: { tools: {}, resources: [], prompts: [] },
			} as unknown as MCPManifest;
			const issues = validateManifest(m);
			expect(issues.some((i) => i.includes("SearchBun"))).toBe(true);
		});
	});
});
