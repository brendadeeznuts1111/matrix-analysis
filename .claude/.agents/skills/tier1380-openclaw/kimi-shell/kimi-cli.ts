#!/usr/bin/env bun
/**
 * Kimi CLI - Unified interface for Kimi Shell tools
 */

import { $ } from "bun";

const COMMANDS = {
	metrics: {
		description: "Metrics collection and dashboard",
		script: "metrics-collector.ts",
		subcommands: ["collect", "dashboard", "record", "export"],
	},
	shell: {
		description: "Shell management and execution",
		script: "kimi-shell-manager.ts",
		subcommands: ["status", "exec", "switch", "integrations"],
	},
	settings: {
		description: "Settings dashboard",
		script: "settings-dashboard.ts",
		subcommands: [],
	},
	workflow: {
		description: "Workflow visualizer",
		script: "workflow-visualizer.ts",
		subcommands: ["mcp", "acp", "integrated", "matrix"],
	},
	vault: {
		description: "Vault credential management",
		script: "../../../../../../.factory-wager/vault.ts",
		subcommands: ["health", "list"],
	},
};

function printHelp(): void {
	console.log("🐚 Kimi CLI - Unified Shell Interface");
	console.log("");
	console.log("Usage: kimi-cli.ts <command> [args...]");
	console.log("");
	console.log("Commands:");

	for (const [name, config] of Object.entries(COMMANDS)) {
		console.log(`  ${name.padEnd(12)} ${config.description}`);
		if (config.subcommands.length > 0) {
			console.log(`             Sub: ${config.subcommands.join(", ")}`);
		}
	}

	console.log("");
	console.log("Examples:");
	console.log("  kimi-cli.ts metrics dashboard");
	console.log("  kimi-cli.ts shell status");
	console.log("  kimi-cli.ts vault health");
}

async function main(): Promise<void> {
	const args = Bun.argv.slice(2);
	const command = args[0];
	const subArgs = args.slice(1);

	if (!command || command === "--help" || command === "-h") {
		printHelp();
		return;
	}

	const config = COMMANDS[command as keyof typeof COMMANDS];
	if (!config) {
		console.error(`Unknown command: ${command}`);
		printHelp();
		process.exit(1);
	}

	const scriptPath = new URL(config.script, import.meta.url).pathname;

	try {
		const result = await $`bun ${scriptPath} ${subArgs}`.nothrow();
		console.log(result.stdout.toString());
		if (result.stderr.toString()) {
			console.error(result.stderr.toString());
		}
		process.exit(result.exitCode);
	} catch (error) {
		console.error(`Error executing ${command}:`, error);
		process.exit(1);
	}
}

if (import.meta.main) {
	main().catch(console.error);
}
