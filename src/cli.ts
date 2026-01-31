#!/usr/bin/env bun
import { parseArgs } from "util";
import { profileCreate } from "./commands/profileCreate";
import { profileDiff } from "./commands/profileDiff";
import { profileExport } from "./commands/profileExport";
import { profileList } from "./commands/profileList";
import { profileShow } from "./commands/profileShow";
import { profileUse } from "./commands/profileUse";
import { EXIT_CODES } from "../.claude/lib/exit-codes.ts";
import { fmt } from "../.claude/lib/cli.ts";

function printUsage(): void {
	console.log(`
${fmt.bold("Usage:")} bun run matrix:profile:<command> [options]

${fmt.bold("Commands:")}
  profile:use <name>            Activate an environment profile
  profile:list                  List available profiles
  profile:show <name>           Show profile details
  profile:diff <left> <right>   Compare two profiles
  profile:create <name>         Create a new profile
  profile:export <name>         Export profile to .env format

${fmt.bold("Options for profile:use:")}
  --validate-rules       Validate profile before applying
  --dry-run              Preview changes without applying
  --environment, -e      Override NODE_ENV value
  --force, -f            Apply despite conflicts or warnings

${fmt.bold("Options for profile:diff:")}
  --all, -a              Show unchanged variables too

${fmt.bold("Options for profile:create:")}
  --from <profile>       Base new profile on existing one
  --environment, -e      Set NODE_ENV value
  --description, -d      Set profile description
  --force, -f            Overwrite if exists

${fmt.bold("Options for profile:export:")}
  --output, -o <file>    Write to file instead of stdout
  --resolve, -r          Resolve \${VAR} references
  --quote, -q            Always quote values

${fmt.bold("Examples:")}
  bun run matrix:profile:use dev --dry-run
  bun run matrix:profile:diff dev prod
  bun run matrix:profile:create staging --from=dev
  bun run matrix:profile:export prod -o .env.production
  eval $(bun run matrix:profile:use dev)
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

		default:
			console.error(fmt.fail(`Unknown command: ${command}`));
			printUsage();
			process.exit(EXIT_CODES.USAGE_ERROR);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(EXIT_CODES.GENERIC_ERROR);
});
