#!/usr/bin/env bun
/**
 * Kimi Settings Dashboard
 * Visual summary of Tier-1380 OMEGA configuration
 */

import { $ } from "bun";
import { homedir } from "os";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";

interface ConfigStatus {
	name: string;
	status: boolean;
	details?: string;
}

function printHeader(title: string): void {
	console.log(`\n${BOLD}${BLUE}┌${"─".repeat(58)}┐${RESET}`);
	console.log(
		`${BOLD}${BLUE}│${RESET} ${CYAN}${title.padEnd(56)}${RESET}${BOLD}${BLUE} │${RESET}`,
	);
	console.log(`${BOLD}${BLUE}└${"─".repeat(58)}┘${RESET}`);
}

function printStatusChart(items: ConfigStatus[]): void {
	console.log(
		`\n${DIM}  Status                          State     Details${RESET}`,
	);
	console.log(`  ${"─".repeat(56)}`);

	for (const item of items) {
		const status = item.status
			? `${GREEN}✓ ON${RESET}`
			: `${YELLOW}○ OFF${RESET}`;
		const details = item.details ? ` ${DIM}${item.details}${RESET}` : "";
		console.log(`  ${item.name.padEnd(30)} ${status.padEnd(10)}${details}`);
	}
}

function printConfigTable(
	title: string,
	configs: Record<string, string>,
): void {
	console.log(`\n  ${BOLD}${WHITE}${title}${RESET}`);
	console.log(`  ${"─".repeat(56)}`);

	for (const [key, value] of Object.entries(configs)) {
		console.log(`  ${DIM}${key.padEnd(20)}${RESET} ${value}`);
	}
}

async function checkComponent(path: string): Promise<boolean> {
	try {
		await $`test -e ${path}`.quiet();
		return true;
	} catch {
		return false;
	}
}

async function main(): Promise<void> {
	console.log(`${BOLD}${CYAN}`);
	console.log("  ╔══════════════════════════════════════════════════════════╗");
	console.log("  ║     🚀 KIMI TIER-1380 OMEGA SETTINGS DASHBOARD           ║");
	console.log("  ╚══════════════════════════════════════════════════════════╝");
	console.log(`${RESET}`);

	const home = homedir();

	// System Status
	printHeader("📊 SYSTEM STATUS");

	const components: ConfigStatus[] = [
		{
			name: "OpenClaw Gateway",
			status: await checkComponent(`${home}/openclaw`),
			details: "~/openclaw",
		},
		{
			name: "Matrix Agent",
			status: await checkComponent(`${home}/.matrix`),
			details: "~/.matrix",
		},
		{
			name: "Kimi Skills",
			status: await checkComponent(`${home}/.kimi/skills`),
			details: "~/.kimi/skills",
		},
		{
			name: "Tier-1380 Commit Flow",
			status: await checkComponent(`${home}/.kimi/skills/tier1380-commit-flow`),
			details: "commit governance",
		},
		{
			name: "MCP Integration",
			status: await checkComponent(`${home}/.kimi/mcp.json`),
			details: "MCP config",
		},
	];

	printStatusChart(components);

	// Shell Configuration
	printHeader("⚙️  SHELL CONFIGURATION");

	printConfigTable("Execution Settings", {
		Timeout: "300s",
		"Max Concurrent": "10",
		"Subcommand Depth": "10",
		"Allow Pipes": "Yes",
		"Shell Integration": "Enabled",
	});

	// Integrations
	printHeader("🔗 INTEGRATIONS");

	printConfigTable("OpenClaw", {
		"Gateway Port": "18789",
		"Local URL": "ws://127.0.0.1:18789",
		Tailscale: "nolas-mac-mini.tailb53dda.ts.net",
		Status: (await checkComponent(`${home}/openclaw`))
			? "Installed"
			: "Not Found",
	});

	printConfigTable("Matrix Agent", {
		Config: "~/.matrix/agent/config.json",
		Profiles: "~/.matrix/profiles",
		Version: "v1.0.0",
		Status: (await checkComponent(`${home}/.matrix`))
			? "Installed"
			: "Not Found",
	});

	// Active Skills
	printHeader("🎯 ACTIVE SKILLS");

	const skills = [
		{ name: "tier1380-commit-flow", desc: "Commit governance & validation" },
		{ name: "tier1380-openclaw", desc: "OpenClaw gateway integration" },
		{ name: "tier1380-omega", desc: "OMEGA protocol & Cloudflare" },
		{ name: "tier1380-infra", desc: "Infrastructure management" },
	];

	console.log(`\n  ${DIM}Skill                          Description${RESET}`);
	console.log(`  ${"─".repeat(56)}`);

	for (const skill of skills) {
		const installed = await checkComponent(
			`${home}/.kimi/skills/${skill.name}`,
		);
		const status = installed ? `${GREEN}●${RESET}` : `${YELLOW}○${RESET}`;
		console.log(
			`  ${status} ${skill.name.padEnd(28)} ${DIM}${skill.desc}${RESET}`,
		);
	}

	// MCP Tools
	printHeader("🛠️  MCP TOOLS AVAILABLE");

	const tools = [
		"shell_execute",
		"openclaw_status",
		"openclaw_gateway_restart",
		"matrix_agent_status",
		"matrix_bridge_status",
		"matrix_bridge_proxy",
		"profile_list",
		"profile_bind",
		"profile_switch",
		"cron_list",
	];

	console.log();
	for (let i = 0; i < tools.length; i += 2) {
		const col1 = `  ${GREEN}▸${RESET} ${tools[i].padEnd(24)}`;
		const col2 = tools[i + 1] ? `${GREEN}▸${RESET} ${tools[i + 1]}` : "";
		console.log(`${col1}${col2}`);
	}

	// Quick Commands
	printHeader("⌨️  QUICK COMMANDS");

	console.log(`
  ${BOLD}Status Checks:${RESET}
    ${CYAN}ocstatus${RESET}              One-shot status display
    ${CYAN}ocwatch${RESET}               Continuous monitoring
    ${CYAN}matrix-agent status${RESET}   Matrix Agent status

  ${BOLD}Bridge Commands:${RESET}
    ${CYAN}bun matrix-agent/integrations/openclaw-bridge.ts status${RESET}
    ${CYAN}bun matrix-agent/integrations/openclaw-bridge.ts proxy <cmd>${RESET}
    ${CYAN}bun matrix-agent/integrations/openclaw-bridge.ts matrix <cmd>${RESET}

  ${BOLD}Commit Flow:${RESET}
    ${CYAN}tier1380 c${RESET}            Create commit with governance
    ${CYAN}tier1380 g${RESET}            Generate commit message
    ${CYAN}tier1380 health${RESET}       Check commit flow health
`);

	// Footer
	console.log(`${DIM}  ┌${"─".repeat(58)}┐${RESET}`);
	console.log(
		`${DIM}  │${RESET}  ${CYAN}Tier-1380 OMEGA${RESET} v1.3.8 | ${GREEN}Bun${RESET} ${Bun.version}    ${DIM}│${RESET}`,
	);
	console.log(`${DIM}  └${"─".repeat(58)}┘${RESET}\n`);
}

if (import.meta.main) {
	main().catch(console.error);
}
