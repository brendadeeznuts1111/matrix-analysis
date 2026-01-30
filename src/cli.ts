#!/usr/bin/env bun
import { profileCreate } from "./commands/profile-create";
import { profileDiff } from "./commands/profile-diff";
import { profileExport } from "./commands/profile-export";
import { profileList } from "./commands/profile-list";
import { profileShow } from "./commands/profile-show";
import { profileUse } from "./commands/profile-use";

interface ParsedArgs {
	command: string;
	positional: string[];
	validateRules: boolean;
	dryRun: boolean;
	environment?: string;
	force: boolean;
	from?: string;
	output?: string;
	description?: string;
	resolve: boolean;
	quote: boolean;
	showUnchanged: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
	const result: ParsedArgs = {
		command: "",
		positional: [],
		validateRules: false,
		dryRun: false,
		force: false,
		resolve: false,
		quote: false,
		showUnchanged: false,
	};

	let i = 0;
	while (i < args.length) {
		const arg = args[i];

		if (arg === "--help" || arg === "-h") {
			result.command = "help";
		} else if (arg === "--validate-rules") {
			result.validateRules = true;
		} else if (arg === "--dry-run") {
			result.dryRun = true;
		} else if (arg === "--force" || arg === "-f") {
			result.force = true;
		} else if (arg === "--resolve" || arg === "-r") {
			result.resolve = true;
		} else if (arg === "--quote" || arg === "-q") {
			result.quote = true;
		} else if (arg === "--all" || arg === "-a") {
			result.showUnchanged = true;
		} else if (arg === "--environment" || arg === "-e") {
			i++;
			result.environment = args[i];
		} else if (arg.startsWith("--environment=")) {
			result.environment = arg.slice("--environment=".length);
		} else if (arg === "--from") {
			i++;
			result.from = args[i];
		} else if (arg.startsWith("--from=")) {
			result.from = arg.slice("--from=".length);
		} else if (arg === "--output" || arg === "-o") {
			i++;
			result.output = args[i];
		} else if (arg.startsWith("--output=")) {
			result.output = arg.slice("--output=".length);
		} else if (arg === "--description" || arg === "-d") {
			i++;
			result.description = args[i];
		} else if (arg.startsWith("--description=")) {
			result.description = arg.slice("--description=".length);
		} else if (!arg.startsWith("-")) {
			if (!result.command) {
				result.command = arg;
			} else {
				result.positional.push(arg);
			}
		}

		i++;
	}

	return result;
}

function printUsage(): void {
	console.log(`
\x1b[1mUsage:\x1b[0m bun run matrix:profile:<command> [options]

\x1b[1mCommands:\x1b[0m
  profile:use <name>            Activate an environment profile
  profile:list                  List available profiles
  profile:show <name>           Show profile details
  profile:diff <left> <right>   Compare two profiles
  profile:create <name>         Create a new profile
  profile:export <name>         Export profile to .env format

\x1b[1mOptions for profile:use:\x1b[0m
  --validate-rules       Validate profile before applying
  --dry-run              Preview changes without applying
  --environment, -e      Override NODE_ENV value
  --force, -f            Apply despite conflicts or warnings

\x1b[1mOptions for profile:diff:\x1b[0m
  --all, -a              Show unchanged variables too

\x1b[1mOptions for profile:create:\x1b[0m
  --from <profile>       Base new profile on existing one
  --environment, -e      Set NODE_ENV value
  --description, -d      Set profile description
  --force, -f            Overwrite if exists

\x1b[1mOptions for profile:export:\x1b[0m
  --output, -o <file>    Write to file instead of stdout
  --resolve, -r          Resolve \${VAR} references
  --quote, -q            Always quote values

\x1b[1mExamples:\x1b[0m
  bun run matrix:profile:use dev --dry-run
  bun run matrix:profile:diff dev prod
  bun run matrix:profile:create staging --from=dev
  bun run matrix:profile:export prod -o .env.production
  eval $(bun run matrix:profile:use dev)
`);
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const parsed = parseArgs(args);

	if (
		!parsed.command ||
		parsed.command === "help" ||
		parsed.command === "--help"
	) {
		printUsage();
		process.exit(0);
	}

	switch (parsed.command) {
		case "profile:use":
			if (parsed.positional.length < 1) {
				console.error("\x1b[31mError: Profile name is required\x1b[0m");
				console.error("Usage: bun run matrix:profile:use <name> [options]");
				process.exit(1);
			}
			await profileUse(parsed.positional[0], {
				validateRules: parsed.validateRules,
				dryRun: parsed.dryRun,
				environment: parsed.environment,
				force: parsed.force,
			});
			break;

		case "profile:list":
			await profileList();
			break;

		case "profile:show":
			if (parsed.positional.length < 1) {
				console.error("\x1b[31mError: Profile name is required\x1b[0m");
				console.error("Usage: bun run matrix:profile:show <name>");
				process.exit(1);
			}
			await profileShow(parsed.positional[0]);
			break;

		case "profile:diff":
			if (parsed.positional.length < 2) {
				console.error("\x1b[31mError: Two profile names are required\x1b[0m");
				console.error("Usage: bun run matrix:profile:diff <left> <right>");
				process.exit(1);
			}
			await profileDiff(parsed.positional[0], parsed.positional[1], {
				showUnchanged: parsed.showUnchanged,
			});
			break;

		case "profile:create":
			if (parsed.positional.length < 1) {
				console.error("\x1b[31mError: Profile name is required\x1b[0m");
				console.error("Usage: bun run matrix:profile:create <name> [options]");
				process.exit(1);
			}
			await profileCreate(parsed.positional[0], {
				from: parsed.from,
				env: parsed.environment,
				description: parsed.description,
				force: parsed.force,
			});
			break;

		case "profile:export":
			if (parsed.positional.length < 1) {
				console.error("\x1b[31mError: Profile name is required\x1b[0m");
				console.error("Usage: bun run matrix:profile:export <name> [options]");
				process.exit(1);
			}
			await profileExport(parsed.positional[0], {
				output: parsed.output,
				resolve: parsed.resolve,
				quote: parsed.quote,
			});
			break;

		default:
			console.error(`\x1b[31mUnknown command: ${parsed.command}\x1b[0m`);
			printUsage();
			process.exit(1);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
