#!/usr/bin/env bun
/**
 * Generate Tier-1380 OMEGA Commit Message
 * Based on staged changes
 */

import { $ } from "bun";

interface ChangeAnalysis {
	files: string[];
	domains: string[];
	components: string[];
	tier: string;
	description: string;
}

async function analyzeChanges(): Promise<ChangeAnalysis> {
	// Get staged files
	const output = await $`git diff --cached --name-only`.text();
	const files = output.trim().split("\n").filter(Boolean);

	// Determine domain from files
	const domains = determineDomains(files);
	const components = determineComponents(files);
	const tier = determineTier(files);
	const description = generateDescription(files);

	return {
		files,
		domains,
		components,
		tier,
		description,
	};
}

function determineDomains(files: string[]): string[] {
	const domains = new Set<string>();

	for (const file of files) {
		if (file.startsWith("chrome-state/")) domains.add("RUNTIME");
		if (file.startsWith("matrix/")) domains.add("PLATFORM");
		if (file.startsWith("omega-blast/")) domains.add("RUNTIME");
		if (file.startsWith("tension-field/")) domains.add("PLATFORM");
		if (file.startsWith("config/")) domains.add("CONFIG");
		if (file.startsWith("docs/")) domains.add("DOCS");
		if (file.startsWith("tests/")) domains.add("TEST");
		if (file.startsWith("benchmarks/")) domains.add("BENCH");
		if (file.includes("skill")) domains.add("PLATFORM");
		if (file.includes("security")) domains.add("SECURITY");
		if (file.includes("api")) domains.add("API");
		if (file.includes("ui") || file.includes("dashboard")) domains.add("UI");
	}

	return Array.from(domains).length > 0 ? Array.from(domains) : ["PLATFORM"];
}

function determineComponents(files: string[]): string[] {
	const components = new Set<string>();

	for (const file of files) {
		if (file.startsWith("chrome-state/")) components.add("CHROME");
		if (file.startsWith("matrix/")) components.add("MATRIX");
		if (file.startsWith("omega-blast/")) components.add("BLAST");
		if (file.startsWith("tension-field/")) components.add("TELEMETRY");
		if (file.startsWith(".agents/skills/")) components.add("SKILLS");
		if (file.startsWith("config/")) components.add("BUILD");
		if (file.includes("deploy")) components.add("DEPLOY");
		if (file.includes("kimi")) components.add("KIMI");
	}

	return Array.from(components).length > 0
		? Array.from(components)
		: ["MATRIX"];
}

function determineTier(_files: string[]): string {
	// Default to 1380 for this project
	return "1380";
}

function generateDescription(files: string[]): string {
	// Analyze file patterns to generate description
	const extensions = new Map<string, number>();
	const actions = new Set<string>();

	for (const file of files) {
		// Count extensions
		const ext = file.split(".").pop() || "";
		extensions.set(ext, (extensions.get(ext) || 0) + 1);

		// Detect action from diff (simplified)
		if (file.includes("test")) actions.add("test");
		if (file.includes("fix")) actions.add("fix");
		if (file.includes("add")) actions.add("add");
	}

	// Generate description
	const mainExt = Array.from(extensions.entries()).sort(
		(a, b) => b[1] - a[1],
	)[0]?.[0];
	const fileCount = files.length;

	if (files.length === 1) {
		return `Update ${files[0]?.split("/").pop()}`;
	}

	if (actions.has("fix")) {
		return `Fix ${mainExt} files (${fileCount} files)`;
	}

	if (actions.has("add")) {
		return `Add ${mainExt} functionality`;
	}

	return `Update ${mainExt} files (${fileCount} files)`;
}

// Main
if (import.meta.main) {
	console.log("🔍 Analyzing staged changes...\n");

	const analysis = await analyzeChanges();

	console.log("Files changed:");
	for (const file of analysis.files.slice(0, 10)) {
		console.log(`  • ${file}`);
	}
	if (analysis.files.length > 10) {
		console.log(`  ... and ${analysis.files.length - 10} more`);
	}

	console.log();
	console.log("Analysis:");
	console.log(`  Domain: ${analysis.domains.join(", ")}`);
	console.log(`  Component: ${analysis.components.join(", ")}`);
	console.log(`  Tier: ${analysis.tier}`);
	console.log();

	// Generate suggestions
	const domain = analysis.domains[0] || "PLATFORM";
	const component = analysis.components[0] || "MATRIX";
	const tier = analysis.tier;
	const desc = analysis.description;

	const suggestions = [
		`[${domain}][COMPONENT:${component}][TIER:${tier}] ${desc}`,
		`[${domain}][COMPONENT:${component}][TIER:${tier}] Refactor ${desc.toLowerCase()}`,
		`[${domain}][COMPONENT:${component}][TIER:${tier}] Optimize ${desc.toLowerCase()}`,
	];

	console.log("Standard format:");
	for (let i = 0; i < suggestions.length; i++) {
		console.log(`  ${i + 1}. ${suggestions[i]}`);
	}

	// Extended format examples
	console.log("\nExtended format (rich metadata):");
	// Determine type from description
	const type = desc.toLowerCase().includes("fix")
		? "FIX"
		: desc.toLowerCase().includes("test")
			? "TEST"
			: desc.toLowerCase().includes("refactor")
				? "REFACTOR"
				: desc.toLowerCase().includes("perf")
					? "PERF"
					: desc.toLowerCase().includes("doc")
						? "DOCS"
						: "FEAT";
	const extended = [
		`[${domain}][${component}][${type}][META:{TIER:${tier}}] ${desc} [BUN-NATIVE]`,
		`[${domain}][${component}][${type}][META:{TIER:${tier}}] ${desc} [#REF:#123]`,
	];
	for (let i = 0; i < extended.length; i++) {
		console.log(`  ${i + 1}. ${extended[i]}`);
	}

	console.log();
	console.log("Use with:");
	console.log(`  git commit -m "${suggestions[0]}"`);
	console.log(`  # Or extended: git commit -m "${extended[0]}"`);
}

export { analyzeChanges, generateDescription };
