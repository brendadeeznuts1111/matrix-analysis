#!/usr/bin/env bun
// scripts/pm.ts
// Bun Package Manager CLI with Workspace Support

import { parseArgs } from "util";
import { spawn } from "bun";

interface PmOptions {
  filter?: string;
  filterExclude?: string;
  workspaces?: boolean;
  strategy?: string;
  minAge?: string;
  platform?: string;
  dev?: boolean;
  optional?: boolean;
  global?: boolean;
  production?: boolean;
  frozenLockfile?: boolean;
  dryRun?: boolean;
  trust?: boolean;
  verbose?: boolean;
  silent?: boolean;
  help?: boolean;
}

export async function pmCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      "filter": { type: "string", short: "f" },
      "filter-exclude": { type: "string" },
      "workspaces": { type: "boolean", short: "w" },
      "strategy": { type: "string", short: "s" },
      "min-age": { type: "string" },
      "platform": { type: "string" },
      "dev": { type: "boolean", short: "d" },
      "optional": { type: "boolean" },
      "global": { type: "boolean", short: "g" },
      "production": { type: "boolean", short: "p" },
      "frozen-lockfile": { type: "boolean" },
      "dry-run": { type: "boolean" },
      "trust": { type: "boolean" },
      "verbose": { type: "boolean" },
      "silent": { type: "boolean" },
      "help": { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const opts: PmOptions = {
    filter: values.filter,
    filterExclude: values["filter-exclude"],
    workspaces: values.workspaces,
    strategy: values.strategy,
    minAge: values["min-age"],
    platform: values.platform,
    dev: values.dev,
    optional: values.optional,
    global: values.global,
    production: values.production,
    frozenLockfile: values["frozen-lockfile"],
    dryRun: values["dry-run"],
    trust: values.trust,
    verbose: values.verbose,
    silent: values.silent,
    help: values.help,
  };

  if (opts.help || positionals.length === 0) {
    showPmHelp();
    return;
  }

  const [action, ...packages] = positionals;

  switch (action) {
    case "install":
    case "i":
      await handleInstall(opts);
      break;
    case "add":
    case "a":
      await handleAdd(packages, opts);
      break;
    case "remove":
    case "rm":
      await handleRemove(packages, opts);
      break;
    case "run":
    case "r":
      await handleRun(packages[0], opts);
      break;
    case "test":
    case "t":
      await handleTest(opts);
      break;
    case "ls":
    case "list":
      await handleList(opts);
      break;
    case "outdated":
      await handleOutdated();
      break;
    case "update":
      await handleUpdate(packages, opts);
      break;
    case "why":
      await handleWhy(packages[0]);
      break;
    default:
      console.error(`❌ Unknown action: ${action}`);
      showPmHelp();
      process.exit(1);
  }
}

async function handleInstall(opts: PmOptions) {
  const bunArgs = ["install"];

  // Workspace filters (MUST come after 'install')
  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.filterExclude) bunArgs.push("--filter", opts.filterExclude);
  if (opts.workspaces) bunArgs.push("--workspaces");

  // Installation options
  if (opts.strategy) bunArgs.push("--linker", opts.strategy);
  if (opts.minAge) bunArgs.push("--minimum-release-age", parseMinAge(opts.minAge));
  if (opts.production) bunArgs.push("--production");
  if (opts.frozenLockfile) bunArgs.push("--frozen-lockfile");
  if (opts.dryRun) bunArgs.push("--dry-run");
  if (opts.verbose) bunArgs.push("--verbose");
  if (opts.silent) bunArgs.push("--silent");

  await runBun(bunArgs);
}

async function handleAdd(packages: string[], opts: PmOptions) {
  if (packages.length === 0 && !opts.workspaces) {
    console.error("❌ No packages specified (use --workspaces for all)");
    process.exit(1);
  }

  const bunArgs = ["add"];

  // Workspace filters
  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.filterExclude) bunArgs.push("--filter", opts.filterExclude);
  if (opts.workspaces) bunArgs.push("--workspaces");

  // Dependency type
  if (opts.dev) bunArgs.push("--dev");
  if (opts.optional) bunArgs.push("--optional");
  if (opts.global) bunArgs.push("--global");
  if (opts.trust) bunArgs.push("--trust");

  // Supply chain protection
  if (opts.minAge) bunArgs.push("--minimum-release-age", parseMinAge(opts.minAge));

  // Add packages
  bunArgs.push(...packages);

  await runBun(bunArgs);
}

async function handleRemove(packages: string[], opts: PmOptions) {
  if (packages.length === 0) {
    console.error("❌ No packages specified");
    process.exit(1);
  }

  const bunArgs = ["remove"];

  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.global) bunArgs.push("--global");

  bunArgs.push(...packages);

  await runBun(bunArgs);
}

async function handleRun(script: string, opts: PmOptions) {
  if (!script) {
    console.error("❌ No script specified");
    process.exit(1);
  }

  const bunArgs = ["run"];

  // Workspace filters
  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.filterExclude) bunArgs.push("--filter", opts.filterExclude);
  if (opts.workspaces) bunArgs.push("--workspaces");

  bunArgs.push(script);

  await runBun(bunArgs);
}

async function handleTest(opts: PmOptions) {
  const bunArgs = ["test"];

  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (opts.filterExclude) bunArgs.push("--filter", opts.filterExclude);
  if (opts.workspaces) bunArgs.push("--workspaces");

  await runBun(bunArgs);
}

async function handleList(opts: PmOptions) {
  const bunArgs = ["pm", "ls"];

  if (opts.global) bunArgs.push("-g");

  await runBun(bunArgs);
}

async function handleOutdated() {
  await runBun(["outdated"]);
}

async function handleUpdate(packages: string[], opts: PmOptions) {
  const bunArgs = ["update"];

  if (opts.filter) bunArgs.push("--filter", opts.filter);
  if (packages.length > 0) bunArgs.push(...packages);

  await runBun(bunArgs);
}

async function handleWhy(pkg: string) {
  if (!pkg) {
    console.error("❌ No package specified");
    process.exit(1);
  }

  // bun pm why <pkg> - shows why a package is installed
  await runBun(["pm", "why", pkg]);
}

function parseMinAge(duration: string): string {
  // Convert human-readable duration to seconds
  const match = duration.match(/^(\d+)(s|m|h|d|w)$/);
  if (!match) return duration; // Already in seconds

  const [, num, unit] = match;
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  return String(parseInt(num) * multipliers[unit]);
}

async function runBun(args: string[]) {
  console.log(`$ bun ${args.join(" ")}`);

  const proc = spawn(["bun", ...args], {
    stdio: ["inherit", "inherit", "inherit"],
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

function showPmHelp() {
  console.log(`
📦 Package Management Commands (Bun 1.3.6 + Workspaces)

Usage: bun scripts/pm.ts <action> [packages...] [options]

Actions:
  install, i          Install dependencies
  add, a              Add packages
  remove, rm          Remove packages
  run, r              Run a script
  test, t             Run tests
  ls, list            List installed packages
  outdated            Show outdated packages
  update              Update packages
  why <pkg>           Show why a package is installed

Workspace Options:
  -f, --filter <pkg>  Filter to specific workspace (@enterprise/dataview)
  --filter-exclude    Exclude pattern (!@enterprise/pkg)
  -w, --workspaces    Run in all workspaces

Dependency Options:
  -d, --dev           Add as devDependency
  --optional          Add as optionalDependency
  -g, --global        Global install/remove
  --trust             Add to trustedDependencies

Installation Options:
  -s, --strategy      Linker: hoisted | isolated
  --min-age <dur>     Minimum release age (3d, 1w, etc.)
  -p, --production    Skip devDependencies
  --frozen-lockfile   Error if lockfile changes (CI)
  --dry-run           Show what would be done
  --verbose           Debug logging
  --silent            No logging

Examples:
  # Install in specific workspace
  bun scripts/pm.ts install --filter @enterprise/dataview

  # Install in all workspaces
  bun scripts/pm.ts install --workspaces

  # Add package to workspace with supply chain protection
  bun scripts/pm.ts add zod --filter @enterprise/dataview --min-age 3d

  # Test all workspaces except s3-project
  bun scripts/pm.ts test --filter '!@enterprise/s3-project'

  # Run script in workspace
  bun scripts/pm.ts run build --filter @enterprise/dataview

  # CI install (frozen lockfile, production only)
  bun scripts/pm.ts install --frozen-lockfile --production
`);
}

// CLI entry point
if (import.meta.main) {
  await pmCommand(process.argv.slice(2));
}
