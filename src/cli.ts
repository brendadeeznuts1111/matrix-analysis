#!/usr/bin/env bun
import { parseArgs } from "util";
import { profileCreate } from "./commands/profileCreate";
import { profileDiff } from "./commands/profileDiff";
import { profileExport } from "./commands/profileExport";
import { profileList } from "./commands/profileList";
import { profileShow } from "./commands/profileShow";
import { profileUse } from "./commands/profileUse";
import { linksCheck, linksQuick } from "./commands/linksCheck";
import { openclawStatus, openclawHealth, openclawInfo } from "./commands/openclawStatus";
import { DEFAULT_HOST, OPENCLAW_GATEWAY_PORT } from "./constants";
import { EXIT_CODES } from "../.claude/lib/exit-codes.ts";
import { fmt } from "../.claude/lib/cli.ts";

function printUsage(): void {
	console.log(`
${fmt.bold("📊 Matrix CLI - Environment Profile & Infrastructure Management")}

${fmt.bold("Usage:")} bun run matrix:<command> [options]

${fmt.bold("🔧 Profile Commands:")}
  profile:use <name>            Activate an environment profile
  profile:list                  List available profiles
  profile:show <name>           Show profile details
  profile:diff <left> <right>   Compare two profiles
  profile:create <name>         Create a new profile
  profile:export <name>         Export profile to .env format

${fmt.bold("🔗 Link Checking Commands:")}
  links:check                   Check all links in documentation
  links:quick                   Quick check for internal links only

${fmt.bold("🐾 OpenClaw Commands:")}
  openclaw:status               Show OpenClaw infrastructure status
  openclaw:status --watch       Continuous monitoring mode
  openclaw:status --json        JSON output
  openclaw:health               Run health checks on components
  openclaw:info                 Show system information

${fmt.bold("⚙️  Options for profile:use:")}
  --validate-rules       Validate profile before applying
  --dry-run              Preview changes without applying
  --environment, -e      Override NODE_ENV value
  --force, -f            Apply despite conflicts or warnings

${fmt.bold("⚙️  Options for profile:diff:")}
  --all, -a              Show unchanged variables too

${fmt.bold("⚙️  Options for profile:create:")}
  --from <profile>       Base new profile on existing one
  --environment, -e      Set NODE_ENV value
  --description, -d      Set profile description
  --force, -f            Overwrite if exists

${fmt.bold("⚙️  Options for profile:export:")}
  --output, -o <file>    Write to file instead of stdout
  --resolve, -r          Resolve \${VAR} references
  --quote, -q            Always quote values

${fmt.bold("⚙️  Options for links:check:")}
  --verbose, -v          Show detailed output
  --external, -e         Check external links (slower)
  --export <format>      Export results (json|csv)
  --directory, -d <dir>  Directory to check (default: .)

${fmt.bold("⚙️  Options for openclaw:status:")}
  --watch, -w            Continuous monitoring mode
  --json, -j             JSON output
  --interval, -i <ms>    Refresh interval in ms (default: 5000)

${fmt.bold("📚 Quick Links:")}
  📘 Docs:     https://github.com/nolarose/nolarose-mcp-config#readme
  🐛 Issues:   https://github.com/nolarose/nolarose-mcp-config/issues
  🔗 OpenClaw: ws://${DEFAULT_HOST}:${OPENCLAW_GATEWAY_PORT}
  📊 Dashboard: file://~/monitoring/dashboard/index.html

${fmt.bold("💡 Examples:")}
  bun run matrix:profile:use dev --dry-run
  bun run matrix:profile:diff dev prod
  bun run matrix:profile:create staging --from=dev
  bun run matrix:profile:export prod -o .env.production
  eval $(bun run matrix:profile:use dev)
  bun run matrix:links:check --verbose
  bun run matrix:links:quick
  bun run matrix:openclaw:status
  bun run matrix:openclaw:status --watch
  bun run matrix:openclaw:health
`);
}

async function main(): Promise<void> {
	const args = Bun.argv.slice(2);

	// Extract the command (first non-flag arg)
	const commandIndex = args.findIndex((a) => !a.startsWith("-"));
	const command = commandIndex >= 0 ? args[commandIndex] : "";
	const restArgs = args.filter((_, i) => i !== commandIndex);

	// Show help if no command or --help
	if (!command || command === "help" || args.includes("--help") || args.includes("-h")) {
		printUsage();
		process.exit(EXIT_CODES.SUCCESS);
	}

	const { values, positionals } = parseArgs({
		args: restArgs,
		options: {
			"validate-rules": { type: "boolean", default: false },
			"dry-run": { type: "boolean", default: false },
			environment: { type: "string", short: "e" },
			force: { type: "boolean", short: "f", default: false },
			from: { type: "string" },
			output: { type: "string", short: "o" },
			description: { type: "string", short: "d" },
			resolve: { type: "boolean", short: "r", default: false },
			quote: { type: "boolean", short: "q", default: false },
			all: { type: "boolean", short: "a", default: false },
			verbose: { type: "boolean", short: "v", default: false },
			external: { type: "boolean", short: "e", default: false },
			export: { type: "string" },
			directory: { type: "string", short: "d" },
			json: { type: "boolean", short: "j" },
			watch: { type: "boolean", short: "w" },
			interval: { type: "string", short: "i" },
		},
		allowPositionals: true,
		strict: false,
	});

	switch (command) {
		case "profile:use":
			if (positionals.length < 1) {
				console.error(fmt.fail("Profile name is required"));
				console.error("Usage: bun run matrix:profile:use <name> [options]");
				process.exit(EXIT_CODES.USAGE_ERROR);
			}
			await profileUse(positionals[0], {
				validateRules: !!values["validate-rules"],
				dryRun: !!values["dry-run"],
				environment: values["environment"] as string | undefined,
				force: !!values["force"],
			});
			break;

		case "profile:list":
			await profileList();
			break;

		case "profile:show":
			if (positionals.length < 1) {
				console.error(fmt.fail("Profile name is required"));
				console.error("Usage: bun run matrix:profile:show <name>");
				process.exit(EXIT_CODES.USAGE_ERROR);
			}
			await profileShow(positionals[0]);
			break;

		case "profile:diff":
			if (positionals.length < 2) {
				console.error(fmt.fail("Two profile names are required"));
				console.error("Usage: bun run matrix:profile:diff <left> <right>");
				process.exit(EXIT_CODES.USAGE_ERROR);
			}
			await profileDiff(positionals[0], positionals[1], {
				showUnchanged: !!values["all"],
			});
			break;

		case "profile:create":
			if (positionals.length < 1) {
				console.error(fmt.fail("Profile name is required"));
				console.error("Usage: bun run matrix:profile:create <name> [options]");
				process.exit(EXIT_CODES.USAGE_ERROR);
			}
			await profileCreate(positionals[0], {
				from: values["from"] as string | undefined,
				env: values["environment"] as string | undefined,
				description: values["description"] as string | undefined,
				force: !!values["force"],
			});
			break;

		case "profile:export":
			if (positionals.length < 1) {
				console.error(fmt.fail("Profile name is required"));
				console.error("Usage: bun run matrix:profile:export <name> [options]");
				process.exit(EXIT_CODES.USAGE_ERROR);
			}
			await profileExport(positionals[0], {
				output: values["output"] as string | undefined,
				resolve: !!values["resolve"],
				quote: !!values["quote"],
			});
			break;

		case "links:check":
			await linksCheck({
				verbose: !!values["verbose"],
				external: !!values["external"],
				export: values["export"] as 'json' | 'csv' | undefined,
				directory: values["directory"] as string | undefined,
			});
			break;

		case "links:quick":
			await linksQuick(values["directory"] as string || '.');
			break;

		case "openclaw:status":
			await openclawStatus({
				json: !!values["json"],
				watch: !!values["watch"],
				interval: parseInt(values["interval"] as string) || 5000,
			});
			break;

		case "openclaw:health":
			await openclawHealth();
			break;

		case "openclaw:info":
			await openclawInfo();
			break;

		default:
			console.error(fmt.fail(`Unknown command: ${command}`));
			printUsage();
			process.exit(EXIT_CODES.USAGE_ERROR);
	}
}

main().catch((err) => {
	if (err instanceof Error) {
		console.error(fmt.fail(`Error: ${err.message}`));
		if (process.env.DEBUG) {
			console.error(err.stack);
		}
	} else {
		console.error(fmt.fail(`Unknown error: ${String(err)}`));
	}
	process.exit(EXIT_CODES.GENERIC_ERROR);
});
