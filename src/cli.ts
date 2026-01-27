import { profileUse } from "./commands/profile-use";
import { profileList } from "./commands/profile-list";
import { profileShow } from "./commands/profile-show";

interface ParsedArgs {
  command: string;
  profileName?: string;
  validateRules: boolean;
  dryRun: boolean;
  environment?: string;
  force: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: "",
    validateRules: false,
    dryRun: false,
    force: false,
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
    } else if (arg === "--force") {
      result.force = true;
    } else if (arg === "--environment" || arg === "-e") {
      i++;
      result.environment = args[i];
    } else if (arg.startsWith("--environment=")) {
      result.environment = arg.slice("--environment=".length);
    } else if (!arg.startsWith("-")) {
      if (!result.command) {
        result.command = arg;
      } else if (!result.profileName) {
        result.profileName = arg;
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
  profile:use <name>     Activate an environment profile
  profile:list           List available profiles
  profile:show <name>    Show profile details

\x1b[1mOptions for profile:use:\x1b[0m
  --validate-rules       Validate profile before applying
  --dry-run              Preview changes without applying
  --environment <env>    Override NODE_ENV value
  --force                Apply despite conflicts or warnings

\x1b[1mExamples:\x1b[0m
  bun run matrix:profile:use dev --dry-run
  bun run matrix:profile:use prod --validate-rules --force
  eval $(bun run matrix:profile:use dev)
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  if (!parsed.command || parsed.command === "help" || parsed.command === "--help") {
    printUsage();
    process.exit(0);
  }

  switch (parsed.command) {
    case "profile:use":
      if (!parsed.profileName) {
        console.error("\x1b[31mError: Profile name is required\x1b[0m");
        console.error("Usage: bun run matrix:profile:use <name> [options]");
        process.exit(1);
      }
      await profileUse(parsed.profileName, {
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
      if (!parsed.profileName) {
        console.error("\x1b[31mError: Profile name is required\x1b[0m");
        console.error("Usage: bun run matrix:profile:show <name>");
        process.exit(1);
      }
      await profileShow(parsed.profileName);
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
